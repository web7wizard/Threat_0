import { auth } from '../auth.js';
import { db } from '../database.js';

const mod3 = {
    // --- GLOBAL GAME STATE ---
    state: {
        unlockedLevels: 1, 
        activeLevel: 0,
        health: 100,
        currentScore: 0, 
        feedbackLogs: [], // ADDED: For tactical logging
        scores: { 1: 0, 2: 0, 3: 0 }, 
        
        // Level 1 Specifics (State Machine)
        l1: {
            step: 0 // 0:Ready, 1:Running, 2:Attacked, 3:Scanned, 4:Inspected
        },

        // Level 2 Specifics
        l2: {
            infected: false,
            processKilled: false,
            keyloggerActive: false,
            scanDone: false
        },

        // Level 3 Specifics
        l3: {
            simActive: false,
            phase: 'normal', 
            load: 15,        
            defenses: { rateLimit: false, ipFilter: false, scrubbing: false },
            timer: null,
            logTimer: null,
            winTriggered: false 
        },
        
        audioCtx: null,
        voices: [],
        userId: 'guest',
        docId: null,
        allScores: "{}"
    },

    // ==========================================
    // INITIALIZATION
    // ==========================================
    init: async function() {
        console.log("Module 3 Initialized");
        
        // Audio Setup
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.state.audioCtx = new AudioContext();
        } catch(e) {}

        if('speechSynthesis' in window) {
            window.speechSynthesis.onvoiceschanged = () => {
                this.state.voices = window.speechSynthesis.getVoices();
            };
        }

        // Auth & Database
        const user = await auth.getCurrentUser();
        if(user) {
            this.state.userId = user.$id;
            const progress = await db.getUserProgress(user.$id);
            if(progress) {
                this.state.docId = progress.$id;
                this.state.allScores = progress.scores;
                
                if(!progress.mod2_complete) {
                    alert("ACCESS DENIED: You must complete Module 2 first.");
                    window.location.href = 'module1.html';
                    return;
                }

                try {
                    const parsed = JSON.parse(progress.scores);
                    if(parsed.m3) {
                        this.state.scores = parsed.m3;
                        if(this.state.scores[1] > 0) this.state.unlockedLevels = 2;
                        if(this.state.scores[2] > 0) this.state.unlockedLevels = 3;
                    }
                } catch(e) { console.error("Score parse error:", e); }
            }
        }
        
        this.updateMenuUI();
        document.getElementById('hud').classList.add('hidden');
    },

    // ==========================================
    // LEVEL 1: MITM (TRIANGLE ATTACK)
    // ==========================================
    
    l1_start: function() {
        if(this.state.l1.step > 0) return;
        this.state.l1.step = 1;

        // UI Reset
        this.l1_log("INITIALIZING TRAFFIC SIMULATION...");
        document.getElementById('btn-start').classList.add('disabled');
        document.getElementById('mission-status').innerText = "STATUS: DATA TRANSFERRING";

        // Wait 2s then Attack automatically
        setTimeout(() => this.l1_triggerAttack(), 2000);
    },

    l1_triggerAttack: function() {
        this.state.l1.step = 2;

        // 1. Change SVG Path to Triangle (The Attack Path)
        const packetAnim = document.querySelector('#anim-packet mpath');
        if(packetAnim) packetAnim.setAttribute('href', '#path-attack'); 
        
        // 2. Show Red Path / Hide Normal
        document.getElementById('path-attack').classList.remove('hide-path');
        document.getElementById('path-normal').style.opacity = "0.2";
        
        // 3. Change Packet Color to Red
        document.getElementById('anim-packet').setAttribute('fill', '#ff003c');

        // 4. Update HUD
        this.l1_log("ALERT: UNEXPECTED REDIRECT DETECTED!", "msg-bad");
        this.l1_log("TRAFFIC ROUTING CHANGED.", "msg-bad");
        document.getElementById('mission-status').innerText = "STATUS: COMPROMISED";
        document.getElementById('mission-status').className = "status-indicator danger";

        // 5. Enable Scan Button
        this.l1_enableBtn('btn-scan');
        this.speak("Alert. Traffic intercepted.");
    },

    l1_scan: function() {
        if(this.state.l1.step !== 2) return;
        
        // Button Feedback
        document.getElementById('btn-scan').innerHTML = "<div class='btn-text'><span class='btn-title'>SCANNING...</span></div>";
        
        setTimeout(() => {
            this.state.l1.step = 3;
            this.logAction(true, "Identified abnormal ARP redirection node."); // ADDED LOG

            // Reveal Hacker Node
            document.getElementById('node-hacker').classList.remove('hidden-hacker');
            document.getElementById('node-hacker').classList.add('visible-hacker');
            
            this.l1_log("ANOMALY DETECTED: 192.168.1.105");
            this.l1_log("ARP SPOOFING CONFIRMED.");
            
            // Update UI
            document.getElementById('btn-scan').classList.add('disabled');
            document.getElementById('btn-scan').innerHTML = "<div class='btn-text'><span class='btn-title'>1. SCAN COMPLETE</span></div>";
            
            this.l1_enableBtn('btn-inspect');
            this.speak("Rogue device found.");
        }, 1500);
    },

    l1_inspect: function() {
        if(this.state.l1.step !== 3) return;
        // Show Evidence Modal
        document.getElementById('lvl1-modal').classList.remove('hidden');
    },

    l1_closeModal: function() {
        // Close Modal & Unlock VPN
        document.getElementById('lvl1-modal').classList.add('hidden');
        this.state.l1.step = 4;
        
        this.l1_log("EVIDENCE LOGGED: PLAINTEXT CREDENTIALS.");
        this.l1_enableBtn('btn-vpn');
        document.getElementById('btn-inspect').classList.add('disabled');
    },

    l1_vpn: function() {
        if(this.state.l1.step !== 4) return;
        
        document.getElementById('btn-vpn').innerHTML = "<div class='btn-text'><span class='btn-title'>ENCRYPTING...</span></div>";
        
        setTimeout(() => {
            this.logAction(true, "Secured data stream with high-level VPN tunnel."); // ADDED LOG
            // 1. Switch Path to Secure Straight Line
            const packetAnim = document.querySelector('#anim-packet mpath');
            if(packetAnim) packetAnim.setAttribute('href', '#path-secure');
            
            document.getElementById('path-attack').classList.add('hide-path');
            document.getElementById('path-secure').classList.remove('hide-path');
            
            // 2. Packet Green
            document.getElementById('anim-packet').setAttribute('fill', '#00ff9d');
            
            // 3. Hide Hacker
            document.getElementById('node-hacker').classList.remove('visible-hacker');
            document.getElementById('node-hacker').classList.add('hidden-hacker');
            
            // 4. Logs
            this.l1_log("VPN TUNNEL ACTIVE. CONNECTION SECURE.");
            document.getElementById('mission-status').innerText = "STATUS: SECURE";
            document.getElementById('mission-status').className = "status-indicator safe";
            
            this.speak("VPN Active. Threat neutralized.");
            this.state.currentScore = 30;
            this.updateHUD();

            // Finish
            setTimeout(() => {
               this.finishLevel(1); 
            }, 3000);
        }, 2000);
    },

    // Helpers for L1
    l1_enableBtn: function(id) {
        const btn = document.getElementById(id);
        if(btn) {
            btn.classList.remove('disabled');
            btn.classList.add('active');
        }
    },

    l1_log: function(msg, className) {
        const div = document.createElement('div');
        div.innerText = `> ${msg}`;
        div.className = "log-msg " + (className || "");
        const consoleEl = document.getElementById('game-console');
        if(consoleEl) {
            consoleEl.appendChild(div);
            consoleEl.scrollTop = consoleEl.scrollHeight;
        }
    },


// ==========================================
    // LEVEL 2: KEYLOGGER (CAFE UI ENHANCED)
    // ==========================================
        l2_init: function() {
        this.state.l2 = { infected: false, processKilled: false, keyloggerActive: false, scanDone: false };
        document.getElementById('l2-username').value = "";
        document.getElementById('l2-password').value = "";
        document.getElementById('phone-notif').classList.add('hidden');
        document.getElementById('l2-phone').classList.remove('vibrate');
        document.getElementById('l2-malicious-proc').style.display = "flex";
        document.getElementById('l2-proc-status').innerText = "KILL";
        this.l2_showSub('menu');

        const inputs = [document.getElementById('l2-username'), document.getElementById('l2-password')];
        inputs.forEach(el => {
            el.onkeyup = (e) => {
                if(this.state.l2.keyloggerActive) this.l2_spawnGhostLetter(e.key);
            };
        });
    },

    l2_openApp: function(app) { document.getElementById(`win-${app}`).classList.remove('hidden'); },
    l2_closeApp: function(app) { document.getElementById(`win-${app}`).classList.add('hidden'); },

    l2_installKeylogger: function() {
        this.state.l2.infected = true;
        this.state.l2.keyloggerActive = true;
        this.logAction(true, "Unknowingly installed malicious Free_WiFi_Tool.exe."); // ADDED LOG
        this.l2_closeApp('downloads');
        this.showAlert("Free_WiFi_Tool.exe has been successfully installed.", "INSTALLATION COMPLETE");
    },

    l2_triggerPhoneAlert: function() {
        if(!this.state.l2.infected) {
            this.showAlert("Login successful. No threats detected.", "SYSTEM_OK");
            return;
        }
        setTimeout(() => {
            document.getElementById('l2-phone').classList.add('vibrate');
            document.getElementById('phone-notif').classList.remove('hidden');
            this.speak("Check your smartphone. Unusual activity detected.");
        }, 1500);
    },

    l2_showSub: function(screen) {
        ['l2-tool-menu', 'l2-sub-proc', 'l2-sub-scan', 'l2-sub-pass'].forEach(id => {
            document.getElementById(id).classList.add('hidden');
        });
        if(screen === 'menu') document.getElementById('l2-tool-menu').classList.remove('hidden');
        else document.getElementById(`l2-sub-${screen}`).classList.remove('hidden');
    },

    l2_runScan: function() {
        const results = document.getElementById('l2-scan-results');
        document.getElementById('btn-start-scan').style.display = "none";
        gsap.to('#l2-scan-fill', { 
            width: "100%", duration: 3, 
            onComplete: () => {
                this.logAction(true, "Identified Keylogger binary in background services."); // ADDED LOG
                results.innerHTML = `<p class="text-danger">THREAT: Keylogger.Agent (wifi_optimizer.exe)</p><button class="btn-mini" style="background:#ff3366; color:white; width:100%;" onclick="mod3.l2_showSub('proc')">GO TO PROCESS MANAGER</button>`;
                this.speak("Threat found. Terminate the process to stop the leak.");
            }
        });
    },

    l2_killProcess: function() {
        this.state.l2.processKilled = true;
        this.state.l2.keyloggerActive = false; 
        this.logAction(true, "Terminated malicious 'wifi_optimizer.exe' process."); // ADDED LOG
        document.getElementById('l2-proc-status').innerText = "TERMINATED";
        document.getElementById('l2-malicious-proc').classList.remove('suspicious-item');
        this.playSound('success');
        this.speak("Process terminated. Connection secured.");
    },

    l2_changePassword: function() {
        if(!this.state.l2.processKilled) {
            this.state.health -= 40;
            this.logAction(false, "Updated password while keylogger was still active."); // ADDED LOG
            this.updateHUD();
            this.showAlert("FAILURE: The active keylogger captured your NEW password! Remove threats first.", "SECURITY BREACH");
        } else {
            this.logAction(true, "Changed account credentials securely after threat removal."); // ADDED LOG
            this.state.currentScore = 30;
            this.updateHUD();
            this.finishLevel(2);
        }
    },

    l2_spawnGhostLetter: function(key) {
        if(key.length > 1) return;
        const char = document.createElement('div');
        char.className = 'ghost-letter'; char.innerText = key;
        char.style.left = "40%"; char.style.top = "80%";
        document.getElementById('l2-ghost-container').appendChild(char);
        gsap.to(char, { x: 600, y: -500, opacity: 0, duration: 1.2, onComplete: () => char.remove() });
    },


    // ==========================================
    // LEVEL 3: DDoS MITIGATION
    // ==========================================
    l3_init: function() {
        this.state.l3 = { 
            phase: 'dos', step: 0, load: 15, uptime: 100, 
            active: true, isAttacking: false, modalOpen: false,
            dosScore: 0, ddosScore: 0 
        };
        
        // UI Reset
        document.getElementById('l3-view-dos').classList.add('active');
        document.getElementById('l3-view-dos').classList.remove('hidden');
        document.getElementById('l3-view-ddos').classList.add('hidden');
        document.getElementById('l3-svg-lines').innerHTML = '';
        
        this.l3_renderUI();
        
        clearInterval(this.state.l3.timer);
        this.state.l3.timer = setInterval(() => this.l3_tick(), 500);
        setTimeout(() => this.l3_startAttack(), 1500);
        // Inside l3_init function:
        setTimeout(() => {
            this.l3_startAttack();
            this.speak("Alert. Single source Denial of Service attack detected. Server load increasing."); 
        }, 1500);
    },

    l3_renderUI: function() {
        const s = this.state.l3;
        const btnBox = document.getElementById('l3-btns');
        if(!btnBox) return;
        btnBox.innerHTML = ''; 

        if(s.phase === 'dos') {
            this.l3_addBtn("1. SCAN NETWORK", () => this.l3_handle(1), s.step >= 1);
            this.l3_addBtn("2. RATE LIMIT", () => this.l3_handle(2), s.step >= 2);
            this.l3_addBtn("3. BLOCK IP", () => this.l3_handle(3), s.step >= 3);
        } else {
            this.l3_addBtn("GEO-FILTERING", () => this.l3_handle(4), s.step >= 1);
            this.l3_addBtn("SCALE CAPACITY", () => this.l3_handle(5), s.step >= 2);
            this.l3_addBtn("CLOUD SCRUBBING", () => this.l3_handle(6), s.step >= 3);
        }
    },

    l3_addBtn: function(text, fn, isDone) {
        const btn = document.createElement('button');
        btn.className = isDone ? "l3-btn active" : "l3-btn";
        btn.innerText = text;
        btn.onclick = fn;
        document.getElementById('l3-btns').appendChild(btn);
    },

    l3_startAttack: function() {
        this.state.l3.isAttacking = true;
        document.querySelectorAll('.bot-pc').forEach(b => b.classList.add('active'));
        this.l3_aiMsg("ALERT: INBOUND TRAFFIC FROM HIJACKED BOTNET!");
        this.l3_drawTreeLines();
    },

    l3_drawTreeLines: function() {
        const svg = document.getElementById('l3-svg-lines');
        if(!svg) return;
        svg.innerHTML = '';
        const hacker = document.getElementById('dos-hacker').getBoundingClientRect();
        const bots = document.querySelectorAll('.bot-pc');
        const server = document.getElementById('dos-server').getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();

        bots.forEach(bot => {
            const bRect = bot.getBoundingClientRect();
            this.l3_createLine(svg, hacker, bRect, svgRect);
            this.l3_createLine(svg, bRect, server, svgRect);
        });
        document.querySelectorAll('.attack-line').forEach(l => l.style.opacity = "0.7");
    },

    l3_createLine: function(svg, r1, r2, svgRect) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", r1.left - svgRect.left + r1.width/2);
        line.setAttribute("y1", r1.top - svgRect.top + r1.height/2);
        line.setAttribute("x2", r2.left - svgRect.left + r2.width/2);
        line.setAttribute("y2", r2.top - svgRect.top + r2.height/2);
        line.setAttribute("class", "attack-line");
        svg.appendChild(line);
    },

    l3_handle: function(id) {
        const s = this.state.l3;
        if(s.phase === 'dos') {
            if(id === 1 && s.step === 0) { 
                s.step = 1; this.l3_aiMsg("SOURCE TRACED: 192.168.1.50"); 
                this.speak("Source IP traced to a single terminal."); 
            }
            if(id === 2 && s.step === 1) { 
                s.step = 2; this.logAction(true, "Applied Rate Limiting to mitigate single-source flood."); 
                this.l3_aiMsg("RATE LIMITING ACTIVE...");
                this.speak("Rate limiting active. Connection speed throttled."); 
            }
            if(id === 3 && s.step === 2) { 
                s.step = 3; s.isAttacking = false; s.dosScore = 20;
                this.logAction(true, "Purged malicious host IP from server whitelist.");
                this.l3_aiMsg("ATTACK PURGED."); 
                this.speak("Source IP blocked. Denial of Service mitigated."); 
                document.getElementById('l3-svg-lines').innerHTML = '';
                document.querySelectorAll('.bot-pc').forEach(b => { b.classList.remove('active'); b.style.opacity = "0.2"; });
            }
        } else {
            if(id === 4 && s.step === 0) { 
                s.step = 1; this.logAction(true, "Isolated botnet traffic via GEO-filtering."); 
                this.l3_aiMsg("GEO-FILTERS ACTIVE."); this.l3_spawnMapBots(); 
                this.speak("Geo filters active. Regional traffic quarantined."); 
            }
            if(id === 5 && s.step === 1) { 
                s.step = 2; this.logAction(true, "Dynamically scaled server capacity to handle overhead."); 
                this.l3_aiMsg("CAPACITY SCALED."); 
                this.speak("Scaling server resources to handle increased load."); 
            }
            if(id === 6 && s.step === 2) { 
                s.step = 3; s.isAttacking = false; s.ddosScore = 20;
                this.logAction(true, "Finalized Cloud Scrubbing to restore service integrity.");
                this.l3_aiMsg("DDoS NEUTRALIZED."); 
                this.speak("Traffic scrubbing complete. Botnet connection severed."); 
                document.getElementById('map-attack-points').innerHTML = '';
            }
        }
        this.l3_renderUI();
    },

    l3_tick: function() {
        const s = this.state.l3;
        if(!s.active) return;
        let target = s.isAttacking ? 95 : 15;
        if(s.step === 2) target = 45;
        if(s.step === 3) target = 10;

        s.load += (target - s.load) * 0.2;
        document.getElementById('l3-load-val').innerText = Math.floor(s.load);
        document.getElementById('l3-uptime-bar').style.width = s.uptime + "%";

        if(s.isAttacking && s.load > 70) s.uptime -= 1.5;
        if(s.uptime <= 0) this.gameOver("System Crashed.");

        if(s.step === 3 && s.load < 25 && !s.modalOpen) {
            s.modalOpen = true;
            this.l3_showTheory();
        }
    },

    l3_showTheory: function() {
        const s = this.state.l3;
        if(s.phase === 'dos') {
            this.showAlert("Single-source DoS mitigated. Phase 2: Distributed Botnet incoming.", "PHASE 1 COMPLETE");
            this.speak("Warning. Distributed attack detected. Massive traffic flood from global botnets."); 
            this.l3_startDDoS();
        } else {
            this.speak("Network integrity restored. Distributed attack fully neutralized."); 
            this.state.currentScore = 40; this.finishLevel(3);
        }
    },

    l3_startDDoS: function() {
        const s = this.state.l3;
        document.getElementById('l3-modal').classList.add('hidden');
        document.getElementById('l3-view-dos').classList.add('hidden');
        document.getElementById('l3-view-ddos').classList.remove('hidden');
        document.getElementById('l3-view-ddos').classList.add('active');
        s.phase = 'ddos'; s.step = 0; s.uptime = 100; s.isAttacking = true; s.modalOpen = false;
        this.l3_renderUI();
    },

    l3_aiMsg: function(m) { document.getElementById('l3-ai-msg').innerText = ">> " + m; },

    l3_spawnMapBots: function() {
        const container = document.getElementById('map-attack-points');
        container.innerHTML = '';
        for(let i=0; i<40; i++) {
            const b = document.createElement('div');
            b.className = 'bot-point';
            b.style.left = Math.random() * 95 + "%"; b.style.top = Math.random() * 85 + "%";
            container.appendChild(b);
        }
    },
    // ==========================================
    // SYSTEM FUNCTIONS (UPDATED FOR SAVING)
    // ==========================================
    
    // --- UPDATED LEVEL INITIALIZATION WITH BRIEFING ---
    initLevel: function(id) {
    this.state.activeLevel = id;

    const briefingSteps = {
        1: `
            <ul class="level-steps">
                <li>Monitor live network traffic in real time</li>
                <li>Detect abnormal redirection behavior</li>
                <li>Identify signs of ARP spoofing</li>
                <li>Secure traffic using VPN encryption</li>
            </ul>
        `,
        2: `
            <ul class="level-steps">
                <li>Run the downloaded executable from the Downloads folder.</li>
                <li>Continue the investigation using the web browser.</li>
                <li>Scan active processes to identify any hidden keyloggers.</li>
                <li>Terminate any malicious or suspicious processes.</li>
                <li>Match the activity with alerts received on your smartphone.</li>
                <li>Change your password to secure your account.</li>
            </ul>
        `,
        3: `
            <ul class="level-steps">
                <li>Analyze traffic spikes targeting the server</li>
                <li>Identify flood / DDoS patterns</li>
                <li>Apply rate-limiting and mitigation filters</li>
                <li><b>Restore service without rebooting hardware</b></li>
            </ul>
        `
    };

    const stepsContainer = document.getElementById('briefing-steps');
    if (stepsContainer && briefingSteps[id]) {
        stepsContainer.innerHTML = briefingSteps[id];
    }

    document.getElementById('modal-briefing').classList.remove('hidden');
},


    startLevelAfterBriefing: function() {
        const id = this.state.activeLevel;
        document.getElementById('modal-briefing').classList.add('hidden');
        
        // --- EXISTING START LOGIC ---
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('hud').classList.remove('hidden');
        this.state.health = 100; 
        this.state.currentScore = 0; 
        this.updateHUD();

        if(id === 1) { 
            document.getElementById('game-lvl1').classList.add('active'); 
            this.state.l1.step = 0; 
        }
        else if(id === 2) { 
            document.getElementById('game-lvl2').classList.add('active'); 
            this.l2_init(); 
        }
        else if(id === 3) { 
            document.getElementById('game-lvl3').classList.add('active'); 
            this.l3_init(); 
        }
    },

    finishLevel: async function(lvl) {
        // 1. Save Score Locally
        this.state.scores[lvl] = this.state.currentScore;
        
        // 2. Unlock Next Level
        if (lvl === 1 && this.state.unlockedLevels < 2) this.state.unlockedLevels = 2;
        if (lvl === 2 && this.state.unlockedLevels < 3) this.state.unlockedLevels = 3;

        // 3. AUTO-SAVE TO APPWRITE NOW
        if(this.state.docId) {
            console.log("Saving Level " + lvl + " progress to Appwrite...");
            const updatedScores = db.mergeScores(this.state.allScores, 'm3', this.state.scores);
            this.state.allScores = updatedScores; 
            try {
                // If Level 3 is done, mark module complete
                const isComplete = (lvl === 3);
                await db.saveProgress(this.state.docId, { 
                    mod3_complete: isComplete, 
                    scores: updatedScores 
                });
                console.log("Save Successful.");
            } catch(e) {
                console.error("Save Failed:", e);
            }
        }

        // 4. Show Modal
        const title = document.getElementById('res-title');
        const msg = document.getElementById('res-msg');
        
        if(lvl === 1) {
            title.innerText = "LEVEL 1 COMPLETE";
            msg.innerText = `Score: ${this.state.currentScore}/30. Proceeding to Level 2...`;
        } else if (lvl === 2) {
            title.innerText = "LEVEL 2 COMPLETE";
            msg.innerText = `Score: ${this.state.currentScore}/30. Proceeding to Level 3...`;
        } else {
            title.innerText = "MODULE COMPLETE";
            msg.innerText = `Score: ${this.state.currentScore}/40. All threats neutralized.`;
        }

        document.getElementById('modal-result').classList.remove('hidden');
        
        // Update button text depending on level
        const btn = document.querySelector('#modal-result .modal-btn');
        if(lvl < 3) {
            btn.innerText = "CONTINUE";
            btn.onclick = () => {
                document.getElementById('modal-result').classList.add('hidden');
                this.returnToMenu(); // Go to menu to select next level
            };
        } else {
            btn.innerText = "VIEW REPORT";
            btn.onclick = () => this.handleLevelComplete();
        }
    },

    handleLevelComplete: function() {
        document.getElementById('modal-result').classList.add('hidden');
        if (this.state.activeLevel === 3) this.showSummary();
        else this.returnToMenu();
    },

    showSummary: function() {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('screen-summary').classList.add('active');

        const total = this.state.scores[1] + this.state.scores[2] + this.state.scores[3];
        document.getElementById('score-l1').innerText = this.state.scores[1];
        document.getElementById('score-l2').innerText = this.state.scores[2];
        document.getElementById('score-l3').innerText = this.state.scores[3];
        document.getElementById('sum-total').innerText = `${total}/100`;
        document.getElementById('sum-percent').innerText = `${Math.round(total)}%`;

        const logContainer = document.getElementById('feedback-log-container');
        logContainer.innerHTML = ''; 

        if (this.state.feedbackLogs.length === 0) {
            logContainer.innerHTML = '<div class="log-line">No tactical data recorded.</div>';
        } else {
            this.state.feedbackLogs.forEach(log => {
                const div = document.createElement('div');
                div.className = `log-line ${log.success ? 'good' : 'bad'}`; 
                const icon = log.success ? '✓' : '✗';
                div.innerHTML = `<span>[LVL 3.${log.level}]</span> ${icon} ${log.msg}`;
                logContainer.appendChild(div);
            });
        }

        const statusEl = document.getElementById('sum-status');
        if (total >= 70) {
            statusEl.innerText = "PASSED";
            statusEl.className = "stat-value result-text passed";
        } else {
            statusEl.innerText = "FAILED";
            statusEl.className = "stat-value result-text failed";
        }
    },
  logAction: function(success, msg) {
        this.state.feedbackLogs.push({
            level: this.state.activeLevel,
            success: success,
            msg: msg
        });
    },
    returnToMenu: function() {
        // Clear loops
        clearInterval(this.state.l2.attackerInterval);
        clearInterval(this.state.l3.timer);
        clearInterval(this.state.l3.logTimer);
        
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('screen-sublevel-menu').classList.add('active');
        document.getElementById('hud').classList.add('hidden');
        this.updateMenuUI();
    },

    updateMenuUI: function() {
        for(let i=1; i<=3; i++) {
            const card = document.getElementById(`sub-card-${i}`);
            if (card) {
                if(i <= this.state.unlockedLevels) { 
                    card.classList.remove('locked'); 
                    card.classList.add('available'); 
                    card.onclick = () => this.initLevel(i);
                } else { 
                    card.classList.add('locked'); 
                    card.classList.remove('available'); 
                    card.onclick = null;
                }
            }
        }
    },

    updateHUD: function() {
        document.getElementById('health-bar').style.width = this.state.health + "%";
        document.getElementById('score-display').innerText = this.state.currentScore;
        document.getElementById('health-bar').style.backgroundColor = this.state.health < 40 ? 'var(--alert-red)' : 'var(--holo-cyan)';
    },

    playSound: function(type) {
        if(!this.state.audioCtx) return;
        const osc = this.state.audioCtx.createOscillator();
        const gain = this.state.audioCtx.createGain();
        osc.connect(gain); gain.connect(this.state.audioCtx.destination);
        if(type === 'glitch') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, this.state.audioCtx.currentTime);
            gain.gain.value = 0.05; osc.start(); osc.stop(this.state.audioCtx.currentTime + 0.1);
        } else {
            osc.type = 'sine'; osc.frequency.setValueAtTime(440, this.state.audioCtx.currentTime);
            gain.gain.value = 0.1; osc.start(); osc.stop(this.state.audioCtx.currentTime + 0.2);
        }
    },

    speak: function(text) {
        if('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(text);
            const voice = this.state.voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
            if(voice) utter.voice = voice;
            window.speechSynthesis.speak(utter);
        }
    },

    gameOver: function(reason) {
        this.speak("Mission Failed.");
        // Use custom alert
        this.showAlert(reason, "MISSION_FAILURE");
        
        // Wait a few seconds for them to read the failure before kicking back to menu
        setTimeout(() => {
            this.closeAlert();
            this.returnToMenu();
        }, 4000);
    },
    
    closeManual: function() {
        document.getElementById('modal-manual').classList.add('hidden');
    },

    // --- CUSTOM ALERT SYSTEM ---
    showAlert: function(msg, title = "SYSTEM_NOTIFICATION") {
        const modal = document.getElementById('modal-alert');
        const titleEl = document.getElementById('alert-title');
        const msgEl = document.getElementById('alert-msg');
        
        if(modal && titleEl && msgEl) {
            titleEl.innerText = title;
            msgEl.innerText = msg;
            modal.classList.remove('hidden');
        } else {
            // Fallback if HTML isn't ready
            alert(msg);
        }
    },

    closeAlert: function() {
        const modal = document.getElementById('modal-alert');
        if(modal) modal.classList.add('hidden');
    },
    
    resetModule3: function() {
        if(confirm("Reset Module 3 progress?")) {
            this.state.unlockedLevels = 1;
            this.state.scores = { 1: 0, 2: 0, 3: 0 };
            this.updateMenuUI();
        }
    }
    
};

window.mod3 = mod3;
window.onload = function() { mod3.init(); };