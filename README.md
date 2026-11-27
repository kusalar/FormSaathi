# FormSaathi — Voice-First Scholarship Application Assistant

**Built for the Wispr Flow Build for Bharat Competition**

FormSaathi helps Indian students—especially first-generation learners and students from rural and semi-urban areas—discover scholarships, check eligibility, organize required documents, and prepare for applications using natural voice or text conversations in **English**, **Hindi (हिन्दी)**, and **Bengali (বাংলা)**.

---

## Disclaimer: Demonstration Data & Privacy

- **Demonstration Scholarships Only**: All scholarships included in this MVP (`src/data/scholarships.json`) are clearly labelled **DEMONSTRATION** entries for practice and prototyping. They do **not** represent verified live government notifications. Students must always verify official requirements and apply directly through official portals such as the [National Scholarship Portal (scholarships.gov.in)](https://scholarships.gov.in).
- **Privacy-First by Design**: FormSaathi **never** collects Aadhaar numbers, bank account numbers, passwords, OTPs, or sensitive documents, and **never** submits applications automatically.
- **No Paid APIs or Secrets**: Runs 100% locally in the browser with zero API keys or mandatory backend.

---

## Core Features

- **Voice-First Multilingual Assistant**: Supports **English (`en-IN`)**, **Hindi (`hi-IN`)**, and **Bengali (`bn-IN`)** via the browser Web Speech API (`SpeechRecognition` + `SpeechSynthesis`), with animated listening sound waves, live `Idle / Listening / Processing / Speaking` states, repeat/stop voice controls, and an always-available text fallback.
- **Confirm-Before-Saving Intelligence**: Extracts course, academic year, institution type, family income bracket, and state from natural speech/text, asks **one question at a time**, and confirms detected details before saving.
- **8 Distinct Interactive Pages**:
  1. **Home / Dashboard (`/`)**: Personalized welcome, hero illustration, live voice assistant widget, application & document readiness progress, profile-ranked demo scholarships, and recent activity.
  2. **My Profile (`/profile`)**: Editable student education profile with inline validation, reset option, and `localStorage` persistence.
  3. **Find Scholarships (`/scholarships`)**: Search bar, category filter pills (`All`, `Merit`, `STEM`, `State`, `Means`, `First-Gen`), mismatch filter, expandable cards, and detail modal.
  4. **Eligibility Check (`/eligibility`)**: Step-by-step 5-question interactive wizard with live matched demo scholarships.
  5. **Document Checklist (`/documents`)**: Per-scholarship interactive document checkboxes, completion percentage, preparation tips, and reset action.
  6. **Application Assistant (`/assistant`)**: Full-page conversational voice & text assistant with sample prompts and match explanations.
  7. **My Progress (`/progress`)**: Overall readiness summary, saved scholarships, and activity timeline.
  8. **Help & Support (`/help`)**: Searchable accordion FAQs, live browser speech diagnostic, and official portal guidance.

---

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **UI & Language**: React 19, TypeScript, Tailwind CSS v4
- **Icons**: `lucide-react`
- **Voice**: Browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) & `SpeechSynthesis`
- **Persistence**: Browser `localStorage` (`formsaathi_state_v1`) + local JSON (`src/data/scholarships.json`)

---

## Architecture Overview

```text
src/
├── app/                  # 8 App Router pages (/, /profile, /scholarships, /eligibility, /documents, /assistant, /progress, /help)
├── components/           # AppShell, AssistantWidget, VoiceControls, ScholarshipModal, ToastContainer
├── context/              # AppContext.tsx (global state, localStorage persistence, toast queue, voice playback)
├── data/                 # scholarships.json (clearly labelled DEMONSTRATION records)
├── lib/
│   ├── i18n.ts           # English, Hindi, Bengali UI translations
│   ├── scholarships.ts   # Eligibility matching engine & income/course parsers
│   └── voiceEngine.ts    # Web Speech API wrappers + multilingual conversational parser
└── types/                # Shared TypeScript interfaces
```

---

## Installation & Local Development

### Prerequisites
- **Node.js** 18+ (tested with Node.js `v22.17.0`)
- **npm** 9+ (tested with npm `10.9.2`)
- **Browser**: Google Chrome or Microsoft Edge recommended for Web Speech API support.

### Steps
```bash
# 1. Install dependencies
npm install

# 2. Configure Supabase environment variables (optional for local demo mode, required for Auth & DB)
# Copy .env.example to .env.local and fill in your Supabase URL and Publishable Key:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key

# 3. Start the development server
npm run dev
```

### Supabase & Vercel Setup
1. **Run SQL Migrations**: In **Supabase Dashboard → SQL Editor**, run:
   - `supabase/migrations/0001_formsaathi_schema.sql` (creates `public_opportunities`, `profiles`, `student_preferences`, `saved_opportunities`, and `application_tracking` with Row Level Security enabled on every user-specific table, plus the `on_auth_user_created` trigger).
   - `supabase/migrations/0002_extended_student_profile.sql` (adds `college_name`, `branch`, `graduation_year`, `skills`, `preferred_categories`, and `preferred_work_mode` to `student_preferences`).
2. **Email Verification & Password Reset**:
   - In **Supabase Dashboard → Authentication → Providers → Email**, keep **Confirm email** enabled.
   - In **Supabase Dashboard → Authentication → URL Configuration**, set **Site URL** to your production Vercel URL (`https://your-vercel-domain.vercel.app`) and add these **Redirect URLs**:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/auth/reset-password`
     - `https://your-vercel-domain.vercel.app/auth/callback`
     - `https://your-vercel-domain.vercel.app/auth/reset-password`
3. **Environment Variables**:
   - **Locally**: Enter `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` (never commit `.env.local`; no service-role key is used in client code).
   - **Vercel**: Add the exact same two variables in **Vercel Dashboard → Project → Settings → Environment Variables** and redeploy.

### Security & Demo Mode
- **Row Level Security (RLS)**: Every user-specific table enforces `auth.uid()` ownership policies; `public_opportunities` is read-only and separated from private student records.
- **Explicit Migration**: If a signed-in user has existing `localStorage` data, FormSaathi offers an explicit one-time **Import to Account / Dismiss** banner and never silently overwrites cloud data.
- **Demo Mode**: Without Supabase credentials, FormSaathi runs cleanly in local browser demo mode using `localStorage` and clearly labelled `DEMONSTRATION` scholarships.

Open **`http://localhost:3000`** in Chrome or Edge.

### Production Build Check
```bash
npm run build
```

---

## Visuals & Assets

All illustrations are stored locally under `public/images/` and `public/assets/` (zero external image URLs):
- `public/images/hero-scholar.jpg` — Student hero illustration
- `public/images/assistant-bot.jpg` — FormSaathi assistant mascot
- `public/images/scholarship-trophy.jpg` — Scholarship & achievement illustration
- `public/assets/document-prep.jpg` — Document checklist illustration
- `public/assets/educational-success.jpg` — Student success illustration

---

## Known Limitations

- Browser `SpeechRecognition` depends on browser/OS support (works best in Chrome/Edge; unsupported browsers automatically use the text input fallback).
- Scholarship data is currently a local demonstration dataset (`isDemo: true`) rather than a live government API feed.

## Future Improvements

- Integration with verified, curated official state and central scholarship feeds.
- Offline-first PWA support for low-connectivity rural areas.
- Regional voice support for additional Indian languages (Tamil, Telugu, Marathi, Odia).
