import { auth } from '../auth.js';
import { db } from '../database.js'; // IMPORT DB

const app = {
    state: {
        health: 100,
        currentScore: 0,
        scores: { 1: 0, 2: 0, 3: 0 },
        maxScores: { 1: 30, 2: 30, 3: 40 },
        
        activeSubLevel: 0,
        unlockedSubLevels: 1, 
        
        // Game States
        timer: null,
        timeRemaining: 0,
        shopPhase: 'product',
        audioCtx: null,
        oscillator: null,
        voices: [], // Voice storage
        l3_flags: { sourceIdentified: false, pwSecured: false, sessionKilled: false, tfaEnabled: false, scanned: false, supportContacted: false },
        emailIndex: 0,
        feedbackLogs: [], 
        
        // Unlocking States
        module2Unlocked: false,
        module3Unlocked: false,
        
        // User Info
        userId: 'guest',
        
        // --- CLOUD DATABASE STATE ---
        docId: null,      
        allScores: "{}",

        // Content Data
                emails: [
            {
                id: 1,
                sender: "security-alert@paypaI.com",
                subject: "Action Required: Unusual Sign-In Activity",
                body: "<p>Hello,</p><p>We noticed a sign-in attempt to your account from a new device or location.</p><p>For your security, please <a href='#'>confirm your identity</a> as soon as possible to avoid temporary account limitations.</p><p>Thank you for helping us keep your account safe.</p>",
                type: "phish",
                reason: "Spoofed Sender (paypaI) and false urgency."
            },
            {
                id: 2,
                sender: "hr@company.internal",
                subject: "Updated Workplace Policies – Q4 Review",
                body: "<p>Hi Team,</p><p>As part of our Q4 review, we’ve made a few updates to company policies.</p><p>Please take a moment to review the attached PDF and reach out to HR if you have any questions.</p><p>Thanks,<br>HR Team</p>",
                type: "safe",
                reason: "Internal domain, standard business context."
            },
            {
                id: 3,
                sender: "ceo.urgent@gmail.com",
                subject: "Need Immediate Assistance",
                body: "<p>Hi,</p><p>I’m tied up in meetings and need you to handle something time-sensitive for me.</p><p>Please process a wire transfer of $15,000 immediately. I’ll explain later—do not call me right now.</p><p>Thanks for taking care of this quickly.</p>",
                type: "phish",
                reason: "CEO fraud: Personal Gmail for financial requests."
            }
        ]

    },

    init: async function() { 
        this.updateHUD(); 
        
        // Audio Setup
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.state.audioCtx = new AudioContext();
        } catch(e) {}

        // Voice Setup
        if('speechSynthesis' in window) {
            window.speechSynthesis.onvoiceschanged = () => {
                this.state.voices = window.speechSynthesis.getVoices();
            };
        }

        // 1. GET CURRENT USER ID & LOAD CLOUD PROGRESS
        const user = await auth.getCurrentUser();
        if (user) {
            this.state.userId = user.$id;
            console.log("Logged in as:", user.name, "ID:", this.state.userId);

            // --- APPWRITE INTEGRATION: LOAD PROGRESS ---
            const progress = await db.getUserProgress(user.$id);
            
            if (progress) {
                // Store the Document ID for future updates
                this.state.docId = progress.$id;
                this.state.allScores = progress.scores; // Keep raw JSON for merging later

                // A. RESTORE MODULE UNLOCKS
                if (progress.mod1_complete) {
                    this.state.module2Unlocked = true;
                    this.unlockModule2Visuals();
                }
                if (progress.mod2_complete) {
                    this.state.module3Unlocked = true;
                    this.unlockModule3Visuals();
                }

                // --- CHECK MODULE 4 UNLOCK (Final Assessment) ---
                if (progress.mod3_complete) {
                    const m4 = document.getElementById('module-4-card');
                    const m4Status = document.getElementById('module-4-status');
                    if(m4) {
                        m4.classList.remove('locked');
                        m4.classList.add('available');
                        m4.onclick = function() { window.location.href = 'asse.html'; };
                    }
                    if(m4Status) {
                        m4Status.innerText = "STATUS: ACTIVE";
                        m4Status.style.color = "var(--success-green)";
                    }
                }

                // B. RESTORE SCORES & SUB-LEVEL UNLOCKS FOR MODULE 1
                try {
                    const parsedScores = JSON.parse(progress.scores);
                    if (parsedScores.m1) {
                        this.state.scores = parsedScores.m1;
                        
                        // FIX: Recalculate unlocked levels based on saved scores
                        if (this.state.scores[1] > 0) this.state.unlockedSubLevels = 2;
                        if (this.state.scores[2] > 0) this.state.unlockedSubLevels = 3;
                        
                        console.log("Restored Mod 1. Unlocked Levels:", this.state.unlockedSubLevels);
                    }
                } catch (e) {
                    console.error("Error parsing cloud scores:", e);
                }
            }
        } else {
            console.log("Playing as Guest");
        }

        // 2. CHECK LOCAL STORAGE FALLBACK
        const m1Key = `threat0_${this.state.userId}_mod1_complete`;
        const m2Key = `threat0_${this.state.userId}_mod2_complete`;

        if(localStorage.getItem(m1Key) === 'true') {
            this.state.module2Unlocked = true;
            this.unlockModule2Visuals();
        }

        if(localStorage.getItem(m2Key) === 'true') {
            this.state.module3Unlocked = true;
            this.unlockModule3Visuals();
        }
    },

    // --- LOGOUT FUNCTION ---
    logout: async function() {
        await auth.logout();
        window.location.href = 'index.html';
    },

    // --- RESET FUNCTION (User Specific) ---
    // --- CORRECTED RESET: Wipes only existing attributes ---
    resetData: async function() {
        this.showConfirm("ACTIVATE FULL SYSTEM WIPE?\n\nThis will permanently delete your scores and re-lock all modules.", async () => {
            
            console.log("Initializing Factory Reset...");

            // 1. Wipe Local Storage
            const prefix = `threat0_${this.state.userId}_`;
            localStorage.removeItem(`${prefix}mod1_complete`);
            localStorage.removeItem(`${prefix}mod2_complete`);
            localStorage.removeItem(`${prefix}mod3_complete`);
            // We don't need to wipe mod4 locally if it doesn't exist

            // 2. Wipe Cloud Database (Appwrite)
            if (this.state.docId) {
                try {
                    // REMOVED mod4_complete because it doesn't exist in your DB schema
                    await db.saveProgress(this.state.docId, {
                        mod1_complete: false,
                        mod2_complete: false,
                        mod3_complete: false,
                        scores: "{}" 
                    });
                    console.log("Cloud Database wiped successfully.");
                } catch (error) {
                    console.error("Cloud wipe failed:", error);
                    alert("Database Error: Could not reset cloud data.");
                }
            }

            // 3. Reload
            setTimeout(() => {
                window.location.reload(); 
            }, 500); 
        });
    },

    resetModule1: function() {
        this.showConfirm("WARNING: This will reset your progress within Module 1.\n\nAre you sure you want to restart?", () => {
            // 1. Reset Local State
            this.state.unlockedSubLevels = 1;
            this.state.scores = { 1: 0, 2: 0, 3: 0 };
            this.state.currentScore = 0;
            this.state.health = 100;
            
            // 2. Reset Cloud State for M1
            if(this.state.docId) {
                const updatedScores = db.mergeScores(this.state.allScores, 'm1', { 1: 0, 2: 0, 3: 0 });
                this.state.allScores = updatedScores;
                
                db.saveProgress(this.state.docId, {
                    scores: updatedScores
                });
            }

            this.updateSubLevelLocks();
        });
    },

    // --- VISUAL UNLOCKERS ---
    unlockModule2Visuals: function() {
        const m2 = document.getElementById('module-2-card');
        const m2Status = document.getElementById('module-2-status');
        if(m2) {
            m2.classList.remove('locked'); 
            m2.classList.add('available');
            m2.onclick = function() { window.location.href = 'module2.html'; };
        }
        if(m2Status) {
            m2Status.innerText = "STATUS: ACTIVE";
            m2Status.style.color = "var(--success-green)";
        }
    },

    unlockModule3Visuals: function() {
        const m3 = document.getElementById('module-3-card');
        const m3Status = document.getElementById('module-3-status');
        if(m3) {
            m3.classList.remove('locked'); 
            m3.classList.add('available');
            m3.onclick = function() { window.location.href = 'module3.html'; };
        }
        if(m3Status) {
            m3Status.innerText = "STATUS: ACTIVE";
            m3Status.style.color = "var(--success-green)";
        }
    },

    // --- GAME NAVIGATION & MODALS ---
    openDocs: function() { document.getElementById('modal-docs').classList.remove('hidden'); },
    closeDocs: function() { document.getElementById('modal-docs').classList.add('hidden'); },

    goToMainMenu: function() { 
        this.stopTimer(); 
        this.stopSiren(); 
        this.showScreen('screen-main-menu'); 
        this.hideHUD(); 
        document.getElementById('breach-overlay').classList.add('hidden'); 
        
        if(this.state.module2Unlocked) this.unlockModule2Visuals();
        if(this.state.module3Unlocked) this.unlockModule3Visuals();
    },

    goToSubLevelMenu: function(moduleId) { 
        if(moduleId !== 1) return; 
        this.showScreen('screen-sublevel-menu'); 
        this.updateSubLevelLocks(); 
        this.hideHUD(); 
    },

    updateSubLevelLocks: function() { 
        for(let i=1; i<=3; i++) { 
            const card = document.getElementById(`sub-card-${i}`); 
            if(i <= this.state.unlockedSubLevels) { 
                card.classList.remove('locked'); card.classList.add('available'); card.style.pointerEvents = 'auto'; 
            } else { 
                card.classList.add('locked'); card.classList.remove('available'); card.style.pointerEvents = 'none'; 
            } 
        } 
    },

    initLevel: function(id) {
    this.state.activeSubLevel = id;

    let steps = "";

    if (id === 1) {
        steps = `
            <ul class="level-steps">
                <li>Inspect the sender’s email address</li>
                <li>Analyze the email subject and tone</li>
                <li>Hover over links to verify destinations</li>
                <li>Decide whether the email is safe or phishing</li>
            </ul>
        `;
    } 
    else if (id === 2) {
        steps = `
            <ul class="level-steps">
                <li>Review the website URL carefully</li>
                <li>Check for HTTPS and certificate validity</li>
                <li>Look for fake reviews or missing contact info</li>
                <li>Determine if the shop is legitimate</li>
            </ul>
        `;
    } 
    else if (id === 3) {
        steps = `
            <ul class="level-steps">
                <li>Identify signs of account compromise</li>
                <li>Reset your account password</li>
                <li>Terminate all active sessions</li>
                <li><b>Contact IT Support immediately</b></li>
            </ul>
        `;
    }

    document.getElementById('brief-steps').innerHTML = steps;
    document.getElementById('modal-briefing').classList.remove('hidden');
},


    startMission: function() {
        document.getElementById('modal-briefing').classList.add('hidden');
        this.startSubLevel(this.state.activeSubLevel);
    },

    startSubLevel: function(subId) {
        this.state.health = 100;
        this.state.currentScore = 0;
        this.showHUD();
        
        if(subId === 1) { 
            this.state.emailIndex = 0; 
            this.renderEmail(); 
            this.showScreen('game-sub1'); 
            this.resetTimer(60); 
            this.startTimer(); 
            this.speak("Incoming mail stream. Analyze for social engineering vectors.");
        } 
        else if(subId === 2) { 
            this.state.shopPhase = 'product'; 
            this.renderShop(); 
            this.showScreen('game-sub2'); 
            this.resetTimer(60); 
            this.startTimer(); 
            this.speak("E-commerce transaction. Verify vendor legitimacy before purchase.");
        } 
        else if(subId === 3) { 
            this.l3_startBreachMode(); 
        }
    },

    // --- SUMMARY & SAVING ---
    showSummary: function() {
        this.showScreen('screen-summary'); 
        this.hideHUD();
        
        const s1 = this.state.scores[1];
        const s2 = this.state.scores[2];
        const s3 = this.state.scores[3];
        const total = s1 + s2 + s3; 
        const percent = Math.round((total / 100) * 100); 

        document.getElementById('sum-total').innerText = total + "/100";
        document.getElementById('sum-percent').innerText = percent + "%";
        document.getElementById('score-l1').innerText = s1;
        document.getElementById('score-l2').innerText = s2;
        document.getElementById('score-l3').innerText = s3;

        let status = "FAILED";
        let color = "var(--neon-red)";
        let nextMsg = "Minimum passing score: 70%. Retrain to unlock next module.";
        
        if(total >= 70) { 
            status = "PASSED"; 
            color = "var(--neon-green)"; 
            this.state.module2Unlocked = true;
            
            // 1. LOCAL SAVE
            localStorage.setItem(`threat0_${this.state.userId}_mod1_complete`, 'true');
            
            // 2. APPWRITE CLOUD SAVE
            if (this.state.docId) {
                const updatedScoresJSON = db.mergeScores(this.state.allScores, 'm1', this.state.scores);
                this.state.allScores = updatedScoresJSON;

                db.saveProgress(this.state.docId, {
                    mod1_complete: true,
                    scores: updatedScoresJSON
                });
            }

            nextMsg = "Module 2 (Malware Defense) UNLOCKED. Return to Main Menu.";
        } else {
            this.state.module2Unlocked = false; 
        }
        
        const elStatus = document.getElementById('sum-status');
        elStatus.innerText = status;
        elStatus.style.color = color;
        
        const nextEl = document.getElementById('next-step-msg');
        nextEl.innerText = nextMsg;
        nextEl.style.color = color;

        const logCont = document.getElementById('feedback-log-container');
        logCont.innerHTML = "";
        if(this.state.feedbackLogs.length === 0) {
            logCont.innerHTML = "<div class='feedback-item'>No actions recorded.</div>";
        } else {
            this.state.feedbackLogs.forEach(log => {
                const div = document.createElement('div');
                div.className = `feedback-item ${log.success ? 'good' : 'bad'}`;
                div.innerText = `[LVL ${log.level}] ${log.success ? '✓' : '✗'} ${log.msg}`;
                logCont.appendChild(div);
            });
        }
    },

    // --- GAME LOGIC (LEVEL 1: EMAIL) ---
    renderEmail: function() {
        const e = this.state.emails[this.state.emailIndex];
        document.getElementById('email-sender').innerText = e.sender;
        document.getElementById('email-subject').innerText = e.subject;
        document.getElementById('email-body').innerHTML = e.body;
        document.getElementById('email-progress').innerText = `Email ${this.state.emailIndex+1}/${this.state.emails.length}`;
    },
    handleDecision: function(action) {
        this.stopTimer();
        const e = this.state.emails[this.state.emailIndex];
        if(e.type === 'phish' && action === 'report') {
            this.processResult(true, "THREAT BLOCKED", e.reason, 10, 0, "Correctly reported phishing email.");
            this.speak("Phishing attempt neutralized.");
        }
        else if(e.type === 'safe' && action === 'open') {
            this.processResult(true, "ACCESS GRANTED", e.reason, 10, 0, "Correctly opened safe email.");
            this.speak("Communication verified. Access granted.");
        }
        else {
            this.processResult(false, "SECURITY FAILURE", e.reason, 0, 10, "Failed to identify email correctly.");
            this.speak("Security protocol failed. Threat missed.");
        }
    },

    // --- GAME LOGIC (LEVEL 2: SHOP) ---
    renderShop: function() {
        const content = document.getElementById('shop-content');
        const controls = document.getElementById('shop-controls');
        if(this.state.shopPhase === 'product') {
            this.stopSiren();
            content.innerHTML = `<div class="product-layout"><img src="../assets/lap.jpg" class="prod-img" alt="Gaming Laptop"><div class="prod-details"><h1>Quantum X1 Extreme</h1><div class="price-tag">$49.99 <span class="old-price">$2,499.00</span></div><p class="stock-warning">⚠️ ONLY 2 LEFT! OFFER ENDS IN 00:30</p><p>Incredible performance. Impossible price. No returns.</p><p>Sold by: <i>TrustedSeller_123</i> (No Reviews)</p></div></div>`;
            controls.innerHTML = `<p style="font-size: 1.3rem; font-weight: bold; color: #00f3ff; margin-right: 20px;">ANALYSIS REQUIRED:</p><button class="btn-warning" onclick="app.handleShopAction('analyze')">ANALYZE URL</button><button class="btn-success" onclick="app.handleShopAction('buy_click')">BUY NOW</button>`;
        } else if(this.state.shopPhase === 'checkout') {
            content.innerHTML = `<div class="checkout-form"><h2>SECURE PAYMENT</h2><input type="text" placeholder="Cardholder Name" value="John Doe"><input type="text" placeholder="Card Number" value="4532 0000 0000 0000"><input type="text" placeholder="EXP / CVV" value="12/25 - 123"></div>`;
            controls.innerHTML = `<p style="font-size: 1.3rem; margin-right: 20px;">CONFIRM:</p><button class="btn-warning" onclick="app.handleShopAction('cancel')">CANCEL</button><button class="btn-success" onclick="app.handleShopAction('submit')">SUBMIT PAYMENT</button>`;
        } else if(this.state.shopPhase === 'hacked') {
            this.playSiren();
            content.innerHTML = `<div class="fraud-alert"><h1>⚠️ FRAUD ALERT ⚠️</h1><br><h2>UNAUTHORIZED TRANSACTION</h2><h1 style="font-size: 4rem;">$5,000.00</h1><p style="font-size: 1.5rem;">SENDING DATA TO SERVER...</p></div>`;
            controls.innerHTML = `<p style="color: red; font-weight: bold; font-size: 1.5rem; animation: blink 0.2s infinite; margin-right: 20px;">CRITICAL ACTION REQUIRED:</p><button class="btn-freeze" onclick="app.handleShopAction('freeze')">FREEZE CARD NOW</button>`;
        }
    },
    handleShopAction: function(action) {
        if(action === 'buy_click') { this.state.shopPhase = 'checkout'; this.renderShop(); }
        else if(action === 'analyze') { 
            this.stopTimer(); 
            this.processResult(true, "FRAUD PREVENTED", "Fake URL detected.", 30, 0, "Correctly identified fake shop URL."); 
            this.speak("Analysis confirmed. URL is fraudulent.");
        } 
        else if(action === 'cancel') { 
            this.stopTimer(); 
            this.processResult(true, "ABORTED", "Site not secure.", 30, 0, "Correctly aborted transaction on http site."); 
            this.speak("Transaction aborted. Site insecure.");
        } 
        else if(action === 'submit') { 
            this.state.shopPhase = 'hacked'; this.renderShop(); this.state.health -= 30; this.updateHUD(); 
            this.logFeedback(false, "Entered credentials into fake shop."); 
            this.speak("Alert. Data exfiltration detected. Freeze accounts immediately.");
        }
        else if(action === 'freeze') { 
            this.stopTimer(); this.stopSiren(); 
            this.processResult(true, "DAMAGE CONTROLLED", "You froze the card, but authorized the scam.", 15, 30, "Froze card after breach (Partial Success)."); 
            this.speak("Accounts frozen. Damage mitigated.");
        }
    },

    // --- GAME LOGIC (LEVEL 3: BREACH) ---
    l3_startBreachMode: function() {
        this.showScreen('game-sub3');
        document.getElementById('breach-overlay').classList.remove('hidden');
        document.getElementById('l3-stage-alarm').classList.remove('hidden');
        document.getElementById('l3-stage-investigate').classList.add('hidden');
        document.getElementById('l3-stage-dashboard').classList.add('hidden');
        this.state.l3_flags = { sourceIdentified: false, pwSecured: false, sessionKilled: false, tfaEnabled: false, scanned: false, supportContacted: false };
        this.resetTimer(90);
        this.playSiren();
        
        this.speak("Critical Alert. System breach. Integrity compromised. Investigate immediately.");
    },
    l3_startInvestigation: function() { this.stopSiren(); document.getElementById('l3-stage-alarm').classList.add('hidden'); document.getElementById('l3-stage-investigate').classList.remove('hidden'); this.startTimer(); },
    l3_confirmSource: function() { 
        this.state.l3_flags.sourceIdentified = true; 
        this.state.currentScore += 5; 
        document.getElementById('l3-stage-investigate').classList.add('hidden'); 
        document.getElementById('l3-stage-dashboard').classList.remove('hidden'); 
        this.updateHUD(); 
        this.logFeedback(true, "Identified phishing source.");
        this.showSystemMessage("DASHBOARD UNLOCKED", "Secure the system immediately.<br><br>1. Reset Password<br>2. Kill Sessions<br>3. Enable 2FA<br>4. Scan Malware<br><b>5. CALL IT SUPPORT (Phone Icon)</b>");
        
        this.speak("Source identified. Dashboard access restored. Execute containment protocols.");
    },
    l3_allowDrop: function(ev) { ev.preventDefault(); },
    l3_drag: function(ev) { ev.dataTransfer.setData("type", ev.target.dataset.type); ev.dataTransfer.setData("text", ev.target.innerText); },
    l3_drop: function(ev) {
        ev.preventDefault();
        const type = ev.dataTransfer.getData("type");
        const zone = document.getElementById('pw-zone');
        if(type === 'strong') { zone.innerHTML = `<span style="color:var(--neon-green)">SECURED</span>`; zone.style.borderColor = 'var(--neon-green)'; this.state.l3_flags.pwSecured = true; this.state.currentScore += 10; this.l3_checkWin(); this.logFeedback(true, "Set a strong password."); this.speak("Password update accepted."); } 
        else { zone.innerHTML = `<span style="color:var(--neon-red)">TOO WEAK</span>`; this.state.health -= 10; this.updateHUD(); this.showSystemMessage("SECURITY WARNING", "Password complexity insufficient. Try again."); this.logFeedback(false, "Attempted weak password."); }
    },
    l3_submitPW: function() { if(this.state.l3_flags.pwSecured) document.getElementById('mod-pw').style.opacity = '0.5'; },
    l3_killSession: function(el) { el.style.display = 'none'; this.state.l3_flags.sessionKilled = true; this.state.currentScore += 5; this.l3_checkWin(); this.logFeedback(true, "Terminated unauthorized session."); this.speak("Session terminated."); },
    l3_toggle2FA: function() { if(document.getElementById('tfa-check').checked) { this.state.l3_flags.tfaEnabled = true; this.state.currentScore += 5; this.l3_checkWin(); this.logFeedback(true, "Enabled 2FA."); this.speak("Two factor authentication enabled."); } },
    l3_runScan: function() {
        document.getElementById('scan-bar-container').classList.remove('hidden');
        let width = 0;
        const interval = setInterval(() => {
            if(width >= 100) { clearInterval(interval); this.state.l3_flags.scanned = true; this.state.currentScore += 5; this.l3_checkWin(); this.logFeedback(true, "Ran malware scan."); this.speak("Scan complete. No further threats."); } 
            else { width += 2; document.getElementById('scan-bar').style.width = width + '%'; }
        }, 50);
    },
    l3_openPhone: function() { document.getElementById('phone-modal').classList.remove('hidden'); },
    l3_makeCall: function(who) {
        if(who === 'IT') { this.state.l3_flags.supportContacted = true; this.state.currentScore += 10; document.getElementById('phone-modal').classList.add('hidden'); document.querySelector('.phone-fab').style.display = 'none'; this.showSystemMessage("CONNECTION ESTABLISHED", "IT SUPPORT: 'Account frozen. We are logging the incident.'", () => { this.l3_checkWin(); }); this.logFeedback(true, "Contacted IT Support."); this.speak("Incident reported to I.T. Support."); } 
        else { this.showSystemMessage("CALL FAILED", "MOM: 'Honey, I don't know computer stuff. Call IT!'", null); this.state.health -= 5; this.updateHUD(); this.logFeedback(false, "Called wrong contact (Mom) during breach."); }
    },
    
    // --- CHECK WIN (Fixed 0 PTS Bug) ---
    l3_checkWin: function() {
        this.updateHUD();
        const f = this.state.l3_flags;
        if(f.pwSecured && f.sessionKilled && f.tfaEnabled && f.scanned && f.supportContacted) {
            this.stopTimer();
            this.stopSiren(); 
            document.getElementById('breach-overlay').classList.add('hidden');
            
            this.logFeedback(true, "Completed recovery protocol.");
            this.speak("Account Recovered. System Secured. Mission Complete.");
            // FIX: Show "MISSION COMPLETE" instead of "0 PTS"
            this.showFeedback("SYSTEM SECURED", "You recovered the account.", true, "MISSION COMPLETE"); 
        }
    },

    // --- SYSTEM UTILITIES ---
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

    processResult: function(isCorrect, title, msg, pts, dmg, logMsg) {
        this.stopSiren();
        if(isCorrect) this.state.currentScore += pts;
        this.state.health -= dmg;
        if(this.state.health < 0) this.state.health = 0;
        this.updateHUD();
        this.logFeedback(isCorrect, logMsg);
        this.showFeedback(title, msg, isCorrect, dmg > 0 ? -dmg + " HP" : "+" + pts + " PTS");
    },
    logFeedback: function(success, msg) { this.state.feedbackLogs.push({ success: success, msg: msg, level: this.state.activeSubLevel }); },
    showFeedback: function(title, msg, isSuccess, statVal) {
        const modal = document.getElementById('modal-feedback');
        modal.classList.remove('hidden');
        document.getElementById('fb-title').innerText = title;
        document.getElementById('fb-title').style.color = isSuccess ? 'var(--neon-green)' : 'var(--neon-red)';
        document.getElementById('fb-msg').innerText = msg;
        document.getElementById('fb-stats').innerText = statVal;
        document.getElementById('fb-btn').onclick = () => { this.closeFeedback(); this.nextStep(isSuccess); };
    },
    closeFeedback: function() { document.getElementById('modal-feedback').classList.add('hidden'); },
    nextStep: function(wasSuccess) {
        if(this.state.health <= 0) { 
            this.showSystemMessage("CRITICAL FAILURE", "Integrity compromised (0%). Restarting Level...", () => {
                this.startSubLevel(this.state.activeSubLevel);
            });
            return; 
        }
        if(this.state.activeSubLevel === 1) {
            if(this.state.emailIndex < this.state.emails.length - 1) { 
                this.state.emailIndex++; this.renderEmail(); this.resetTimer(60); this.startTimer(); 
            } else this.finishSubLevel();
        } else {
            this.finishSubLevel();
        }
    },
    finishSubLevel: function() {
        const lvl = this.state.activeSubLevel;
        this.state.scores[lvl] = this.state.currentScore; 
        
        // FIX: Unlock next sub-level immediately
        if(lvl === this.state.unlockedSubLevels && lvl < 3) {
            this.state.unlockedSubLevels++;
        }
        
        if(lvl === 3) {
            this.showSummary();
        } else {
            this.showSystemMessage("LEVEL COMPLETE", `Score recorded: ${this.state.currentScore}. Proceeding to next phase.`, () => {
                this.goToSubLevelMenu(1);
            });
        }
    },
    updateHUD: function() {
        const lvl = this.state.activeSubLevel;
        document.getElementById('health-bar').style.width = this.state.health + "%";
        document.getElementById('health-bar').style.backgroundColor = this.state.health < 40 ? 'var(--neon-red)' : 'var(--neon-cyan)';
        document.getElementById('score-display').innerText = this.state.currentScore;
        const max = this.state.maxScores[lvl] || 30;
        document.getElementById('score-target').innerText = "/ " + max;
    },
    startTimer: function() {
        document.getElementById('timer-box').classList.remove('hidden');
        clearInterval(this.state.timer);
        this.state.timer = setInterval(() => {
            this.state.timeRemaining--;
            document.getElementById('timer-display').innerText = `00:${this.state.timeRemaining < 10 ? '0'+this.state.timeRemaining : this.state.timeRemaining}`;
            if(this.state.timeRemaining <= 0) { clearInterval(this.state.timer); this.processResult(false, "TIMEOUT", "Time expired.", 0, 20, "Time ran out."); }
        }, 1000);
    },
    stopTimer: function() { clearInterval(this.state.timer); document.getElementById('timer-box').classList.add('hidden'); },
    resetTimer: function(sec) { this.state.timeRemaining = sec; document.getElementById('timer-display').innerText = sec; },
    showScreen: function(id) { document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); document.getElementById(id).classList.add('active'); },
    showHUD: function() { document.getElementById('hud').classList.remove('hidden'); },
    hideHUD: function() { document.getElementById('hud').classList.add('hidden'); },
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
    // FIX: Using innerHTML for tag rendering
    showSystemMessage: function(title, msg, onClose) {
        const modal = document.getElementById('modal-system');
        document.getElementById('sys-title').innerText = title;
        document.getElementById('sys-msg').innerHTML = msg; 
        const btn = document.getElementById('sys-btn');
        modal.classList.remove('hidden');
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.onclick = () => { modal.classList.add('hidden'); if(onClose) onClose(); };
    },
    playSiren: function() {
        if (!this.state.audioCtx) this.state.audioCtx = new AudioContext();
        if (this.state.audioCtx.state === 'suspended') this.state.audioCtx.resume();
        const osc = this.state.audioCtx.createOscillator();
        const gain = this.state.audioCtx.createGain();
        osc.type = 'sawtooth'; osc.frequency.value = 800;
        const lfo = this.state.audioCtx.createOscillator();
        lfo.type = 'sine'; lfo.frequency.value = 2; 
        const lfoGain = this.state.audioCtx.createGain(); lfoGain.gain.value = 600;
        lfo.connect(lfoGain); lfoGain.connect(osc.frequency); osc.connect(gain); gain.connect(this.state.audioCtx.destination);
        gain.gain.value = 0.1; 
        osc.start(); lfo.start();
        this.state.oscillator = { osc, lfo, gain };
    },
    stopSiren: function() { if (this.state.oscillator) { this.state.oscillator.osc.stop(); this.state.oscillator.lfo.stop(); this.state.oscillator.gain.disconnect(); this.state.oscillator = null; } }
};

// EXPOSE APP
window.app = app;
window.onload = function() { app.init(); };