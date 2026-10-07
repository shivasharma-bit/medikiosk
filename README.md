# MediKiosk

> **Smart India Hackathon (SIH) Project**
> AI-Assisted Pre-Consultation and Patient History Intake Platform

---

## Overview

MediKiosk converts multilingual voice/touch patient interactions and historical medical documents into structured, physician-reviewable clinical histories — reducing the burden of manual history collection before doctor consultations.

```
Patient → Language → Consent → Registration → AI Interview
→ Documents → OCR → Review → AI Summary → Red-Flag Screening
→ Doctor Queue → Doctor Review → Final Clinical Record
```

---

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React + Vite + Tailwind CSS             |
| Backend   | Node.js + Express.js                   |
| Database  | MongoDB + Mongoose                      |
| Auth      | JWT + bcrypt                           |
| AI        | Google Gemini API                      |
| OCR       | Tesseract.js                           |
| STT/TTS   | Web Speech API → Bhashini (Phase 11)   |
| Storage   | Cloudinary                             |
| Charts    | Recharts                               |

---

## Quick Start (Windows, one step)

1. Install **Node.js LTS** from https://nodejs.org (one time).
2. Double-click **`start.bat`** in this folder.

The first run installs packages, builds the frontend and downloads a built-in MongoDB (~100 MB, needs internet once). After that it starts in seconds and opens **http://localhost:5000**. Keep the black window open while using the app.

No MongoDB installation, no `.env` editing and no seeding are needed: `backend/.env` is created automatically, a JWT secret is generated, and the demo users are created on first start. Data is stored in `%LOCALAPPDATA%\MediKiosk\mongo` (outside the project, so OneDrive cannot lock it) and survives restarts.

Manual start (any OS):

```bash
cd backend  && npm install && cd ..
cd frontend && npm install && npm run build && cd ..
cd backend  && npm start        # -> http://localhost:5000  (frontend + API on one port)
```

Developing the frontend with hot reload: run the backend as above, then `cd frontend && npm run dev` and open http://localhost:5173 (API calls are proxied to :5000). After frontend edits, delete `frontend/dist` and run `start.bat` again to rebuild.

### Real AI summaries (Gemini)

1. Get a free key at https://aistudio.google.com/apikey
2. Open `backend/.env`, set `AI_API_KEY=your_key`, save, restart.

With a key: Gemini extracts symptoms from answers, picks the next interview question, writes the clinical summary (never a diagnosis), and structures OCR text from uploaded reports. Without a key everything still works; the summary is auto-written from the answers and labelled as such. If Gemini rejects the default model, change `AI_MODEL` in `.env`.

### Other settings (`backend/.env`)

| Setting | Meaning |
|---|---|
| `MONGODB_URI` | Leave empty for the built-in database, or paste a MongoDB Atlas / local URI |
| `PORT` | Default 5000 |
| `AI_API_KEY`, `AI_MODEL` | Gemini key and model |

---

## Demo Access

| Portal | URL | Login |
|---|---|---|
| Patient kiosk | http://localhost:5000/ -> Patient | no login (register with a 10-digit mobile number) |
| Doctor | http://localhost:5000/doctor/login | `doctor@medikiosk.in` / `Doctor@1234` |
| Admin | http://localhost:5000/admin/login | `admin@medikiosk.in` / `Admin@1234` |

---

## Project Structure

```
SIH_Project/
├── frontend/           React + Vite + Tailwind
│   └── src/
│       ├── components/ui/   Button, Card, Badge, Modal, Spinner, ProgressBar
│       ├── pages/
│       │   ├── patient/     Welcome → Consent → Registration → Interview → Documents → Review → Confirmation
│       │   ├── doctor/      Login, Dashboard, PatientDetail
│       │   └── admin/       Dashboard
│       ├── layouts/         PatientLayout, DoctorLayout, AdminLayout
│       ├── context/         AuthContext, PatientContext
│       ├── hooks/           useVoice, useTranslation
│       ├── i18n/            en.json, hi.json
│       └── routes/          AppRoutes.jsx
│
└── backend/            Node + Express + MongoDB
    └── src/
        ├── models/
        ├── controllers/
        ├── routes/
        ├── services/    aiService, ocrService, summaryService, redFlagService
        └── middleware/
```

---

## Implementation Phases

- [x] Phase 0 - Scaffolding
- [x] Phase 1 - Design System
- [x] Phase 2 - Patient UI
- [x] Phase 3 - Doctor Dashboard
- [x] Phase 4 - Admin Dashboard
- [x] Phase 5 - Express Backend
- [x] Phase 6 - MongoDB + Mongoose Models (built-in database, no install)
- [x] Phase 7 - Authentication (JWT + bcrypt, doctor/admin roles, kiosk patient tokens)
- [x] Phase 8 - Patient APIs Live (registration + consent)
- [x] Phase 9 - Interview Engine (rule engine, English + Hindi)
- [x] Phase 10 - AI Integration (Gemini extraction, next-question selection, clinical summary)
- [~] Phase 11 - Voice (browser Web Speech API; Bhashini not integrated)
- [x] Phase 12 - OCR Pipeline (Tesseract.js + Gemini structuring; images only, PDFs are stored without OCR)
- [x] Phase 13 - Clinical Summary
- [x] Phase 14 - Red-Flag Engine (`backend/src/services/redFlagService.js`, English + Hindi keywords, shown on doctor queue and record)
- [x] Phase 15 - Doctor Workflow Live (queue, record, mark reviewed)
- [x] Phase 16 - Admin Analytics
- [ ] Phase 17 - Mock FHIR/ABDM
- [~] Phase 18 - Testing (Jest suites exist: `cd backend && npm test`)
- [ ] Phase 19 - Deployment

## Changelog (latest)

- One-click start (`start.bat`), single port, auto `.env`, auto JWT secret, auto demo users, built-in persistent MongoDB.
- Fixed "Registration failed": backend was not running / needed MongoDB; also the frontend sent a stale doctor token on patient requests and now picks the right token per portal. Expired patient sessions no longer redirect to doctor login.
- Added red-flag screening and surfaced it in the doctor dashboard.
- Better no-AI fallback summary (written from the patient's answers).
- Fixed admin stats (interviews completed/in-progress always showed 0), doctor "Mark as Reviewed" no longer drops the patient name, uploaded files load without a hard-coded port.
- Longer AI timeouts so Gemini summaries are not cut off.

---

## Safety Disclaimer

MediKiosk is **not a medical diagnosis system**.

- AI assists with: information extraction, adaptive questioning, summarization, red-flag identification
- The doctor makes all final clinical decisions
- All AI outputs are clearly marked as drafts until physician confirmation

---

## Team

| Member | Area |
|--------|------|
| Member 1 | Patient Frontend |
| Member 2 | Doctor + Admin Frontend |
| Member 3 | Backend + MongoDB + Auth |
| Member 4 | AI + OCR + Voice + Integration |

## Git Branch Convention

```
main → develop → feature/patient-ui
                  feature/doctor-dashboard
                  feature/backend-auth
                  feature/ai
                  feature/ocr
                  feature/voice
```

---

*Built for Smart India Hackathon · MediKiosk v1.1*
