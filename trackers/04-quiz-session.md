# 🎯 Phase 4: Quiz Session

This tracker covers the active quiz session lifecycle: timer synching, progress tracking, question loading, image carousels, drafts auto-saving, and manual submit modals.

## 📋 Task List

### U4.1: Session Loading
| ID | Task | Status | Notes |
|----|------|--------|-------|
| U4.1.1 | Handle quiz entry redirection and load questions | ✅ | Direct entry router page checks and pulls active questions |
| U4.1.2 | Resume check on page mount | ✅ | Automatically hydrates selectedAnswers map from Redis draft |

### U4.2: Timer Synchronization
| ID | Task | Status | Notes |
|----|------|--------|-------|
| U4.2.1 | Implement `useTimer` countdown hook | ✅ | Calculated via server expiresAt offset in seconds |
| U4.2.2 | Build sticky `QuizTimer` header component | ✅ | Warning state colors (rose pulsing) when time remaining < 1 min |
| U4.2.3 | Trigger auto-submit callback when countdown hits 0 | ✅ | Automatically submits current draft state to backend submit API |

### U4.3: Question Board
| ID | Task | Status | Notes |
|----|------|--------|-------|
| U4.3.1 | Build `QuestionDisplay` content canvas | ✅ | Custom render area matching single/multiple selections |
| U4.3.2 | Build question images viewer | ✅ | Visual container scaling appropriately |
| U4.3.3 | Build choices components (Radios vs Checkboxes) | ✅ | Circular radios and rounded checkboxes design |
| U4.3.4 | Save option selection to Redis on select action | ✅ | Instantly updates database/Redis via /answer endpoint |

### U4.4: Navigation & Submission
| ID | Task | Status | Notes |
|----|------|--------|-------|
| U4.4.1 | Build question session progress bar | ✅ | Displayed as answered count status |
| U4.4.2 | Build grid-based question navigation panel | ✅ | Custom question navigation grid map |
| U4.4.3 | Build Prev / Next button controllers | ✅ | Navigation controllers at bottom of session view |
| U4.4.4 | Build submit dialog modal | ✅ | Submit confirmation modal alerts about unanswered count |
| U4.4.5 | Dispatch final session submit endpoint request | ✅ | Submits active attempt and pushes user to results page |
