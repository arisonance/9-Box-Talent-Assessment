# IMPORTANT: 9-Box Talent Assessment Setup Instructions

## 🎯 CURRENT MODE: DATABASE MODE (NO AUTH)

This project now uses a real Supabase database WITHOUT authentication for easy testing.

### Database Setup Required:

1. **Create Database Tables**: Run `supabase-schema.sql` in Supabase SQL Editor
2. **Seed Test Data**: Run `supabase-seed.sql` in Supabase SQL Editor  
3. **Start App**: `npm run dev` - Opens directly to dashboard

### How to Run:
```bash
# Kill any existing processes first
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start the dev server
npm run dev

# Server will start on http://localhost:3000/
# Open manually if browser doesn't auto-open: http://localhost:3000/
```
**Port: 3000** (configured in vite.config.ts) - **No login needed!**

### Database Features:
- ✅ **Real Supabase database** - data persists between sessions
- ✅ **15 test employees** - seeded automatically 
- ✅ **Drag & drop** - saves to database immediately
- ✅ **No authentication** - direct database access
- ✅ **Modal cell view** - click any cell to see detailed employee view

### Current Configuration:
- `src/App-database.tsx` - **CURRENT** (database mode, no auth)
- `src/main.tsx` - Points to App-database.tsx
- Fixed organization ID: `f8a8b8c8-d8e8-4f8f-8f8f-8f8f8f8f8f8f`

### Test Data Includes:
- **15 employees** across 5 departments (Engineering, Sales, Marketing, HR, Finance)
- **11 assessed employees** positioned in 9-box grid
- **4 unassigned employees** for drag & drop testing
- **9 box definitions** with colors and action hints

### SQL Files:
- `supabase-schema.sql` - Creates all tables with proper relationships
- `supabase-seed.sql` - Populates with test organization, departments, employees

### Database Tables:
- `organizations` - Test organization
- `departments` - 5 departments with colors
- `employees` - 15 test employees  
- `assessments` - Performance/potential ratings
- `box_definitions` - 9-box grid definitions

### Testing Drag & Drop:
1. Open app - loads directly to dashboard
2. See 11 employees already positioned in grid
3. See 4 unassigned employees on right sidebar
4. Drag unassigned employees to any cell
5. **Database saves automatically** - refresh to verify persistence
6. Click any cell to see modal with all employees in that cell

## Development Notes:
- No authentication barriers
- All CRUD operations work
- Data persists between browser sessions
- Row Level Security disabled for simplicity
- Fixed organization context

## Remember:
This setup provides real database functionality without authentication complexity. Perfect for testing all features with persistent data.

---

## ⚠️ CRITICAL: Code Quality & Import Rules

### NEVER Break These Rules:
1. **React imports ONLY from 'react'** - NEVER import `useState`, `useEffect`, `useMemo`, etc. from any other package (especially lucide-react, @supabase/supabase-js, etc.)
2. **File references must exist** - NEVER reference files that don't exist (e.g., App-database.tsx when it doesn't exist)
3. **Port must be 3000** - vite.config.ts must have `server: { port: 3000 }` configured
4. **Before making changes** - Always check imports are correct and files exist

### Before Starting Dev Server:
1. Verify `src/main.tsx` imports the correct App file that actually exists
2. Check all component files have correct imports (React from 'react', icons from 'lucide-react')
3. Kill all existing processes: `pkill -9 -f "vite" && pkill -9 -f "npm"`
4. Start fresh: `npm run dev`
5. Open http://localhost:3000/ in browser

### If App Won't Load:
1. **Blank white screen** = JavaScript error, check browser console
2. **Most common cause**: Missing React imports in component files
3. **Check for**: `React.ReactNode` without importing React
4. **Fix**: Import `{ ReactNode, MouseEvent }` from 'react' at the top
5. Hard refresh browser (Cmd+Shift+R) to clear cache

### Critical Import Rules (NEVER BREAK THESE):
```typescript
// ✅ ALWAYS DO THIS - Import React types from 'react'
import { ReactNode, MouseEvent, useState, useEffect, ComponentType } from 'react';

// ❌ NEVER DO THIS - Don't use React. without importing
interface Props {
  children: React.ReactNode;  // ❌ WRONG - React not imported
}

// ✅ CORRECT VERSION
import { ReactNode } from 'react';
interface Props {
  children: ReactNode;  // ✅ CORRECT
}

// ❌ NEVER import React hooks from other packages
import { useState } from '@supabase/supabase-js';  // ❌ WRONG

// ✅ ALWAYS import from 'react'
import { useState } from 'react';  // ✅ CORRECT

// ❌ CRITICAL: LucideIcon DOES NOT EXIST - This will break the entire app!
import { LucideIcon } from 'lucide-react';  // ❌ FATAL ERROR - Type doesn't exist!
interface Props {
  icon: LucideIcon;  // ❌ WRONG - Breaks app completely
}

// ✅ CORRECT VERSION - Use ComponentType from React
import { ComponentType } from 'react';
import { Users } from 'lucide-react';  // Import specific icons only
interface Props {
  icon: ComponentType<{ className?: string }>;  // ✅ CORRECT
}

// Example usage:
const MyComponent = ({ icon: Icon }: { icon: ComponentType<{ className?: string }> }) => {
  return <Icon className="w-4 h-4" />;
};
// Use: <MyComponent icon={Users} />
```

### 🚨 CRITICAL LUCIDE-REACT RULE:
**`LucideIcon` does NOT exist in lucide-react!** Using it will cause:
- "The requested module does not provide an export named 'LucideIcon'" error
- Complete app failure with blank white screen
- All pages broken until fixed

**How to Fix:**
1. Search entire codebase: `grep -r "LucideIcon" src/`
2. Replace ALL occurrences with `ComponentType<{ className?: string }>`
3. Add `import { ComponentType } from 'react';` to those files
4. Hard refresh browser (Cmd+Shift+R) to clear module cache