# 🎯 Phase 4: Quiz Session

This tracker covers the active quiz session lifecycle: timer synching, progress tracking, question loading, image carousels, drafts auto-saving, and manual submit modals.

## 📋 Task List

### U4.1: Session Loading
| ID | Task | Status | Notes |
|----|------|--------|-------|
| U4.1.1 | Handle quiz entry redirection and load questions | 🔲 | |
| U4.1.2 | Resume check on page mount | 🔲 | Pulls current Redis draft state |

### U4.2: Timer Synchronization
| ID | Task | Status | Notes |
|----|------|--------|-------|
| U4.2.1 | Implement `useTimer` countdown hook | 🔲 | RULE-06 offset adjustment logic |
| U4.2.2 | Build sticky `QuizTimer` header component | 🔲 | Highlight warning at < 5 min |
| U4.2.3 | Trigger auto-submit callback when countdown hits 0 | 🔲 | |

### U4.3: Question Board
| ID | Task | Status | Notes |
|----|------|--------|-------|
| U4.3.1 | Build `QuestionDisplay` content canvas | 🔲 | |
| U4.3.2 | Build question images viewer | 🔲 | Swipeable slider for mobile |
| U4.3.3 | Build choices components (Radios vs Checkboxes) | 🔲 | |
| U4.3.4 | Save option selection to Redis on select action | 🔲 | Triggers auto-save visual indicator |

### U4.4: Navigation & Submission
| ID | Task | Status | Notes |
|----|------|--------|-------|
| U4.4.1 | Build question session progress bar | 🔲 | |
| U4.4.2 | Build grid-based question navigation panel | 🔲 | |
| U4.4.3 | Build Prev / Next button controllers | 🔲 | |
| U4.4.4 | Build submit dialog modal | 🔲 | Shows warning if unanswered items exist |
| U4.4.5 | Dispatch final session submit endpoint request | 🔲 | Redirects to evaluation screen |
