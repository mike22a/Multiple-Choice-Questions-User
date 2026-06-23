# 🎯 Quiz App — User Interface

> **Participant-facing Quiz Platform** — The end-user experience for discovering, taking, and reviewing multiple-choice quizzes. Designed for desktop and mobile with a real-time timer, auto-save drafts, and optional safe-mode proctoring.

---

## 📌 Overview

| Property | Value |
|---|---|
| **App Name** | `quiz-user` |
| **Type** | Next.js 14 (App Router — UI only) |
| **Domain** | `https://app.quizapp.com` |
| **Deployment** | Vercel |
| **Auth** | User JWT via `quiz-api` (no direct DB access) |
| **i18n** | `next-intl` — EN 🇬🇧 & ID 🇮🇩 |
| **UI** | Tailwind CSS + shadcn/ui |
| **State** | Zustand (quiz session state, answer draft) |
| **Draft Save** | Upstash Redis (managed by API) |

---

## 📁 Project Structure

```
apps/user/
├── src/
│   └── app/
│       └── [locale]/                    # next-intl locale routing
│           ├── layout.tsx
│           ├── (auth)/
│           │   └── login/
│           │       └── page.tsx
│           ├── (main)/                  # With nav header
│           │   ├── layout.tsx
│           │   ├── dashboard/page.tsx   # Home — available quizzes + history
│           │   ├── quizzes/
│           │   │   ├── page.tsx         # Quiz browse / list
│           │   │   └── [slug]/page.tsx  # Quiz intro / start page
│           │   ├── results/
│           │   │   ├── page.tsx         # My attempt history
│           │   │   └── [attemptId]/page.tsx  # Result detail
│           │   └── profile/page.tsx     # Profile + language preference
│           └── (session)/              # Quiz session — NO nav shown
│               └── quiz/[attemptId]/
│                   └── page.tsx         # The active quiz UI
├── messages/
│   ├── en.json                          # English translations
│   └── id.json                          # Indonesian translations
├── src/components/
│   ├── ui/                              # shadcn/ui base components
│   ├── quiz/
│   │   ├── QuizCard.tsx                 # Quiz list card
│   │   ├── QuizTimer.tsx               # Countdown timer (sticky)
│   │   ├── QuestionDisplay.tsx         # Question + image viewer
│   │   ├── AnswerOption.tsx            # Single/multiple choice options
│   │   ├── QuestionNavigator.tsx       # Number grid (answered/unanswered)
│   │   ├── ProgressBar.tsx             # Question progress
│   │   └── SubmitDialog.tsx            # Submit confirmation modal
│   └── layout/
│       ├── Header.tsx
│       └── SafeModeOverlay.tsx         # Violation warning overlay
├── src/hooks/
│   ├── useQuizSession.ts               # Session state + auto-save
│   ├── useTimer.ts                     # Countdown logic (server offset)
│   └── useSafeMode.ts                  # Tab/window visibility detection
├── src/store/
│   └── quizSessionStore.ts             # Zustand: answers, timer state
├── src/lib/
│   ├── api-client.ts                   # Typed fetch wrapper → quiz-api
│   ├── auth.ts                         # Client auth helpers
│   └── timer.ts                        # getRemainingSeconds, formatCountdown
├── .env.local                          # ⚠️ Never commit
├── .env.example
└── TRACKER.md                          # 📋 Local task tracker
```

---

## ⚙️ Environment Variables

```bash
# .env.local (never commit this file)

# Public — OK to expose (just the API URL)
NEXT_PUBLIC_API_URL=https://api.quizapp.com

# ⚠️ NO JWT secrets here.
# This app NEVER touches the database directly.
# All data flows through quiz-api.
```

---

## 🚦 Getting Started

```bash
# 1. Install dependencies (from monorepo root)
pnpm install

# 2. Copy env template
cp .env.example .env.local
# → Set NEXT_PUBLIC_API_URL to your API URL

# 3. Start development server
pnpm dev
# → User UI at http://localhost:3002

# 4. Type-check
pnpm typecheck
```

---

## 🗺️ User Journey & Pages

```
User Navigation
├── 🏠 Dashboard (/)
│   ├── Available quizzes (published, within date range)
│   ├── My recent attempts
│   └── Profile summary
│
├── 📋 Quiz List (/quizzes)
│   ├── Browse all available quizzes
│   ├── Quiz info card: title, duration, attempts remaining
│   └── Start Quiz → navigates to quiz intro
│
├── 📖 Quiz Intro (/quizzes/[slug])
│   ├── Quiz description + rules
│   ├── Duration, pass score, attempt info
│   └── "Start Quiz" button → POST /api/user/quizzes/:slug/start
│
├── 🎯 Quiz Session (/quiz/[attemptId])  ← NO main nav shown
│   ├── Question display (text + up to 5 images, swipeable on mobile)
│   ├── Answer options (single or multiple choice)
│   ├── Auto-save indicator ("Saved ✓") — every answer saves to Redis
│   ├── Progress bar: Question X of Y
│   ├── Timer: HH:MM:SS countdown (red at < 5 min)
│   ├── Question navigator grid (answered = filled, unanswered = outlined)
│   └── Submit button with confirmation dialog
│
├── 📈 My Results (/results)
│   ├── Attempt history (all quizzes, all attempts)
│   └── Result detail (/results/[attemptId])
│       ├── Score, pass/fail status
│       ├── Per-question review (if enabled by admin)
│       └── Answer explanations (if provided)
│
└── 👤 Profile (/profile)
    ├── Edit name
    ├── Change password
    └── Language preference (EN / ID)
```

---

## ⏱️ Timer Architecture

> The timer is **server-authoritative**. The client never calculates the end time itself.

```
1. API returns: { expires_at: "2026-01-01T10:30:00Z", server_time: "2026-01-01T10:00:00Z" }
2. Client calculates offset: serverOffset = serverTime - Date.now()
3. Countdown: getRemainingSeconds(expires_at, serverOffset) called every second
4. At 0: client triggers POST /api/user/attempts/:id/submit (force)
5. API double-checks expires_at on submit — rejects if already expired
```

---

## 🔒 Safe Mode (when enabled by admin)

| Event | Action |
|-------|--------|
| Tab switch / window blur | POST violation to API |
| Fullscreen exit | POST violation + warning shown |
| Right-click / copy attempt | POST violation |
| > 3 violations (configurable) | Force submit triggered |

> ⚠️ Safe mode is a **deterrent**, not a hard lock. The Fullscreen API cannot guarantee prevention on all browsers. This limitation is documented for quiz administrators.

---

## 📱 Mobile Responsiveness

| Requirement | Implementation |
|-------------|---------------|
| Min viewport | 375px (no horizontal scroll) |
| Touch targets | ≥ 44×44px |
| Question images | Swipeable carousel on mobile |
| Timer | Sticky header on mobile |
| Question navigator | Collapsible bottom sheet on mobile |
| Form inputs | `type="email"`, `type="number"` for correct mobile keyboard |

---

## 🌐 i18n Setup

```
messages/
├── en.json   — English (default)
└── id.json   — Indonesian
```

Key groups:
```json
{
  "common": { "loading", "error", "save", "cancel", "submit" },
  "quiz": { "startButton", "timeRemaining", "questionOf", "autoSaved", "submitConfirm", "forceSubmitWarning" },
  "safeMode": { "warning", "violationCount", "forceSubmit" },
  "auth": { "login", "logout", "username", "password" },
  "profile": { "editName", "changePassword", "language" }
}
```

---

## 🧩 Key Features

| Feature | Status | Notes |
|---------|--------|-------|
| User Login / JWT Auth | 🔲 Planned | Phase 3 |
| Quiz List & Discovery | 🔲 Planned | Phase 3 |
| Quiz Session (timer, questions) | 🔲 Planned | Phase 3 |
| Auto-save to Redis | 🔲 Planned | Phase 3 |
| Submit Flow (Redis → DB) | 🔲 Planned | Phase 3 |
| Result Page | 🔲 Planned | Phase 4 |
| Safe Mode (stub) | 🔲 Planned | Phase 3 |
| Safe Mode (full) | 🔲 Planned | Phase 5 |
| i18n EN + ID | 🔲 Planned | Phase 3 |
| Mobile Responsive | 🔲 Planned | Phase 4 |
| PWA Support | 🔲 Planned | Phase 5 |

---

## 📋 Task Tracker

See [`TRACKER.md`](./TRACKER.md) for the full task breakdown with status and progress.

---

## 📖 References

- [Project Plan](./PROJECT_PLAN.md) — Architecture, schema, full user flow
- [Agent Instructions](./AGENT.md) — Hard rules, code standards, checklists
- [API Service README](../Multiple-Choice-Questions-API/README.md)
- [Vercel Dashboard](https://vercel.com/dashboard)
