import { auth } from '../auth.js';
import { db } from '../database.js'; // IMPORT DATABASE

const malwareApp = {
    state: {
        // Game Stats
        health: 100,
        currentScore: 0,
        scores: { 1: 0, 2: 0, 3: 0 }, 
        activeSubLevel: 0,
        unlockedSubLevels: 1, 
        feedbackLogs: [],

        // Level Specific States
        timer: null,
        infectionActive: false,
        processKilled: false,
        filesQuarantined: false,
        scanComplete: false,
        
        // Level 2 (Worm) States
        nodes: [],
        connections: [],
        firewallActive: false,
        patchReady: false,
        wormInterval: null,
        
        // Level 3 (Ransomware) States
        wifiConnected: true,
        ransomTimer: 60,
        filesRestored: 0,
        ransomInterval: null,
        
        // Audio & Utils
        audioCtx: null,
        voices: [], // ADDED: Voice storage
        popupInterval: null,
        scoreFlags: {},
        
        // User Info & Cloud State
        userId: 'guest',
        docId: null,      // Appwrite Document ID
        allScores: "{}"   // Raw JSON string for merging
    },

    init: async function() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.state.audioCtx = new AudioContext();
        } catch(e) { console.log("Audio not supported"); }

        // --- ADDED: VOICE SETUP ---
        if('speechSynthesis' in window) {
            window.speechSynthesis.onvoiceschanged = () => {
                this.state.voices = window.speechSynthesis.getVoices();
            };
        }
        
        // 1. GET CURRENT USER & CLOUD DATA
        const user = await auth.getCurrentUser();
        
        if(user) {
            this.state.userId = user.$id;
            console.log("Module 2 loaded for:", user.name);

            // --- APPWRITE: LOAD PROGRESS ---
            const progress = await db.getUserProgress(user.$id);
            
            if(progress) {
                this.state.docId = progress.$id;
                this.state.allScores = progress.scores;
                
                // A. CHECK LOCK (Must complete Mod 1 first)
                if(!progress.mod1_complete) {
                    alert("ACCESS DENIED: You must complete Module 1 first.");
                    window.location.href = 'module1.html'; // Redirect to main menu
                    return;
                }

                // B. RESTORE MODULE 2 SCORES
                try {
                    const parsed = JSON.parse(progress.scores);
                    if(parsed.m2) {
                        this.state.scores = parsed.m2;
                        // Calculate unlocked levels based on saved scores
                        if(this.state.scores[1] > 0) this.state.unlockedSubLevels = 2;
                        if(this.state.scores[2] > 0) this.state.unlockedSubLevels = 3;
                    }
                } catch(e) {
                    console.error("Score parse error:", e);
                }
            }
            // -------------------------------
        } else {
            console.log("Playing as Guest");
        }
        
        document.getElementById('hud').classList.add('hidden');
        this.updateMenuUI();
        
        // Resume Audio Context on click
        document.body.addEventListener('click', () => {
            if (this.state.audioCtx && this.state.audioCtx.state === 'suspended') this.state.audioCtx.resume();
        }, { once: true });
    },

    // --- NAVIGATION & UI ---
    openManual: function() { document.getElementById('modal-manual').classList.remove('hidden'); },
    closeManual: function() { document.getElementById('modal-manual').classList.add('hidden'); },
    
    returnToMenu: function() {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
        document.getElementById('screen-sublevel-menu').classList.add('active');
        document.getElementById('glitch-layer').classList.add('hidden');
        document.getElementById('hud').classList.add('hidden');
        this.updateMenuUI();
    },

    updateMenuUI: function() {
        for(let i = 1; i <= 3; i++) {
            const card = document.getElementById(`sub-card-${i}`);
            if(!card) continue;
            
            // Clone to remove old listeners
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
            
            if(i <= this.state.unlockedSubLevels) {
                newCard.classList.remove('locked'); 
                newCard.classList.add('available');
                newCard.style.cursor = "pointer"; 
                newCard.onclick = () => this.initLevel(i);
            } else {
                newCard.classList.add('locked'); 
                newCard.classList.remove('available');
                newCard.style.cursor = "not-allowed"; 
                newCard.onclick = null;
            }
        }
    },

    // --- LEVEL INITIALIZATION ---
    initLevel: function(id) {
    if (id > this.state.unlockedSubLevels) return;

    this.state.activeSubLevel = id;
    this.state.health = 100;
    this.state.currentScore = 0;
    this.state.scoreFlags = {};

    // Clear previous intervals
    clearInterval(this.state.wormInterval);
    clearInterval(this.state.ransomInterval);
    clearInterval(this.popupInterval);

    this.updateHUD();

    const stepsContainer = document.getElementById('brief-steps');
    let stepsHTML = "";

    if (id === 1) {
        stepsHTML = `
            <ul class="level-steps">
                <li>Investigate suspicious file <b>Free_RAM.exe</b></li>
                <li>Terminate the malicious process (20 pts)</li>
                <li>Quarantine the file (10 pts)</li>
                <li>Run a full system scan (10 pts)</li>
            </ul>
        `;
    } 
    else if (id === 2) {
        stepsHTML = `
            <ul class="level-steps">
                <li>Identify worm activity on the system</li>
                <li>Prevent lateral movement across the network</li>
                <li>Apply security patches</li>
                <li>Maintain system stability to earn bonus points (30 pts)</li>
            </ul>
        `;
    } 
    else if (id === 3) {
        stepsHTML = `
            <ul class="level-steps">
                <li><b>Ransomware detected — files encrypted</b></li>
                <li>Disable Wi-Fi to isolate the system (10 pts)</li>
                <li>Reboot into recovery mode (10 pts)</li>
                <li>Restore files from backup (10 pts)</li>
            </ul>
        `;
    }

    if (stepsContainer) {
        stepsContainer.innerHTML = stepsHTML;
    }

    document.getElementById('modal-briefing').classList.remove('hidden');
},


    startMission: function() {
        document.getElementById('modal-briefing').classList.add('hidden');
        document.getElementById('screen-sublevel-menu').classList.remove('active');
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('hud').classList.remove('hidden');
        
        if(this.state.activeSubLevel === 1) { 
            document.getElementById('game-lvl1').classList.add('active'); 
            this.resetLevel1(); 
        } else if(this.state.activeSubLevel === 2) { 
            document.getElementById('game-lvl2').classList.add('active'); 
            this.initNetworkMap(); 
        } else if(this.state.activeSubLevel === 3) { 
            document.getElementById('game-lvl3').classList.add('active'); 
            this.l3_startRansomware(); 
        }
    },

    // --- LEVEL 1 LOGIC (TROJAN) ---
    resetLevel1: function() {
        this.state.processKilled = false; 
        this.state.filesQuarantined = false; 
        this.state.scanComplete = false; 
        this.state.infectionActive = false;
        
        document.getElementById('malware-file').style.display = 'flex';
        const procRow = document.getElementById('proc-malware');
        procRow.classList.add('hidden'); 
        procRow.style.textDecoration = 'none'; 
        procRow.style.color = 'inherit';
        
        const killBtn = document.querySelector('.btn-kill');
        killBtn.disabled = false; 
        killBtn.style.background = 'var(--neon-red)';
        
        document.getElementById('glitch-layer').classList.add('hidden'); 
        document.getElementById('popups-layer').innerHTML = '';
        
        const scanBtn = document.getElementById('btn-full-scan');
        scanBtn.disabled = true; 
        scanBtn.innerText = "RUN FULL SCAN";
        
        const avStatus = document.getElementById('av-status');
        avStatus.innerText = "VULNERABLE"; 
        avStatus.style.color = "inherit";
        
        document.getElementById('scan-fill').style.width = '0%'; 
        document.getElementById('scan-progress').classList.add('hidden');
        
        this.updateHUD();
        
        // --- VOICE ADDED ---
        this.speak("Malware detected. System unstable. Terminate the process and quarantine the file.");
    },

    openApp: function(appName) {
        if(appName === 'taskmgr') document.getElementById('win-taskmgr').classList.remove('hidden');
        if(appName === 'av') document.getElementById('win-av').classList.remove('hidden');
        if(appName === 'browser') this.showSystemMessage("ERROR", "Browser corrupted. Cannot open.");
        if(appName === 'documents') this.showSystemMessage("ERROR", "Files encrypted.");
    },

    closeApp: function(appName) {
        if(appName === 'taskmgr') document.getElementById('win-taskmgr').classList.add('hidden');
        if(appName === 'av') document.getElementById('win-av').classList.add('hidden');
    },

    triggerInfection: function() {
        if(this.state.infectionActive) return;
        this.state.infectionActive = true; 
        this.updateHUD();
        document.getElementById('glitch-layer').classList.remove('hidden');
        document.getElementById('proc-malware').classList.remove('hidden');
        this.playGlitchSound();
        
        this.popupInterval = setInterval(() => {
            if(this.state.health > 0) {
                this.spawnPopup(); 
                this.state.health -= 5; 
                this.updateHUD(); 
                this.playGlitchSound();
            } else { 
                this.gameOver(); 
            }
        }, 2000);
    },

    spawnPopup: function() {
        const x = Math.random() * 600 + 100; const y = Math.random() * 300 + 100;
        const pop = document.createElement('div'); pop.className = 'fake-popup';
        pop.style.top = y + 'px'; pop.style.left = x + 'px';
        pop.innerHTML = `<div class="popup-head"><span onclick="this.parentElement.parentElement.remove()">X</span></div><div class="popup-body">SYSTEM CRASH IMMINENT</div>`;
        document.getElementById('popups-layer').appendChild(pop);
    },

    killProcess: function() {
        this.state.processKilled = true;
        if(!this.state.scoreFlags['kill']) { 
            this.logScore("Kill Process", 20); 
            this.state.scoreFlags['kill']=true; 
            this.logAction(true, "Terminated malicious 'Miner_X.exe' process.");
        }
        
        const procRow = document.getElementById('proc-malware');
        procRow.style.textDecoration = 'line-through';
        procRow.style.color = "#888";
        
        const btn = document.querySelector('.btn-kill');
        btn.disabled = true;
        btn.style.background = '#555';
        
        clearInterval(this.popupInterval);
        document.getElementById('glitch-layer').classList.add('hidden');
        
        this.state.infectionActive = false;
        this.updateHUD();
        
        // --- VOICE ADDED ---
        this.speak("Malicious process halted. Now quarantine the source file.");
        
        this.showSystemMessage("PROCESS TERMINATED", "Malicious process halted. Now remove the source file.");
        this.checkWinL1();
    },

    drag: function(ev) { ev.dataTransfer.setData("text", ev.target.id); },
    allowDrop: function(ev) { ev.preventDefault(); },

    drop: function(ev) {
        ev.preventDefault();
        const data = ev.dataTransfer.getData("text");
        if(data === "malware-file") {
            document.getElementById("malware-file").style.display = "none";
            this.state.filesQuarantined = true;
            if(!this.state.scoreFlags['quarantine']) { 
                this.logScore("File Quarantined", 10); 
                this.state.scoreFlags['quarantine']=true; 
                this.logAction(true, "Quarantined source file 'Free_RAM.exe'.");
            }
            
            const btn = document.getElementById('btn-full-scan');
            btn.disabled = false;
            
            const status = document.getElementById('av-status');
            status.innerText = "READY";
            status.style.color = "yellow";
            
            // --- VOICE ADDED ---
            this.speak("File quarantined. Run full system scan.");
            
            this.checkWinL1();
        }
    },

    runFullScan: function() {
        if(!this.state.filesQuarantined) return;
        
        const bar = document.getElementById('scan-fill');
        document.getElementById('scan-progress').classList.remove('hidden');
        let width = 0;
        
        const interval = setInterval(() => {
            if (width >= 100) {
                clearInterval(interval);
                this.state.scanComplete = true;
                if(!this.state.scoreFlags['scan']) { 
                    this.logScore("System Scanned", 10); 
                    this.state.scoreFlags['scan']=true; 
                    this.logAction(true, "Completed full antivirus scan. System clean.");
                }
                
                const status = document.getElementById('av-status');
                status.innerText = "CLEAN";
                status.style.color = "var(--neon-green)";
                
                // --- VOICE ADDED ---
                this.speak("System Clean. Threat Neutralized.");
                
                this.checkWinL1();
            } else { width++; bar.style.width = width + '%'; }
        }, 30);
    },

    checkWinL1: function() {
        if(this.state.processKilled && this.state.filesQuarantined && this.state.scanComplete) {
            this.state.scores[1] = this.state.currentScore;
            setTimeout(() => {
                if(this.state.unlockedSubLevels < 2) this.state.unlockedSubLevels = 2;
                this.showLevelResult("LEVEL 1 COMPLETE", `Score: ${this.state.currentScore}/40. Proceeding to Level 2...`, () => {
                    this.returnToMenu();
                });
            }, 1000);
        }
    },

    // --- LEVEL 2 LOGIC (WORM) ---
    initNetworkMap: function() {
        const container = document.getElementById('network-map-area');
        const svg = document.getElementById('connections-svg');
        container.querySelectorAll('.net-node').forEach(n => n.remove());
        svg.innerHTML = ''; 
        this.state.firewallActive = false; 
        this.state.patchReady = false;
        
        const fwBtn = document.getElementById('btn-firewall');
        fwBtn.disabled = false; 
        fwBtn.classList.remove('active'); 
        fwBtn.innerText = "BLOCK PORT 445";
        
        document.getElementById('btn-patch').classList.add('disabled');
        document.getElementById('net-status-text').innerText = "STABLE";
        
        setTimeout(() => {
            const w = container.offsetWidth || 800; const h = container.offsetHeight || 500;
            const cx = w/2; const cy = h/2;
            this.state.nodes = [
                {id:0, type:'server', x:cx, y:cy-100, infected:false, isolated:false}, 
                {id:1, type:'pc', x:cx-120, y:cy+60, infected:false, isolated:false},   
                {id:2, type:'pc', x:cx, y:cy+100, infected:false, isolated:false},       
                {id:3, type:'pc', x:cx+120, y:cy+60, infected:false, isolated:false}     
            ];
            this.state.connections = [[0,1], [0,2], [0,3], [1,2], [2,3]];
            
            this.state.nodes.forEach(node => {
                const el = document.createElement('div'); el.className = 'net-node'; el.id = `node-${node.id}`;
                el.style.left = `${node.x - 30}px`; el.style.top = `${node.y - 30}px`;
                el.innerHTML = node.type === 'server' ? '<i class="fas fa-server"></i>' : '<i class="fas fa-desktop"></i>';
                el.addEventListener('click', () => { this.toggleIsolation(node.id); });
                container.appendChild(el);
            });
            
            this.drawLines();
            setTimeout(() => { this.infectNode(1); this.startWormSpread(); }, 1000);
            
            // --- VOICE ADDED ---
            this.speak("Worm detected spreading in network. Isolate nodes and activate firewall.");
            
            setTimeout(() => { document.getElementById('btn-patch').classList.remove('disabled'); this.state.patchReady = true; }, 10000);
        }, 100);
    },

    drawLines: function() {
        const svg = document.getElementById('connections-svg'); svg.innerHTML = ''; 
        this.state.connections.forEach(conn => {
            const n1 = this.state.nodes[conn[0]]; const n2 = this.state.nodes[conn[1]];
            if(!n1.isolated && !n2.isolated) {
                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", n1.x); line.setAttribute("y1", n1.y); 
                line.setAttribute("x2", n2.x); line.setAttribute("y2", n2.y);
                line.setAttribute("class", "connection-line");
                if(n1.infected || n2.infected) { line.classList.add('infected'); this.drawPacket(svg, n1.x, n1.y, n2.x, n2.y); }
                svg.appendChild(line);
            }
        });
    },

    drawPacket: function(svg, x1, y1, x2, y2) {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("r", "4"); circle.setAttribute("fill", "#ff003c");
        const anim = document.createElementNS("http://www.w3.org/2000/svg", "animateMotion");
        anim.setAttribute("dur", "0.8s"); anim.setAttribute("repeatCount", "indefinite"); anim.setAttribute("path", `M${x1},${y1} L${x2},${y2}`);
        circle.appendChild(anim); svg.appendChild(circle);
    },

    toggleIsolation: function(id) {
        const node = this.state.nodes[id]; node.isolated = !node.isolated;
        const el = document.getElementById(`node-${id}`);
        if(node.isolated) { el.classList.add('isolated'); el.innerHTML = '<i class="fas fa-ban"></i>'; } 
        else { el.classList.remove('isolated'); el.innerHTML = node.type === 'server' ? '<i class="fas fa-server"></i>' : '<i class="fas fa-desktop"></i>'; }
        this.drawLines();
    },

    infectNode: function(id) {
        const node = this.state.nodes[id];
        if(node.isolated || node.infected) return;
        node.infected = true; document.getElementById(`node-${id}`).classList.add('infected');
        this.checkGameState();
    },

    startWormSpread: function() {
        this.state.wormInterval = setInterval(() => {
            this.state.connections.forEach(conn => {
                const n1 = this.state.nodes[conn[0]]; const n2 = this.state.nodes[conn[1]];
                if(n1.isolated || n2.isolated) return;
                const chance = this.state.firewallActive ? 0.0 : 0.4;
                if (Math.random() < chance) {
                    if (n1.infected && !n2.infected) this.infectNode(n2.id);
                    if (n2.infected && !n1.infected) this.infectNode(n1.id);
                }
            });
            this.drawLines(); this.checkGameState();
        }, 1500);
    },

    checkGameState: function() {
        const infectedCount = this.state.nodes.filter(n => n.infected).length;
        document.getElementById('infected-count').innerText = infectedCount;
        if(infectedCount >= 4) { clearInterval(this.state.wormInterval); this.gameOver(); }
    },

    toggleFirewall: function() {
        this.state.firewallActive = true;
        const btn = document.getElementById('btn-firewall');
        btn.disabled = true;
        btn.classList.add('active');
        btn.innerHTML = '<i class="fas fa-shield-alt"></i> TRAFFIC BLOCKED';
        
        // --- VOICE ADDED ---
        this.speak("Firewall active. Port 445 Blocked.");
        
        this.logAction(true, "Activated Firewall on Port 445.");
    },

    deployPatch: function() {
        if(!this.state.patchReady) return;
        
        document.getElementById('btn-patch').classList.add('active');
        clearInterval(this.state.wormInterval);
        
        let i = 0;
        const cureInterval = setInterval(() => {
            if(i < this.state.nodes.length) {
                const node = this.state.nodes[i];
                node.infected = false;
                const el = document.getElementById(`node-${node.id}`);
                el.classList.remove('infected'); 
                el.classList.remove('isolated'); 
                el.classList.add('cured');
                i++; 
                this.drawLines();
            } else {
                clearInterval(cureInterval);
                this.state.currentScore = 30; // Max points for level 2
                this.updateHUD();
                
                // --- VOICE ADDED ---
                this.speak("Patch successfully deployed. Network integrity restored.");
                
                this.logAction(true, "Deployed security patch. Network secured.");
                this.level2Win();
            }
        }, 200);
    },

    level2Win: function() {
        this.state.scores[2] = 30;
        setTimeout(() => {
            if(this.state.unlockedSubLevels < 3) this.state.unlockedSubLevels = 3;
            this.showLevelResult("LEVEL 2 COMPLETE", `Score: 30/30. Next level unlocked.`, () => { this.returnToMenu(); });
        }, 1000);
    },

    // --- LEVEL 3 LOGIC (RANSOMWARE) ---
    l3_startRansomware: function() {
        document.getElementById('ransom-lock-screen').classList.remove('hidden');
        document.getElementById('safe-mode-screen').classList.add('hidden');
        
        const wifiBtn = document.getElementById('btn-wifi');
        wifiBtn.classList.add('active'); 
        wifiBtn.innerHTML = '<i class="fas fa-wifi"></i> WI-FI: CONNECTED';
        
        this.state.wifiConnected = true; 
        this.state.ransomTimer = 60; 
        this.state.filesRestored = 0;
        
        document.getElementById('restored-count').innerText = "Restored: 0/3";
        document.getElementById('btn-final-scan').classList.add('disabled');
        document.querySelectorAll('.file-lock').forEach(f => f.style.display = 'flex');
        
        // --- VOICE ADDED ---
        this.speak("Alert. Ransomware attack. Files encrypted. Disconnect from network immediately.");
        
        this.state.ransomInterval = setInterval(() => {
            this.state.ransomTimer--;
            const m = Math.floor(this.state.ransomTimer / 60); const s = this.state.ransomTimer % 60;
            const display = document.getElementById('ransom-timer');
            if(display) display.innerText = `${m}:${s < 10 ? '0'+s : s}`;
            if(this.state.ransomTimer <= 0) this.gameOver();
        }, 1000);
    },

    toggleWifi: function() {
        if(this.state.wifiConnected) {
            this.state.wifiConnected = false;
            const btn = document.getElementById('btn-wifi');
            btn.classList.remove('active');
            btn.innerHTML = '<i class="fas fa-wifi"></i> WI-FI: DISCONNECTED';
            
            if(!this.state.scoreFlags['wifi']) { 
                this.logScore("Wifi Disconnected", 10); 
                this.state.scoreFlags['wifi']=true;
                
                // --- VOICE ADDED ---
                this.speak("Network severed. Command and Control link broken.");
                
                this.logAction(true, "Disconnected Wi-Fi to stop external command/control.");
            }
        }
    },

    payRansom: function() {
        this.state.health -= 50; 
        this.updateHUD();
        this.showSystemMessage("ERROR", "NEVER PAY RANSOM!");
        this.logAction(false, "Attempted to pay ransom. Policy Violation.");
        if(this.state.health <= 0) this.gameOver();
    },

    rebootSystem: function() {
        if(this.state.wifiConnected) {
            this.showSystemMessage("BLOCKED", "Disconnect Wi-Fi first!");
            this.state.health -= 20; 
            this.logAction(false, "Attempted reboot while connected to network.");
            this.updateHUD();
            if(this.state.health <= 0) this.gameOver();
        } else {
            clearInterval(this.state.ransomInterval);
            if(!this.state.scoreFlags['reboot']) { 
                this.logScore("Safe Mode Reboot", 10); 
                this.state.scoreFlags['reboot']=true; 
                this.logAction(true, "Rebooted system into Safe Mode.");
            }
            
            document.getElementById('ransom-lock-screen').innerHTML = "<h1 style='color:white;text-align:center;margin-top:20%'>REBOOTING...</h1>";
            
            // --- VOICE ADDED ---
            this.speak("Rebooting to Safe Mode.");
            
            setTimeout(() => {
                document.getElementById('ransom-lock-screen').classList.add('hidden');
                document.getElementById('safe-mode-screen').classList.remove('hidden');
                this.restoreL3HTML();
            }, 2000);
        }
    },

    restoreL3HTML: function() {
         document.getElementById('ransom-lock-screen').innerHTML = `
            <div class="lock-message"><i class="fas fa-skull-crossbones fa-4x blink-fast"></i><h1>FILES ENCRYPTED</h1><p>Pay 5 BTC or lose everything.</p><div class="timer-display" id="ransom-timer">00:00</div><button class="btn-pay" onclick="malwareApp.payRansom()">PAY RANSOM</button></div>
            <div class="emergency-taskbar"><div class="taskbar-status">SYSTEM COMPROMISED</div><div class="taskbar-controls"><button id="btn-wifi" class="btn-sys-action active" onclick="malwareApp.toggleWifi()"><i class="fas fa-wifi"></i> <span>WI-FI: CONNECTED</span></button><button id="btn-reboot" class="btn-sys-action" onclick="malwareApp.rebootSystem()"><i class="fas fa-power-off"></i> REBOOT TO SAFE MODE</button></div></div>`;
    },

    dropRestore: function(ev) {
        ev.preventDefault();
        var data = ev.dataTransfer.getData("text");
        if(data) {
            const el = document.getElementById(data);
            if(el) {
                el.style.display = "none";
                this.state.filesRestored++;
                document.getElementById('restored-count').innerText = `Restored: ${this.state.filesRestored}/3`;
                
                if(this.state.filesRestored === 3) {
                    document.getElementById('btn-final-scan').classList.remove('disabled');
                    
                    // --- VOICE ADDED ---
                    this.speak("All files restored. Initiate recovery scan.");
                    
                    if(!this.state.scoreFlags['restore']) { 
                        this.logScore("Files Restored", 10); 
                        this.state.scoreFlags['restore']=true;
                        this.logAction(true, "Restored all critical data from backups.");
                    }
                }
            }
        }
    },

    runRecoveryScan: function() {
        if(this.state.filesRestored < 3) return;
        const btn = document.getElementById('btn-final-scan');
        btn.innerText = "SCANNING...";
        
        // --- VOICE ADDED ---
        this.speak("Scanning complete. System integrity verified.");
        
        setTimeout(() => {
            this.state.scores[3] = this.state.currentScore;
            this.showFinalSummary();
        }, 2000);
    },

    // --- SUMMARY & SAVING (USER SPECIFIC) ---
    showFinalSummary: function() {
        const s1 = this.state.scores[1] || 0; 
        const s2 = this.state.scores[2] || 0; 
        const s3 = this.state.scores[3] || 0;
        const total = s1 + s2 + s3;
        const percent = Math.round((total / 100) * 100);
        
        document.getElementById('screen-summary').classList.add('active');
        document.getElementById('game-lvl3').classList.remove('active');
        document.getElementById('hud').classList.add('hidden');
        
        // Update Stats
        document.getElementById('sum-total').innerText = total + "/100";
        document.getElementById('sum-percent').innerText = percent + "%";
        document.getElementById('score-l1').innerText = s1;
        document.getElementById('score-l2').innerText = s2;
        document.getElementById('score-l3').innerText = s3;
        
        const statusEl = document.getElementById('sum-status');
        const nextMsg = document.getElementById('next-step-msg');
        
        if(total >= 70) {
            statusEl.innerText = "PASSED";
            statusEl.style.color = "var(--neon-green)";
            nextMsg.innerText = "Module 3 Unlocked. Proceed to Main Menu.";
            nextMsg.style.color = "var(--neon-green)";
            
            // SAVE USER SPECIFIC PROGRESS
            localStorage.setItem(`threat0_${this.state.userId}_mod2_complete`, 'true');

            // 2. APPWRITE CLOUD SAVE
            if(this.state.docId) {
                // Merge scores without overwriting Mod 1 or 3
                const updatedScores = db.mergeScores(this.state.allScores, 'm2', this.state.scores);
                this.state.allScores = updatedScores; // Update local cache

                db.saveProgress(this.state.docId, {
                    mod2_complete: true,
                    scores: updatedScores
                });
            }

        } else {
            statusEl.innerText = "FAILED";
            statusEl.style.color = "var(--neon-red)";
            nextMsg.innerText = "Score > 70 required to unlock Module 3.";
            nextMsg.style.color = "var(--neon-red)";
        }

        // Generate Logs
        const logContainer = document.getElementById('feedback-log-container');
        logContainer.innerHTML = '';
        if (this.state.feedbackLogs.length === 0) {
            logContainer.innerHTML = '<div class="feedback-item">No data recorded.</div>';
        } else {
            this.state.feedbackLogs.forEach(log => {
                const div = document.createElement('div');
                div.className = `feedback-item ${log.success ? 'good' : 'bad'}`;
                const icon = log.success ? '✓' : '✗';
                div.innerText = `[LVL ${log.level}] ${icon} ${log.msg}`;
                logContainer.appendChild(div);
            });
        }
    },

    // --- SYSTEM UTILS ---
    
    // --- ADDED: SPEAK FUNCTION ---
    speak: function(text) {
        if('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(text);
            utter.rate = 1.1; utter.pitch = 0.9;
            const voice = this.state.voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
            if(voice) utter.voice = voice;
            window.speechSynthesis.speak(utter);
        }
    },

    logAction: function(success, msg) {
        this.state.feedbackLogs.push({
            level: this.state.activeSubLevel,
            success: success,
            msg: msg
        });
    },

    showLevelResult: function(title, msg, callback) {
        const modal = document.getElementById('modal-result');
        document.getElementById('res-title').innerText = title;
        document.getElementById('res-msg').innerText = msg;
        const btn = document.getElementById('btn-continue');
        modal.classList.remove('hidden');
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.innerText = "CONTINUE"; newBtn.onclick = callback;
    },

    showSystemMessage: function(title, msg, onClose) {
        const modal = document.getElementById('modal-system');
        const t = document.getElementById('sys-title'); const m = document.getElementById('sys-msg');
        if(t) t.innerText = title; if(m) m.innerText = msg;
        const btn = document.getElementById('sys-btn');
        modal.classList.remove('hidden');
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.onclick = () => { modal.classList.add('hidden'); if(onClose) onClose(); };
    },

    showConfirm: function(msg, onConfirm) {
        const modal = document.getElementById('modal-confirm');
        document.getElementById('confirm-msg').innerText = msg;
        modal.classList.remove('hidden');
        const yesBtn = document.getElementById('btn-confirm-yes');
        const noBtn = document.getElementById('btn-confirm-no');
        const newYes = yesBtn.cloneNode(true);
        const newNo = noBtn.cloneNode(true);
        yesBtn.parentNode.replaceChild(newYes, yesBtn);
        noBtn.parentNode.replaceChild(newNo, noBtn);
        newYes.onclick = () => { modal.classList.add('hidden'); onConfirm(); };
        newNo.onclick = () => { modal.classList.add('hidden'); };
    },

    resetModule2: function() {
        this.showConfirm("WARNING: Restart Module 2?", () => {
            this.state.unlockedSubLevels = 1;
            this.state.scores = { 1: 0, 2: 0, 3: 0 };
            this.state.currentScore = 0;
            this.state.health = 100;
            this.state.feedbackLogs = [];
            this.updateMenuUI();
        });
    },

    logScore: function(msg, points) { this.state.currentScore += points; this.updateHUD(); },
    
    updateHUD: function() {
        const bar = document.getElementById('health-bar');
        const scoreDisplay = document.getElementById('hud-score');
        const threat = document.getElementById('threat-display');
        if(bar) { bar.style.width = Math.max(0, this.state.health) + "%"; bar.style.backgroundColor = this.state.health > 50 ? 'var(--neon-cyan)' : 'var(--neon-red)'; }
        if(scoreDisplay) scoreDisplay.innerText = this.state.currentScore;
        if(threat) {
            if(this.state.infectionActive) { threat.innerText = "CRITICAL"; threat.style.color = "var(--neon-red)"; } 
            else { threat.innerText = "LOW"; threat.style.color = "var(--neon-green)"; }
        }
    },
    
    playGlitchSound: function() {
        if(!this.state.audioCtx || this.state.audioCtx.state === 'suspended') return;
        try {
            const osc = this.state.audioCtx.createOscillator(); 
            const gain = this.state.audioCtx.createGain();
            osc.type = 'sawtooth'; 
            osc.frequency.value = Math.random() * 500 + 200; 
            gain.gain.value = 0.05;
            osc.connect(gain); gain.connect(this.state.audioCtx.destination);
            osc.start(); osc.stop(this.state.audioCtx.currentTime + 0.1);
        } catch(e) {}
    },
    
    gameOver: function() {
        clearInterval(this.state.wormInterval); 
        clearInterval(this.state.ransomInterval); 
        clearInterval(this.popupInterval);
        
        this.logAction(false, "Mission Failed: System Integrity Lost.");
        this.showLevelResult("SYSTEM FAILURE", "Integrity Critical. Mission Failed.", () => {
             document.getElementById('modal-result').classList.add('hidden');
             this.initLevel(this.state.activeSubLevel);
             this.startMission();
        });
    }
};

window.malwareApp = malwareApp;
window.onload = function() { malwareApp.init(); };