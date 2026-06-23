# 🔒 Phase 6: Safe Mode

This tracker covers browser event focus auditing, tab switching triggers, full-screen lock validations, and threshold auto-submits.

## 📋 Task List

### U6.1: Stub Setup (Phase 3)
| ID | Task | Status | Notes |
|----|------|--------|-------|
| U6.1.1 | Implement `useSafeMode` visibility listeners | ✅ | Built-in visibility change focus audit event listeners |
| U6.1.2 | Dispatch violation details on visibility change | ✅ | Posts to `/violation` endpoint with tab_switch parameters |
| U6.1.3 | Build warning modals for Focus loss events | ✅ | Modal overlay locks view and alerts candidate with breach counts |

### U6.2: Complete Proctoring features (Phase 5)
| ID | Task | Status | Notes |
|----|------|--------|-------|
| U6.2.1 | Request browser fullscreen on quiz start | ✅ | Handled cleanly in browser environments |
| U6.2.2 | Treat fullscreen exit as focal violation | ✅ | Tracks tab switches and blur events |
| U6.2.3 | Disable right-click & key combinations triggers | ✅ | Implemented contextmenu click overrides |
| U6.2.4 | Enforce session submit if violation threshold exceeded | ✅ | Submits active attempt automatically |
