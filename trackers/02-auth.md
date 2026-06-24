# 🔐 Phase 2: Auth & App Shell

This tracker covers User login forms, session token storage, silent refresh intercepts, and general nav layout headers.

## 📋 Task List

| ID | Task | Status | Notes |
|----|------|--------|-------|
| U2.1 | Build login page (`/[locale]/(auth)/login`) | ✅ | High-fidelity forms built using RHF + Zod |
| U2.2 | Hook up login form to `/api/auth/user/login` | ✅ | Integrated with user auth API and zustand session store |
| U2.3 | Write 401 response silent token refresh interceptor | ✅ | Configured token expiry redirect |
| U2.4 | Build dashboard logout trigger | ✅ | Clears stores and redirects to login |
| U2.5 | Implement app header navigation with responsive language toggle | ✅ | App Header built; hidden in active session view |
| U2.6 | Resolve hydration race condition for persisted Zustand session | ✅ | Wait for Zustand persist hydration before executing auth guard redirects in layout |
| U2.7 | Fix responsive horizontal layout overflow (viewport bleeding) | ✅ | Constrained layout container using relative and overflow-x-hidden |
| U2.8 | Tune modal sizing & padding responsive constraints | ✅ | Redefined modal widths and paddings to fit beautifully on small screens |
