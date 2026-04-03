# 🛡️ THREAT0 — Cybersecurity Defense Simulator  
### *Train Like a Defender. Think Like an Attacker.*

<div align="center">

🚀 **An immersive, gamified cybersecurity training platform built for real-world defense simulation.**

![Frontend](https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3%20%7C%20JavaScript-00f0ff?style=for-the-badge&logo=javascript)
![Backend](https://img.shields.io/badge/Backend-Appwrite-f02e65?style=for-the-badge&logo=appwrite)
![Status](https://img.shields.io/badge/Status-Active-00ff9d?style=for-the-badge)


✨ *Bridging the gap between theory and real-world cybersecurity defense.*

</div>

---

## Table of Contents
- Introduction  
- Objectives  
- Features  
- Learning Outcomes  
- Concepts Covered  
- Use Cases  
- Gameplay Workflow  
- Tech Stack  
- Project Structure  
- Database Schema  
- Installation Guide  
- Testing Strategy  
- Why THREAT0 Stands Out  
- Contribution  
- Author  
- Future Enhancements

---

## 📖 Introduction

Traditional cybersecurity training is passive and outdated. **THREAT0** transforms learning into an **interactive simulation experience**.

Instead of static MCQs, users:
- Investigate phishing emails  
- Detect malicious websites  
- Respond to live cyber attacks  

It includes real-time pressure through:
-  Timers  
-  System health  
-  Scoring  

---

## 🎯 Objectives

- Provide hands-on cybersecurity training  
- Simulate real attack scenarios  
- Improve decision-making under pressure  
- Build incident response skills  
- Make learning engaging  

---

## ✨ Features

### Gamification
- Health bar (system integrity)
- Countdown timers
- Dynamic scoring
- Level unlocking system

### Attack Simulation
- Phishing detection
- Fake e-commerce analysis
- Live breach response

### Authentication
- Secure login (Appwrite)
- Cloud save system
- Progress tracking

### UI/UX
- Cyberpunk theme
- CRT effects & neon glow
- Terminal-style interface

### Sensory Feedback
- Alarm sounds (Web Audio API)
- Voice instructions (Web Speech API)

###  Offline Mode
- LocalStorage support
- Guest gameplay

---

## 🧠 Learning Outcomes

Users will learn to:
- Identify phishing attacks  
- Detect insecure websites  
- Understand malware threats  
- Perform incident response  
- Recognize advanced attacks  

---
## 🧩 Concepts Covered

- Phishing Detection  
- Malware Analysis  
- Incident Response  
- Network Security  
- MITM & Session Hijacking  
---

## 🎯 Use Cases

- Cybersecurity training for students  
- Awareness programs in colleges  
- Practice tool for beginners in security  
- Demo project for hackathons & portfolios

---

## Gameplay Workflow

THREAT0 follows a structured, step-by-step progression system where users must complete each stage to unlock the next.


### Step 1: Entry Point
- User lands on the application (Landing Page)  
- Chooses:
  - Login (Registered User)  
  - Guest Mode (Offline Access)  



### Step 2: Dashboard (Mainframe)
- Central hub of the system  
- Displays:
  - Module availability (Locked / Unlocked)  
  - User progress  
  - Scores and status  



### Step 3: Module 1 — Phishing Defense
- Analyze suspicious emails  
- Detect fake URLs  
- Identify phishing attempts  
- Perform basic incident response  

 Unlocks Module 2 after successful completion  



### Step 4: Module 2 — Malware Defense
- Identify malicious files  
- Make safe download decisions  
- Understand file-based threats  

 Unlocks Module 3 after successful completion  



### Step 5: Module 3 — Advanced Attacks
- Understand Man-in-the-Middle (MITM) attacks  
- Detect session hijacking  
- Analyze network vulnerabilities  

 Unlocks Final Assessment  



### Step 6: Final Assessment
- Combined test of all modules  
- Time-based evaluation  
- Score-based passing criteria  

### Progress System
- Sequential unlocking of modules  
- Minimum score required to advance  
- Progress saved via:
  - Cloud (Appwrite)  
  - LocalStorage (Guest Mode) 

--- 
## 🛠️ Tech Stack
### Frontend
- HTML5
- CSS3
- JavaScript (ES6+)
### Backend
- Appwrite Auth
- Appwrite Database

---

## 📂 Project Structure

    THREAT0/
    │
    ├── assets/
    ├── index.html
    ├── style.css
    ├── script.js
    │
    ├── landing.*
    ├── login.*
    │
    ├── module2.*
    ├── module3.*
    ├── asse.*
    ├── cir.*
    │
    ├── auth.js
    ├── database.js
    └── appwriteConfig.js

---

## Database Schema

| Attribute     | Type   | Description |
| ------------- | ------ | ----------- |
| userId        | String | User ID     |
| mod1_complete | Bool   | Module 1    |
| mod2_complete | Bool   | Module 2    |
| mod3_complete | Bool   | Module 3    |
| mod4_complete | Bool   | Final       |
| scores        | JSON   | Scores      |

---

## Installation Guide
  
### Prerequisites
- VS Code + Live Server
- Appwrite Account

### Setup
           git clone https://github.com/yourusername/THREAT0.git
 
           cd THREAT0

### Configure Appwrite

     export const appwriteConfig = {
                    endpoint: 'https://cloud.appwrite.io/v1',
                    projectId: 'YOUR_PROJECT_ID',
                    databaseId: 'YOUR_DATABASE_ID',
                    collectionId: 'YOUR_COLLECTION_ID'
                };

### Run
- Open landing.html
- Run with Live Server

---

## Testing Strategy
- GUI testing
- Unit testing
- Authentication testing
- Edge cases
- Offline mode

---
## ⭐ Why THREAT0 Stands Out

- Combines **cybersecurity + gamification**
- Focuses on **real-world attack simulation**
- Built using **pure JavaScript (no frameworks)**
- Includes **cloud + offline support**
- Designed with **modern cyberpunk UI/UX**

---
##  🤝 Contribution
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---             
## Author                   
-  Javeriya Jamadar
-  Amina Subhedar  
---
## Project Deployed Link

The application is successfully deployed on Netlify and accessible online:

🔗 https://thread0.netlify.app

---
## Future Enhancements
- AI-based attack generation
- Multiplayer leaderboard
- Red vs Blue mode
- Mobile optimization
- More attack scenarios

---

<div align="center">

### 🛡️ THREAT0  
**Where cybersecurity is not learned — but experienced.**

⚡ *Built to simulate. Designed to educate. Ready to defend.*

</div>
