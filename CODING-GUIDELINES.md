# Coding Guidelines - 9-Box Talent Assessment

## Critical Rules to Prevent Runtime Errors

### 1. Function Declaration Order (React Hooks)

**❌ WRONG - Will cause "Cannot access before initialization" error:**
```typescript
// useMemo/useEffect using a function BEFORE it's defined
const suggestions = useMemo(() => {
  if (condition) {
    myFunction(); // ❌ ERROR - myFunction not defined yet
  }
}, [myFunction]); // ❌ ERROR - dependency on undefined function

// Function defined AFTER it's used
const myFunction = useCallback(() => {
  // ...
}, []);
```

**✅ CORRECT - Define functions BEFORE they're used:**
```typescript
// Define function FIRST
const myFunction = useCallback(() => {
  // ...
}, []);

// Use function in useMemo/useEffect AFTER it's defined
const suggestions = useMemo(() => {
  if (condition) {
    myFunction(); // ✅ CORRECT
  }
}, [myFunction]); // ✅ CORRECT
```

**Rule:** Always define `useCallback` functions BEFORE any `useMemo`, `useEffect`, or other hooks that reference them in dependency arrays or function bodies.

### 2. No Duplicate Function Declarations

**❌ WRONG - Will cause "already declared" error:**
```typescript
const openModal = useCallback(() => { }, []);

// ... 200 lines later ...

const openModal = useCallback(() => { }, []); // ❌ ERROR - duplicate
```

**✅ CORRECT - Each function declared once:**
```typescript
const openModal = useCallback(() => { }, []);

// Use it anywhere after this point
```

### 3. React Import Rules

**❌ CRITICAL - Never import React types from wrong packages:**
```typescript
import { useState } from 'lucide-react'; // ❌ FATAL ERROR
import { LucideIcon } from 'lucide-react'; // ❌ FATAL - Type doesn't exist!
```

**✅ CORRECT - Always import from 'react':**
```typescript
import { useState, useEffect, ComponentType } from 'react';
import { Users } from 'lucide-react'; // ✅ Import specific icons only

// For icon props, use ComponentType
interface Props {
  icon: ComponentType<{ className?: string }>;
}
```

### 4. Dev Server Issues

**If app won't load after code changes:**
1. Kill all processes: `lsof -ti:5173 | xargs kill -9`
2. Restart dev server: `npm run dev`
3. Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

**If Vite shows "already declared" error but code is correct:**
- Vite's cache can get stuck with old errors
- Solution: Kill the dev server and restart it completely

## React Hook Dependencies

**Always include functions in dependency arrays:**
```typescript
const myFunction = useCallback(() => { }, []);

// ✅ Include myFunction in dependencies
useEffect(() => {
  myFunction();
}, [myFunction]); // ✅ CORRECT
```

## File Organization

### Component Structure Order:
1. Imports
2. Type/Interface definitions
3. Constants
4. Main component function
   - State declarations (useState)
   - Callback functions (useCallback) - Define EARLY
   - Memos (useMemo) - Use callbacks defined above
   - Effects (useEffect) - Use callbacks/memos defined above
   - Helper functions
   - Render logic

## Common Error Patterns

### Error: "Cannot access 'X' before initialization"
**Cause:** Function used in useMemo/useEffect before it's defined
**Fix:** Move function definition BEFORE the useMemo/useEffect

### Error: "Identifier 'X' has already been declared"
**Cause:** Function defined twice in same scope
**Fix:** Search file for duplicate declarations, keep only one

### Error: "Module does not provide export named 'LucideIcon'"
**Cause:** Trying to import a type that doesn't exist
**Fix:** Use `ComponentType<{ className?: string }>` from 'react' instead

## Before Committing Code

✅ Checklist:
- [ ] All React imports from 'react' (not from other packages)
- [ ] No LucideIcon type usage (use ComponentType instead)
- [ ] Functions defined before they're used in hooks
- [ ] No duplicate function declarations
- [ ] Dev server runs without errors
- [ ] Browser shows no console errors

## Port Configuration

- **Default:** Port 5173 (configured in vite.config.ts)
- **Fallback:** Vite auto-increments if port is in use (5174, 5175, etc.)
- **Note:** CLAUDE.md mentions port 3000, but vite.config.ts uses 5173
