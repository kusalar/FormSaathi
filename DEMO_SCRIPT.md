# FormSaathi — 3-Minute Competition Demo Script

**Target Duration**: ~3 minutes  
**Setup Before Starting**: Open `http://localhost:3000` in Google Chrome (so Web Speech API is ready) with a clean profile or reset state.

---

### 0:00 – 0:30 | The Problem & Introduction
- **Say**: *"Across India, millions of first-generation college students from rural and semi-urban families miss out on scholarships—not because they aren't eligible, but because scholarship portals are English-heavy, confusing, and overwhelming."*
- **Show**: Point to the **FormSaathi Home Dashboard (`/`)** — highlight the clean indigo-violet design, student hero, and the **DEMONSTRATION DATA & Privacy-First** banner (no Aadhaar, no bank details, no auto-submit).

### 0:30 – 1:00 | Language Switching (English / हिन्दी / বাংলা)
- **Action**: Click the top-right **Language Selector** and switch from **English** to **हिन्दी (Hindi)** or **বাংলা (Bengali)**, showing the entire interface and assistant greeting update immediately.
- **Say**: *"FormSaathi speaks the student's language—supporting English, Hindi, and Bengali across both the interface and voice interaction."*

### 1:00 – 1:50 | Voice Interaction & Confirmation Flow
- **Action**: Open **Application Assistant (`/assistant`)** or use the Dashboard Assistant widget. Tap the **Microphone** button (or click the sample prompt) and say:
  > *"I am a third-year B.Tech student. I want to find scholarships I can apply for."*
- **Show**:
  1. The animated sound-wave & **Listening / Speaking** states.
  2. FormSaathi detects **3rd Year, B.Tech** and **asks to confirm** before saving (*"I heard: 3rd Year, B.Tech. Please confirm..."*).
  3. Click **"Yes, that's right"** (or say *"Yes"*).
  4. FormSaathi asks the remaining questions **one at a time** (Institution Type → Family Income → State).
  5. Select `Government`, `₹5 Lakh – ₹8 Lakh`, and `West Bengal`.

### 1:50 – 2:30 | Scholarship Matching & Document Checklist
- **Show**: FormSaathi immediately presents **matching demonstration scholarships** and explains **why each result matches** (e.g. course match, income limit).
- **Action**: Click **View** on a matched scholarship to open the **Detail Modal** (showing eligibility breakdown & guided steps), then click **Prepare Documents** to jump to **Document Checklist (`/documents`)**.
- **Action**: Check off 1–2 documents (e.g., *Marksheet*, *College Bonafide*) and show the completion percentage and **My Progress (`/progress`)** updating live.

### 2:30 – 3:00 | Social Impact & Closing
- **Say**: *"FormSaathi turns an intimidating, multi-page form process into a friendly, trustworthy 2-minute conversation—empowering first-generation learners across Bharat to check eligibility, prepare documents safely, and apply with confidence on official portals."*
