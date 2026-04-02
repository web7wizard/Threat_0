import { auth } from '../auth.js';
import { db } from '../database.js';

const asse = {
    state: {
        userId: 'guest',
        docId: null,
        scores: { m1: 0, m2: 0, m3: 0 },
        currentQuestion: 0,
        totalScore: 0,
        timerInterval: null,
        
        // 50 UNIQUE CYBERSECURITY QUESTIONS
        questions: [
            // --- SECTION 1: PHISHING & SOCIAL ENGINEERING ---
            { q: "What is the primary goal of a Phishing attack?", options: ["To speed up your PC", "To steal sensitive info via deception", "To physically steal a laptop", "To update software"], ans: 1 },
            { q: "You receive an email from 'PayPa1-Support' asking for a password. This is:", options: ["Legitimate", "Typosquatting/Phishing", "A system update", "Two-Factor Auth"], ans: 1 },
            { q: "What is 'Pretexting' in social engineering?", options: ["Encrypting data", "Inventing a fake scenario to gain trust", "Testing a firewall", "Deleting logs"], ans: 1 },
            { q: "Which file extension is commonly blocked in emails due to malware risk?", options: [".txt", ".jpg", ".exe", ".pdf"], ans: 2 },
            { q: "Hovering over a link in an email allows you to:", options: ["Download the file", "See the actual destination URL", "Decrypt the email", "Delete the sender"], ans: 1 },
            { q: "What is 'Spear Phishing'?", options: ["Random spam emails", "Targeted attacks on specific individuals", "Attacks using audio deepfakes", "Phishing via SMS"], ans: 1 },
            { q: "Phishing via SMS text messages is called:", options: ["Vishing", "Smishing", "Pharming", "Whaling"], ans: 1 },
            { q: "What is the best immediate action if you click a phishing link?", options: ["Reply to the sender", "Disconnect from the network", "Turn off the monitor", "Delete the browser"], ans: 1 },
            { q: "A 'CEO Fraud' email usually requests:", options: ["A software update", "An urgent wire transfer", "A meeting invite", "A password change"], ans: 1 },
            { q: "What visual indicator in a browser helps identify a secure site?", options: ["The color red", "A padlock icon", "A flashing banner", "The font size"], ans: 1 },

            // --- SECTION 2: MALWARE & ENDPOINT SECURITY ---
            { q: "What is 'Ransomware'?", options: ["Free antivirus", "Malware that encrypts files for payment", "Software that speeds up RAM", "A hardware firewall"], ans: 1 },
            { q: "Which malware disguises itself as legitimate software?", options: ["Worm", "Trojan Horse", "Spyware", "Adware"], ans: 1 },
            { q: "What distinguishes a 'Worm' from a virus?", options: ["Worms need a host file", "Worms self-replicate across networks", "Worms only affect Macs", "Worms are hardware"], ans: 1 },
            { q: "What is the function of a 'Keylogger'?", options: ["To lock keys", "To record keystrokes/passwords", "To log into websites", "To encrypt drives"], ans: 1 },
            { q: "What is a 'Zero-Day' vulnerability?", options: ["A virus older than 0 days", "A flaw unknown to the vendor/unpatched", "A successful update", "A scheduled scan"], ans: 1 },
            { q: "If your PC slows down and fan runs high, it might be:", options: ["Cryptojacking malware", "A fast internet connection", "A good update", "Screen saver mode"], ans: 0 },
            { q: "What is the 'Quarantine' function in Antivirus?", options: ["Deleting a file immediately", "Isolating a file to prevent execution", "Sending file to the hacker", "Encrypting the file"], ans: 1 },
            { q: "Which tool allows an attacker remote control of a victim PC?", options: ["RAT (Remote Access Trojan)", "VPN", "DNS", "GUI"], ans: 0 },
            { q: "What is a 'Drive-by Download'?", options: ["Downloading while driving", "Unintended download by visiting a site", "Manually saving a file", "Updating via USB"], ans: 1 },
            { q: "What is the best defense against data loss from Ransomware?", options: ["Strong Passwords", "Offline Backups", "Firewalls", "Incognito Mode"], ans: 1 },

            // --- SECTION 3: NETWORK ATTACKS (MITM, DDoS) ---
            { q: "What does MITM stand for?", options: ["Man-in-the-Middle", "Malware-in-the-Memory", "Mail-in-the-Mail", "Man-in-the-Matrix"], ans: 0 },
            { q: "Which network is most risky for MITM attacks?", options: ["Home Ethernet", "Public/Open Wi-Fi", "Cellular 5G", "Corporate VPN"], ans: 1 },
            { q: "What does a VPN do to prevent MITM?", options: ["Speeds up Wi-Fi", "Encrypts traffic in a tunnel", "Deletes cookies", "Blocks ads"], ans: 1 },
            { q: "What is the main goal of a DDoS attack?", options: ["Steal data", "Disrupt service availability", "Guess passwords", "Encrypt files"], ans: 1 },
            { q: "What is a 'Botnet' in the context of DDoS?", options: ["A network of robots", "A network of hijacked devices", "A fast server", "A firewall rule"], ans: 1 },
            { q: "Which technique creates a fake Wi-Fi access point?", options: ["Evil Twin", "Bluebugging", "Phishing", "SQL Injection"], ans: 0 },
            { q: "What is 'Session Hijacking'?", options: ["Stealing a laptop", "Stealing a Session Cookie/ID", "Locking a user out", "Cracking a password"], ans: 1 },
            { q: "What does 'RPS' stand for in DDoS analysis?", options: ["Requests Per Second", "Route Packet System", "Random Port Scan", "Real Protocol Security"], ans: 0 },
            { q: "Which defense helps against DDoS?", options: ["Restarting the server", "Rate Limiting & IP Filtering", "Deleting the database", "Changing the domain"], ans: 1 },
            { q: "What is ARP Poisoning used for?", options: ["DDoS", "MITM attacks on a LAN", "Encrypting email", "Cracking Wi-Fi passwords"], ans: 1 },

            // --- SECTION 4: AUTHENTICATION & ACCESS CONTROL ---
            { q: "What does MFA stand for?", options: ["Main File Access", "Multi-Factor Authentication", "My Favorite App", "Manual Firewall Action"], ans: 1 },
            { q: "Which is an example of 'Something you are' (MFA)?", options: ["Password", "Smart Card", "Fingerprint/Biometric", "PIN Code"], ans: 2 },
            { q: "Which is an example of 'Something you have' (MFA)?", options: ["Password", "Phone/OTP Token", "Retina Scan", "Username"], ans: 1 },
            { q: "Why is 'Password123' a bad password?", options: ["It is too long", "It is susceptible to Dictionary Attacks", "It uses special chars", "It is hard to remember"], ans: 1 },
            { q: "What is a 'Brute Force' attack?", options: ["Physically breaking a server", "Guessing every possible password combo", "Stealing a key", "Phishing email"], ans: 1 },
            { q: "What is the purpose of a Password Manager?", options: ["To use one password everywhere", "To store complex passwords securely", "To share passwords publicly", "To delete passwords"], ans: 1 },
            { q: "What does 'Credential Stuffing' involve?", options: ["Creating new accounts", "Using leaked logins on other sites", "Deleting accounts", "Encrypting logins"], ans: 1 },
            { q: "When should you change a compromised password?", options: ["Immediately", "Next month", "Never", "When the account expires"], ans: 0 },
            { q: "What is 'Least Privilege'?", options: ["Giving users admin rights", "Giving users only necessary access", "Blocking all access", "Sharing passwords"], ans: 1 },
            { q: "Is SMS 2FA considered the most secure MFA?", options: ["Yes, unhackable", "No, susceptible to SIM Swapping", "Yes, it is encrypted", "No, it requires internet"], ans: 1 },

            // --- SECTION 5: GENERAL SECURITY & WEB ---
            { q: "What does HTTPS indicate?", options: ["High Speed", "Hyper Text Transfer Protocol Secure", "HTML Standard", "Host Protocol"], ans: 1 },
            { q: "What prevents scripts from stealing cookies?", options: ["Secure Flag", "HttpOnly Flag", "NoScript", "JavaBlock"], ans: 1 },
            { q: "What is 'SQL Injection'?", options: ["Injecting virus into hardware", "Injecting code into a database query", "Installing SQL software", "Updating a database"], ans: 1 },
            { q: "What does a Firewall do?", options: ["Cools the CPU", "Filters network traffic based on rules", "Speeds up downloads", "Encrypts the hard drive"], ans: 1 },
            { q: "What is 'Encryption'?", options: ["Hiding a file", "Encoding data so only authorized can read", "Deleting data", "Compressing a file"], ans: 1 },
            { q: "What is 'Symmetric Encryption'?", options: ["Using different keys", "Using the same key for lock/unlock", "No keys used", "Using a password only"], ans: 1 },
            { q: "What does 'Patch Management' involve?", options: ["Fixing hardware", "Applying software updates/fixes", "Managing cables", "Patching clothes"], ans: 1 },
            { q: "What is 'Social Engineering'?", options: ["Coding a social network", "Manipulating people into divesting info", "Building servers", "Hacking Wi-Fi"], ans: 1 },
            { q: "What is a 'White Hat' hacker?", options: ["A malicious hacker", "An ethical hacker", "A government agent", "A novice hacker"], ans: 1 },
            { q: "What is the CIA Triad?", options: ["Central Intelligence Agency", "Confidentiality, Integrity, Availability", "Computer Internet Access", "Code Input Analysis"], ans: 1 }
        ]
    },

    init: async function() {
        const user = await auth.getCurrentUser();
        if(user) {
            this.state.userId = user.$id;
            const progress = await db.getUserProgress(user.$id);
            if(progress) {
                this.state.docId = progress.$id;
                
                if(!progress.mod3_complete) {
                    alert("ACCESS DENIED: Module 3 incompletion detected.");
                    window.location.href = 'module1.html';
                    return;
                }
            }
        }
    },

    shuffleArray: function(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex != 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    },

    startQuiz: function() {
        document.getElementById('screen-intro').classList.remove('active');
        document.getElementById('screen-quiz').classList.add('active');
        document.getElementById('screen-report').classList.remove('active'); // Ensure report is hidden on retake
        
        this.state.currentQuestion = 0;
        this.state.totalScore = 0;
        
        // Reset Progress UI
        document.getElementById('progress-bar').style.width = '0%';
        
        // Shuffle the order of questions themselves (optional, but good for retakes)
        this.state.questions = this.shuffleArray(this.state.questions);

        this.renderQuestion();
        this.startTimer(90 * 60); 
    },

    retakeQuiz: function() {
        // Stop any existing timer just in case
        if(this.state.timerInterval) clearInterval(this.state.timerInterval);
        this.startQuiz();
    },

    startTimer: function(duration) {
        if(this.state.timerInterval) clearInterval(this.state.timerInterval);
        
        let timer = duration, minutes, seconds;
        const display = document.getElementById('timer-display');
        display.classList.remove('critical'); // Reset red state
        
        this.state.timerInterval = setInterval(() => {
            minutes = parseInt(timer / 60, 10);
            seconds = parseInt(timer % 60, 10);

            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;

            display.textContent = minutes + ":" + seconds;

            if(timer < 300) {
                display.classList.add('critical');
            }

            if (--timer < 0) {
                this.forceFinish(); 
            }
        }, 1000);
    },

    forceFinish: function() {
        clearInterval(this.state.timerInterval);
        alert("TIME LIMIT REACHED. Submitting assessment...");
        this.finishQuiz();
    },

    renderQuestion: function() {
        if(this.state.currentQuestion >= this.state.questions.length) {
            this.finishQuiz();
            return;
        }

        const qObj = this.state.questions[this.state.currentQuestion];
        const correctText = qObj.options[qObj.ans];

        let shuffledOptions = [...qObj.options];
        shuffledOptions = this.shuffleArray(shuffledOptions);

        document.getElementById('q-text').innerText = `${qObj.q}`;
        document.getElementById('q-counter').innerText = `Q ${this.state.currentQuestion+1} / 50`;
        
        const pct = ((this.state.currentQuestion) / 50) * 100;
        document.getElementById('progress-bar').style.width = pct + '%';

        const container = document.getElementById('options-container');
        container.innerHTML = '';

        shuffledOptions.forEach((optText) => {
            const btn = document.createElement('button');
            btn.className = 'opt-btn';
            btn.innerText = optText;
            btn.onclick = () => this.handleAnswer(btn, optText, correctText);
            container.appendChild(btn);
        });
    },

    handleAnswer: function(btnElement, selectedText, correctText) {
        const allBtns = document.querySelectorAll('.opt-btn');
        allBtns.forEach(b => b.disabled = true);
        btnElement.classList.add('selected');
        this.playSound('input');

        if(selectedText === correctText) {
            this.state.totalScore += 2;
        }

        setTimeout(() => {
            this.state.currentQuestion++;
            this.renderQuestion();
        }, 500); 
    },

    finishQuiz: function() {
        if(this.state.timerInterval) clearInterval(this.state.timerInterval);

        document.getElementById('screen-quiz').classList.remove('active');
        document.getElementById('screen-report').classList.add('active');
        document.getElementById('progress-bar').style.width = '100%';

        const asseScore = this.state.totalScore; 
        const passedAsse = asseScore >= 70; 

        const verdictEl = document.getElementById('final-verdict');
        const msgEl = document.getElementById('final-msg');
        const scoreEl = document.getElementById('score-big');
        const actionsEl = document.getElementById('report-actions');

        // Update Score Display
        scoreEl.innerText = asseScore;
        
        // Clear previous buttons
        actionsEl.innerHTML = '';

        // Create Buttons
        const btnExit = document.createElement('button');
        btnExit.className = 'btn-primary';
        btnExit.innerText = 'EXIT SYSTEM';
        btnExit.onclick = () => window.location.href = 'module1.html';

        if(passedAsse) {
            verdictEl.innerText = "CERTIFIED";
            verdictEl.className = "verdict-stamp verdict-pass";
            scoreEl.style.color = "var(--success-green)";
            scoreEl.style.textShadow = "0 0 20px var(--success-green)";
            
            msgEl.innerHTML = "STATUS: <span style='color:var(--success-green)'>OPERATIONAL READY</span><br><br>Congratulations Agent. You have successfully demonstrated high competency.";
            
            this.playSound('success');
            this.saveResult(true, asseScore);
            
            // Only Show Exit Button
            actionsEl.appendChild(btnExit);
        } else {
            verdictEl.innerText = "FAILED";
            verdictEl.className = "verdict-stamp verdict-fail";
            scoreEl.style.color = "var(--alert-red)";
            scoreEl.style.textShadow = "0 0 20px var(--alert-red)";
            
            msgEl.innerHTML = `CERTIFICATION DENIED.<br>Score below 70% threshold.<br><br>Retraining Recommended.`;

            this.playSound('fail');
            this.saveResult(false, asseScore);

            // Show Retake AND Exit Buttons
            const btnRetry = document.createElement('button');
            btnRetry.className = 'btn-retry';
            btnRetry.innerText = 'RETAKE EXAM';
            btnRetry.onclick = () => this.retakeQuiz();
            
            actionsEl.appendChild(btnRetry);
            actionsEl.appendChild(btnExit);
        }
    },

    saveResult: async function(passed, score) {
        if(!this.state.docId) return;

        const progress = await db.getUserProgress(this.state.userId);
        let scoresObj = {};
        try {
            scoresObj = JSON.parse(progress.scores || "{}");
        } catch(e) {}
        
        scoresObj['assessment'] = score;

        const dataToUpdate = {
            scores: JSON.stringify(scoresObj),
            assessment_complete: passed
        };

        await db.saveProgress(this.state.docId, dataToUpdate);
    },

    playSound: function(type) {
        try {
            const audio = new AudioContext();
            const osc = audio.createOscillator();
            const gain = audio.createGain();
            osc.connect(gain); gain.connect(audio.destination);
            const now = audio.currentTime;

            if(type === 'input') {
                osc.type = 'square'; 
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.1);
                osc.start(); osc.stop(now + 0.1);
            } else if(type === 'success') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(554, now + 0.2); 
                osc.frequency.setValueAtTime(659, now + 0.4); 
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 1.5);
                osc.start(); osc.stop(now + 1.5);
            } else if(type === 'fail') {
                osc.type = 'sawtooth'; 
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.linearRampToValueAtTime(60, now + 0.5);
                gain.gain.setValueAtTime(0.1, now); 
                gain.gain.linearRampToValueAtTime(0, now + 0.5);
                osc.start(); osc.stop(now + 0.5);
            }
        } catch(e) {}
    }
};

window.asse = asse;
window.onload = function() { asse.init(); };