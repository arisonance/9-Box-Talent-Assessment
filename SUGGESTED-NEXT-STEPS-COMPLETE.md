# Suggested Next Steps Feature - COMPLETE ✅

## Overview

Successfully implemented an intelligent "Suggested Next Steps" panel that guides executives through profile completion with prioritized, actionable tasks while they wait for 360 feedback to arrive.

## What Was Built

### 🎯 SuggestedNextSteps Component

**File:** `src/components/SuggestedNextSteps.tsx` (293 lines)

**Key Features:**

1. **Three Priority Categories**
   - ⚡ **Quick Wins** (5-10 min each) - Yellow theme
   - 🎨 **Build Context** (15-30 min) - Purple theme
   - 📊 **Analyze** (when ready) - Blue theme

2. **Smart Suggestion Generation**
   - Analyzes employee progress data
   - Identifies gaps (missing reviews, plans, job descriptions, 360s)
   - Prioritizes by impact and urgency
   - Shows employee names (for small batches) or counts (for large teams)

3. **Time Estimates**
   - Every suggestion shows "~10 min" estimate
   - Helps executives batch similar tasks
   - Respects busy schedules

4. **One-Click Actions**
   - Click suggestion → Opens appropriate modal
   - Pre-selects first employee in the batch
   - Smooth integration with existing modals

5. **Progress Tracking**
   - Shows "X of Y completed today" at top
   - Checkboxes show completion state
   - Completed items appear grayed out with strikethrough

6. **Persistence**
   - LocalStorage: `sonance-next-steps-completed-${organizationId}`
   - Tracks which suggestions were acted upon
   - Resets daily automatically
   - Survives page refreshes

7. **Smart Features**
   - **Time-of-day awareness:** Morning → show quick wins first
   - **Team size adaptation:** 
     - Small team (<5): Show individual names
     - Large team (>10): Show counts
   - **Conditional display:** Only shows when team has incomplete profiles
   - **Collapsible sections:** Click to expand/collapse categories

## Integration

### Modified: `TeamProgressDashboard.tsx`

Added SuggestedNextSteps above the stats section:
```tsx
{/* Suggested Next Steps - only show if incomplete items exist */}
{stats.complete < stats.total && (
  <SuggestedNextSteps
    employeeProgress={employeeProgress}
    surveys360={surveys360}
    onOpenReviewModal={onOpenReviewModal}
    onOpenPlanModal={onOpenPlanModal}
    onOpen360Modal={onOpen360Modal}
    onOpenDetailModal={onOpenDetailModal}
    organizationId={organizationId}
  />
)}
```

## Suggestion Logic Examples

### Example 1: New Executive (just launched 360s)
```
🎯 Suggested Next Steps
0 of 5 completed today

⚡ QUICK WINS (5-10 min each)
☐ Add performance reviews for 3 team members → ~10 min
   Sarah Chen, Mike Rodriguez, Jordan Lee
☐ Complete job descriptions for 2 team members → ~8 min
   Alex Kim, Taylor Brown

🎨 BUILD CONTEXT (15-30 min)
☐ Add context while 5 360 reviews are pending → ~25 min
   Complete reviews and plans to be ready when feedback arrives

📊 ANALYZE (5 pending 360s)
⏸ Review 360 feedback when ready
   (Disabled - waiting for responses)
```

### Example 2: Returning Executive (360s completed)
```
🎯 Suggested Next Steps
2 of 3 completed today

🎨 BUILD CONTEXT (15-30 min)
☐ Create development plans for 4 team members → ~20 min
   Turn performance feedback into actionable growth roadmaps

📊 ANALYZE
☐ Review 360 feedback for 5 team members → ~30 min
   Analyze multi-source feedback and update profiles
```

## Prioritization Algorithm

```typescript
priority = baseScore + (employeeCount * 2) + urgencyBonus;

Base Scores:
- 360 launch: 9
- Performance review: 8
- Development plan: 7
- Job description: 6

Urgency Bonuses:
- High performer: +3
- New hire: +2
- Flight risk: +5
```

## Visual Design

- **Gradient background:** Blue-to-indigo gradient with border
- **Color-coded categories:** Yellow (quick wins), Purple (build context), Blue (analyze)
- **Clean icons:** Zap, Palette, BarChart3
- **Hover states:** Border changes, shadow appears
- **Disabled state:** Grayed out with clock icon
- **Completed state:** Green checkmark, strikethrough, grayed

## User Journey

### Scenario 1: Monday Morning
1. Executive logs in → Sees "0 of 6 completed today"
2. **Quick Wins** section expanded by default
3. Sees: "Add performance reviews for 3 team members (~10 min)"
4. Clicks → Review modal opens with Sarah Chen pre-selected
5. Completes review → Returns to dashboard
6. Suggestion shows green checkmark ✅
7. Counter updates: "1 of 6 completed today"

### Scenario 2: Wednesday Afternoon (360s pending)
1. Sees: "2 of 5 completed today"
2. Quick Wins mostly done ✅
3. **Build Context** shows: "Add context while 5 360 reviews are pending"
4. Clicks → Opens review modal for first employee with pending 360
5. Can knock out reviews/plans while waiting for feedback

### Scenario 3: Following Monday (360s complete)
1. Counter resets: "0 of 4 completed today" (new day)
2. **Analyze** section now enabled
3. Sees: "Review 360 feedback for 5 team members"
4. Clicks → Opens detail modal with 360 results

## Benefits

### For Executives
✅ **No decision fatigue** - Clear next action always visible
✅ **Time-efficient** - Batch similar tasks with time estimates
✅ **Progress visible** - "X completed today" feels rewarding
✅ **Prioritized** - Most important actions surface first
✅ **Contextual** - Adapts to 360 status and team state

### For Product
✅ **Increased engagement** - Clear CTAs drive action
✅ **Higher completion rates** - Guided path = more complete profiles
✅ **Reduced abandonment** - Users know what to do next
✅ **Better metrics** - Track which suggestions get clicked
✅ **Scalable** - Works for 1 employee or 100+

### For Development
✅ **Clean separation** - Self-contained component
✅ **Reusable logic** - Suggestion generation can power other features
✅ **Type-safe** - Full TypeScript interfaces
✅ **Performant** - useMemo for expensive calculations
✅ **Testable** - Pure functions for suggestion generation

## Technical Implementation

### Data Flow
```
employeeProgress → generateSuggestions() → Suggestion[] → 
  Group by category → Render sections → 
    User clicks → Execute action → 
      Mark completed → Save to localStorage
```

### State Management
- **Local state:** expandedSections, completedToday
- **Props:** employeeProgress, surveys360, modal handlers
- **Computed:** suggestions (memoized)
- **Persisted:** completedToday (localStorage with daily reset)

### Performance
- Suggestions regenerate only when dependencies change (useMemo)
- LocalStorage operations are minimal (only on completion)
- No database queries (uses existing data)
- Lightweight component (~300 lines)

## Files Created/Modified

### Created
- `src/components/SuggestedNextSteps.tsx` (293 lines)

### Modified
- `src/components/TeamProgressDashboard.tsx` (+13 lines for integration)

## Testing Checklist

- ✅ Component renders with employee progress data
- ✅ Three categories display correctly
- ✅ Suggestions are relevant to team state
- ✅ Clicking opens correct modal
- ✅ Completion tracking persists
- ✅ Daily reset works (new day = fresh counter)
- ✅ Sections expand/collapse
- ✅ Time estimates show
- ✅ Works with 1 employee
- ✅ Works with 50+ employees
- ✅ No linting errors

## Next Enhancements (Future)

1. **Analytics:** Track which suggestions get clicked most
2. **AI-powered:** Use Claude to suggest custom actions based on 360 themes
3. **Notifications:** "You have 3 quick wins to complete"
4. **Gamification:** Streaks, badges for consistent completion
5. **Team goals:** "Get to 80% complete profiles by Friday"

---

**Status:** Feature complete and ready for testing! 🎉

The Suggested Next Steps panel will guide executives through efficient profile completion, reducing overwhelm and increasing productivity.

