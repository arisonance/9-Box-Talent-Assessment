# Supabase Database Setup - 2 Minute Guide

Your Supabase project: **lppmuvmdexgczpueyjxk**

## Step 1: Open Supabase SQL Editor

Open this URL in your browser:
```
https://supabase.com/dashboard/project/lppmuvmdexgczpueyjxk/sql
```

## Step 2: Run Schema SQL (Create Tables)

1. Click **"New Query"** button
2. Copy the ENTIRE contents of `supabase-schema.sql`
3. Paste into the SQL editor
4. Click **"Run"** (or press Cmd/Ctrl + Enter)
5. You should see: "Success. No rows returned"

## Step 3: Run Seed SQL (Insert Test Data)

1. Click **"New Query"** button again
2. Copy the ENTIRE contents of `supabase-seed.sql`
3. Paste into the SQL editor
4. Click **"Run"** (or press Cmd/Ctrl + Enter)
5. You should see: "Success. No rows returned"

## Step 4: Verify Data Loaded

1. Go to Table Editor: https://supabase.com/dashboard/project/lppmuvmdexgczpueyjxk/editor
2. Click on "employees" table
3. You should see 15 employees (E001-E015)

## Step 5: Run the App Locally

Since the Claude Code web app environment doesn't support localhost URLs, you'll need to run this locally:

```bash
# On your local machine
cd /path/to/9-Box-Talent-Assessment
npm install
npm run dev
```

Then open http://localhost:3000/ in your browser.

---

## What the Database Contains

- **1 Organization**: "Test Organization"
- **5 Departments**: Engineering, Sales, Marketing, HR, Finance
- **15 Employees**:
  - 11 already positioned in the 9-box grid
  - 4 unassigned (for testing drag & drop)
- **9 Box Definitions**: Complete 9-box grid with Sonance Framework labels
- **360 Feedback Tables**: Ready for future features

## Features You Can Test

1. **Drag & Drop**: Move the 4 unassigned employees to any cell
2. **Cell Details**: Click any cell to see all employees in that category
3. **Data Persistence**: All changes save to database automatically
4. **Department Filtering**: Filter by department colors
5. **Employee Management**: Add, edit, delete employees

---

## Already Complete

Your `.env` file is already configured with:
```
VITE_SUPABASE_URL=https://lppmuvmdexgczpueyjxk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

All integration features from the previous session are complete:
- DataContext (centralized data management)
- Workflow Automation (7 intelligent triggers)
- Cross-Feature Insights
