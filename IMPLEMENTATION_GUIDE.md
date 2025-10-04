# 🎯 9-Box Talent Assessment with AI-Powered Review Parser & Development Plans
## Complete Implementation Guide

This is a comprehensive guide to recreate the full 9-Box Talent Assessment system with AI-powered performance review parsing and automated development plan generation.

---

## 📋 **TABLE OF CONTENTS**

1. [Overview & Features](#overview--features)
2. [Tech Stack](#tech-stack)
3. [Database Schema](#database-schema)
4. [Core Type Definitions](#core-type-definitions)
5. [Component Architecture](#component-architecture)
6. [AI Review Parser Implementation](#ai-review-parser-implementation)
7. [Development Plans System](#development-plans-system)
8. [9-Box Grid with Drag & Drop](#9-box-grid-with-drag--drop)
9. [Step-by-Step Implementation](#step-by-step-implementation)
10. [Key Features & User Flow](#key-features--user-flow)
11. [Environment Variables](#environment-variables)

---

## 🎯 **OVERVIEW & FEATURES**

### **What This System Does:**

This is a complete talent management application that allows HR teams and managers to:

1. **Assess employees** on a 9-box grid (Performance vs Potential matrix)
2. **AI-powered performance review parsing** - paste any review text and get:
   - Automatic extraction of employee info (name, title, department, email)
   - Smart 9-box placement suggestion (performance & potential ratings)
   - Auto-generated development plans with objectives, action items, and success metrics
   - Company-specific insights (currently tailored for "Sonance" - a premium audio company)
3. **Create & track development plans** for each employee
4. **Visual drag-and-drop interface** for easy talent assessment
5. **Department-based filtering and analytics**
6. **CSV import/export** for bulk employee management
7. **Plan progress tracking** with completion metrics

### **Core Innovation:**
The AI Review Parser is the standout feature - it transforms unstructured performance review text into structured data and actionable plans using Claude AI.

---

## 🛠 **TECH STACK**

### **Frontend:**
- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS 4** for styling
- **@dnd-kit** for drag-and-drop functionality
- **lucide-react** for icons
- **papaparse** for CSV parsing
- **html2canvas** for visual exports

### **Backend:**
- **Supabase** (PostgreSQL + Realtime + Auth)
- **Anthropic Claude AI** (via @anthropic-ai/sdk)

### **Key Libraries:**
```json
{
  "@anthropic-ai/sdk": "^0.65.0",
  "@dnd-kit/core": "^6.3.1",
  "@supabase/supabase-js": "^2.54.0",
  "papaparse": "^5.5.3",
  "react": "^19.1.1",
  "tailwind-merge": "^3.3.1"
}
```

---

## 🗄️ **DATABASE SCHEMA**

Create these tables in your Supabase project:

```sql
-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Departments table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees table
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  employee_id TEXT,
  name TEXT NOT NULL,
  email TEXT,
  title TEXT,
  manager_name TEXT,
  location TEXT,
  hire_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, employee_id)
);

-- Assessments table (9-box placement)
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  performance TEXT CHECK (performance IN ('low', 'medium', 'high')),
  potential TEXT CHECK (potential IN ('low', 'medium', 'high')),
  box_key TEXT,
  assessed_by UUID,
  assessed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id)
);

-- Box Definitions (the 9 cells of the grid)
CREATE TABLE box_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL,
  grid_x INTEGER NOT NULL CHECK (grid_x >= 0 AND grid_x <= 2),
  grid_y INTEGER NOT NULL CHECK (grid_y >= 0 AND grid_y <= 2),
  action_hint TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, key),
  UNIQUE(organization_id, grid_x, grid_y)
);

-- Development Plans table
CREATE TABLE development_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_type TEXT CHECK (plan_type IN ('development', 'performance_improvement', 'retention', 'succession')),
  title TEXT NOT NULL,
  objectives JSONB DEFAULT '[]',
  action_items JSONB DEFAULT '[]',
  timeline TEXT,
  success_metrics JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_employees_org ON employees(organization_id);
CREATE INDEX idx_employees_dept ON employees(department_id);
CREATE INDEX idx_assessments_employee ON assessments(employee_id);
CREATE INDEX idx_assessments_org ON assessments(organization_id);
CREATE INDEX idx_plans_employee ON development_plans(employee_id);
```

### **Seed the 9-Box Definitions:**

```sql
-- Insert box definitions for the 9-box grid
INSERT INTO box_definitions (organization_id, key, label, description, color, grid_x, grid_y, action_hint)
VALUES
  -- Top row (High Potential)
  ('YOUR_ORG_ID', 'low-high', 'Rising Talent', 'High potential but developing performance', '#FEF3C7', 0, 2, 'Coach & develop urgently'),
  ('YOUR_ORG_ID', 'medium-high', 'Emerging Leader', 'Strong potential, solid performance', '#DBEAFE', 1, 2, 'Challenge with stretch assignments'),
  ('YOUR_ORG_ID', 'high-high', 'Star / Top Talent', 'High performers with high potential', '#D1FAE5', 2, 2, 'Retain, reward, succession plan'),

  -- Middle row (Medium Potential)
  ('YOUR_ORG_ID', 'low-medium', 'Core Foundation', 'Steady but limited growth potential', '#FED7AA', 0, 1, 'Support & recognize contributions'),
  ('YOUR_ORG_ID', 'medium-medium', 'Steady Contributor', 'Reliable performers, stable growth', '#E0E7FF', 1, 1, 'Maintain engagement'),
  ('YOUR_ORG_ID', 'high-medium', 'Performance Leader', 'Strong performers, steady trajectory', '#BBF7D0', 2, 1, 'Leverage expertise, mentor others'),

  -- Bottom row (Low Potential)
  ('YOUR_ORG_ID', 'low-low', 'Realign & Redirect', 'Performance and growth concerns', '#FEE2E2', 0, 0, 'Performance improvement plan'),
  ('YOUR_ORG_ID', 'medium-low', 'Evaluate Further', 'Adequate performance, limited potential', '#FDE68A', 1, 0, 'Monitor & provide clarity'),
  ('YOUR_ORG_ID', 'high-low', 'Master Craftsperson', 'High performers at peak, limited upward mobility', '#BFDBFE', 2, 0, 'Retain as subject matter expert');
```

---

## �� **CORE TYPE DEFINITIONS**

Create `src/types/index.ts`:

```typescript
// Performance and Potential levels
export type Performance = 'low' | 'medium' | 'high';
export type Potential = 'low' | 'medium' | 'high';
export type PlanType = 'development' | 'performance_improvement' | 'retention' | 'succession';
export type UserRole = 'admin' | 'manager' | 'viewer';

// Database entities
export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  organization_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  organization_id: string;
  department_id?: string;
  employee_id?: string;
  name: string;
  email?: string;
  title?: string;
  manager_name?: string;
  location?: string;
  hire_date?: string;
  created_at: string;
  updated_at: string;

  // Joined data
  department?: Department;
  assessment?: Assessment;
}

export interface Assessment {
  id: string;
  employee_id: string;
  organization_id: string;
  performance: Performance;
  potential: Potential;
  box_key: string;
  assessed_by?: string;
  assessed_at: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BoxDefinition {
  id: string;
  organization_id: string;
  key: string;
  label: string;
  description: string;
  color: string;
  grid_x: number;
  grid_y: number;
  action_hint?: string;
  created_at: string;
  updated_at: string;
}

export interface DevelopmentPlan {
  id: string;
  employee_id: string;
  organization_id: string;
  plan_type: PlanType;
  title: string;
  objectives: string[];
  action_items: ActionItem[];
  timeline: string;
  success_metrics: string[];
  status: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ActionItem {
  id: string;
  description: string;
  dueDate?: string;
  completed: boolean;
  owner?: string;
  priority?: 'high' | 'medium' | 'low';
}

// CSV Import types
export interface ImportMapping {
  sourceColumn: string;
  targetField: keyof Employee | 'performance' | 'potential';
}

export interface ImportPreview {
  valid: Partial<Employee>[];
  invalid: { row: Record<string, string>; errors: string[] }[];
  duplicates: Employee[];
}
```

---

## 🏗️ **COMPONENT ARCHITECTURE**

### **Main Components:**

1. **ReviewParserModal** - AI-powered review parser (STAR FEATURE)
2. **EmployeePlanModal** - Create/edit development plans
3. **PlansOverview** - View and filter all plans
4. **NineBoxGrid** - Main drag-and-drop grid interface
5. **ImportModal** - CSV import with validation
6. **Dashboard** - Main container

### **File Structure:**
```
src/
├── components/
│   ├── ReviewParserModal.tsx       # AI review parser
│   ├── EmployeePlanModal.tsx       # Plan creation/editing
│   ├── PlansOverview.tsx           # Plan dashboard
│   ├── NineBoxGrid.tsx             # Main grid
│   ├── BoxCell.tsx                 # Individual grid cell
│   ├── EmployeeCard.tsx            # Employee card component
│   ├── ImportModal.tsx             # CSV import
│   ├── Dashboard.tsx               # Main dashboard
│   └── ...
├── lib/
│   ├── anthropicService.ts         # Claude AI integration
│   ├── reviewParser.ts             # Pattern-matching fallback
│   ├── supabase.ts                 # Supabase client
│   └── utils.ts                    # Utility functions
├── types/
│   └── index.ts                    # TypeScript types
└── App.tsx
```

---

## 🤖 **AI REVIEW PARSER IMPLEMENTATION**

This is the most innovative feature. It uses Claude AI to parse unstructured performance reviews.

### **Step 1: Anthropic Service (`lib/anthropicService.ts`)**

```typescript
import Anthropic from '@anthropic-ai/sdk';

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
let anthropic: Anthropic | null = null;

// Initialize with API key
if (apiKey) {
  anthropic = new Anthropic({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // For client-side usage
  });
}

export function initializeAnthropic(key?: string) {
  const keyToUse = key || apiKey;
  if (keyToUse) {
    anthropic = new Anthropic({
      apiKey: keyToUse,
      dangerouslyAllowBrowser: true
    });
  }
  return !!anthropic;
}

export interface AIAnalysisResult {
  employeeName: string;
  title: string;
  department: string;
  email: string;

  suggestedPerformance: 'low' | 'medium' | 'high';
  suggestedPotential: 'low' | 'medium' | 'high';
  confidence: number;

  reasoning: string;
  keyStrengths: string[];
  developmentAreas: string[];
  achievements: string[];

  objectives: string[];
  actionItems: Array<{
    description: string;
    dueDate: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  successMetrics: string[];

  sonanceSpecificInsights: string[]; // Replace with your company name
  recommendedTimeline: string;
}

export async function analyzeReviewWithAI(reviewText: string): Promise<AIAnalysisResult> {
  if (!anthropic) {
    throw new Error('Anthropic API not initialized. Please provide an API key.');
  }

  // CUSTOMIZE THIS PROMPT FOR YOUR COMPANY!
  const prompt = `You are an expert HR analyst at Sonance, a premium audio company. Analyze this performance review and provide a comprehensive, structured assessment.

PERFORMANCE REVIEW:
${reviewText}

Please analyze this review and provide a JSON response with the following structure:

{
  "employeeName": "extracted full name",
  "title": "job title",
  "department": "department name",
  "email": "email if mentioned",

  "suggestedPerformance": "low/medium/high - based on results, goal achievement, quality of work",
  "suggestedPotential": "low/medium/high - based on learning agility, leadership qualities, growth mindset, adaptability",
  "confidence": 85,
  "reasoning": "2-3 sentences explaining the performance and potential assessment",

  "keyStrengths": ["3-5 specific strengths mentioned in the review"],
  "developmentAreas": ["3-5 specific areas for improvement"],
  "achievements": ["3-5 key accomplishments"],

  "objectives": ["5-7 SMART objectives tailored to this person's role at Sonance and their development areas"],
  "actionItems": [
    {
      "description": "Specific action based on review content",
      "dueDate": "30 days/60 days/90 days",
      "priority": "high/medium/low"
    }
  ],
  "successMetrics": ["5-7 measurable outcomes specific to this employee's goals at Sonance"],

  "sonanceSpecificInsights": ["3-4 insights about how this person can contribute to Sonance's mission of premium audio excellence, innovation, or customer experience"],
  "recommendedTimeline": "30 days/60 days/90 days/6 months/12 months"
}

IMPORTANT GUIDELINES:
1. Make objectives and action items SPECIFIC to what was mentioned in the review
2. Reference actual projects, skills, or situations from the review
3. For Sonance-specific insights, relate to: premium audio quality, customer experience, innovation, technical excellence, or brand values
4. Be realistic and actionable - avoid generic advice
5. Confidence score should reflect how clear the performance indicators are (60-95%)
6. Performance ratings: low = below expectations, medium = meets expectations, high = exceeds expectations
7. Potential ratings: low = limited growth, medium = steady growth, high = high growth/leadership potential
8. Return ONLY valid JSON, no other text`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = message.content[0];
    if (content.type === 'text') {
      let jsonText = content.text.trim();

      // Remove markdown code blocks if present
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }

      const result = JSON.parse(jsonText);

      return {
        employeeName: result.employeeName || 'Unknown Employee',
        title: result.title || '',
        department: result.department || '',
        email: result.email || '',
        suggestedPerformance: result.suggestedPerformance || 'medium',
        suggestedPotential: result.suggestedPotential || 'medium',
        confidence: result.confidence || 70,
        reasoning: result.reasoning || '',
        keyStrengths: result.keyStrengths || [],
        developmentAreas: result.developmentAreas || [],
        achievements: result.achievements || [],
        objectives: result.objectives || [],
        actionItems: result.actionItems || [],
        successMetrics: result.successMetrics || [],
        sonanceSpecificInsights: result.sonanceSpecificInsights || [],
        recommendedTimeline: result.recommendedTimeline || '90 days'
      };
    }

    throw new Error('Unexpected response format from Claude');
  } catch (error: any) {
    console.error('Error analyzing review with AI:', error);
    throw new Error(`AI Analysis failed: ${error.message}`);
  }
}

export function isAnthropicConfigured(): boolean {
  return !!anthropic || !!apiKey;
}
```

### **Step 2: Fallback Pattern Matcher (`lib/reviewParser.ts`)**

This provides a non-AI fallback using regex pattern matching. Create a comprehensive pattern matcher that looks for keywords like "exceeded expectations", "high potential", "leadership qualities", etc. (See the full file in your codebase for the complete implementation - it's about 465 lines of sophisticated pattern matching logic.)

### **Step 3: ReviewParserModal Component**

The modal has two steps:
1. **Input step**: Paste review text, shows AI status, allows API key entry
2. **Review step**: Shows extracted data with editable fields for employee info, 9-box placement, and development plan

**Key Features:**
- ✨ AI-powered analysis with Claude (optional, falls back to pattern matching)
- 🎨 Beautiful gradient UI with proper visual hierarchy
- ✏️ Fully editable output - user can adjust all suggested data
- 📋 Inline editing of objectives, action items, and success metrics
- 🎯 Visual 9-box placement preview
- 💡 Company-specific insights section (when using AI)
- 🔑 In-modal API key configuration

**User Flow:**
1. User clicks "Parse Performance Review" button
2. Pastes review text (100+ chars required)
3. System analyzes with AI or pattern matching
4. User reviews extracted data:
   - Employee name, title, department, email
   - Suggested performance/potential ratings
   - Key strengths & development areas
   - Pre-generated development plan with objectives, actions, metrics
5. User edits any field as needed
6. Clicks "Create Employee & Generate Plan"
7. Employee is created, placed on 9-box grid, and plan is saved

---

## 📋 **DEVELOPMENT PLANS SYSTEM**

### **Plan Types:**
- **Development**: For high-potential employees
- **Performance Improvement**: For low performers
- **Retention**: For high performers with low potential
- **Succession**: For stars being prepared for promotion

### **Plan Structure:**
```typescript
{
  plan_type: 'development',
  title: 'Sarah Johnson's Development Plan',
  objectives: [
    'Develop leadership skills through mentoring',
    'Expand technical expertise in cloud architecture'
  ],
  action_items: [
    {
      id: 'action-1',
      description: 'Complete AWS Solutions Architect certification',
      dueDate: '90 days',
      completed: false,
      owner: 'Sarah Johnson',
      priority: 'high'
    }
  ],
  timeline: '90 days',
  success_metrics: [
    'Certification achieved',
    'Positive 360-degree feedback',
    'Successfully mentored 2 junior developers'
  ],
  notes: 'AI-generated plan based on performance review'
}
```

### **EmployeePlanModal Component:**

**Features:**
- Auto-generates plan templates based on 9-box position
- Fully editable objectives, action items, success metrics
- Progress tracking (% of action items completed)
- Timeline selection (30/60/90 days, 6/12 months)
- Priority levels for action items
- Due dates for individual actions
- Persistent storage in database
- Beautiful gradient UI matching the 9-box cell color

**Auto-generation Logic:**
```typescript
const generatePlanTemplate = (performance, potential) => {
  if (performance === 'low') {
    return {
      plan_type: 'performance_improvement',
      objectives: ['Address performance gaps', 'Meet baseline standards'],
      timeline: '60 days'
    };
  }

  if (potential === 'high') {
    return {
      plan_type: 'development',
      objectives: ['Develop leadership skills', 'Expand strategic thinking'],
      timeline: '90 days'
    };
  }

  // ... more logic
};
```

### **PlansOverview Component:**

**Features:**
- Statistics dashboard (total plans, in-progress, completed, etc.)
- Filter by status: Not Started, In Progress, Complete
- Filter by type: Development, Performance Improvement, Retention, Succession
- Plan coverage percentage
- Visual cards showing plan progress
- Quick access to employees needing plans
- Color-coded by plan type

---

## 🎯 **9-BOX GRID WITH DRAG & DROP**

### **Grid Layout:**
```
         POTENTIAL →
       Low   Medium   High
    ┌──────┬────────┬────────┐
    │      │ Emerging│  Star  │ High
P   │Rising│ Leader  │        │
E   ├──────┼────────┼────────┤
R   │Core  │ Steady │Perf    │ Med
F   │Found.│ Contrib│Leader  │
O   ├──────┼────────┼────────┤
R   │Align │Evaluate│Master  │ Low
M   │&Redir│ Further│Craftspr│
    └──────┴────────┴────────┘
```

### **Drag & Drop Features:**
- **@dnd-kit** for smooth drag interactions
- Drag employees from "Unassigned" list to any cell
- Drag between cells to reassess
- Visual feedback during drag
- Automatic assessment creation/update in database
- Works with multiple employees in same cell
- Click cell to see all employees in modal view
- Hover over employee cards to see action buttons (edit, plan, details)

### **Implementation:**

```typescript
import { DndContext, DragOverlay, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';

const handleDragEnd = async (event) => {
  const { active, over } = event;
  const employee = active.data.current?.employee;
  const targetBox = over.data.current?.boxDefinition;

  // Extract performance/potential from grid position
  const [performance, potential] = getPerformancePotentialFromPosition(
    targetBox.grid_x,
    targetBox.grid_y
  );

  // Update assessment in database
  await supabase
    .from('assessments')
    .upsert({
      employee_id: employee.id,
      performance,
      potential,
      box_key: targetBox.key
    });
};
```

### **BoxCell Component:**

Each cell displays:
- Color-coded background (from box_definition)
- Label and description
- Action hint (e.g., "Retain & reward")
- Employee cards (stacked if multiple)
- Employee count badge
- Department color dots
- Click to expand in modal

### **Utility Functions:**

```typescript
// Get performance/potential from grid coordinates
export function getPerformancePotentialFromPosition(x: number, y: number): [Performance, Potential] {
  const performance: Performance = x === 0 ? 'low' : x === 1 ? 'medium' : 'high';
  const potential: Potential = y === 0 ? 'low' : y === 1 ? 'medium' : 'high';
  return [performance, potential];
}

// Get box key from performance/potential
export function getBoxKey(performance: Performance, potential: Potential): string {
  return `${performance}-${potential}`;
}
```

---

## 🔨 **STEP-BY-STEP IMPLEMENTATION**

### **Phase 1: Setup (30 minutes)**

1. **Create new React + TypeScript project:**
```bash
npm create vite@latest my-talent-app -- --template react-ts
cd my-talent-app
npm install
```

2. **Install dependencies:**
```bash
npm install @supabase/supabase-js @anthropic-ai/sdk @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities papaparse lucide-react clsx tailwind-merge html2canvas
npm install -D @types/papaparse tailwindcss postcss autoprefixer
```

3. **Setup Tailwind CSS:**
```bash
npx tailwindcss init -p
```

Configure `tailwind.config.js`:
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

4. **Create Supabase project:**
   - Go to supabase.com
   - Create new project
   - Get your API URL and anon key
   - Run the database schema SQL (from earlier)

5. **Setup environment variables:**
Create `.env.local`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_ANTHROPIC_API_KEY=your_anthropic_key (optional)
```

6. **Create Supabase client (`src/lib/supabase.ts`):**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### **Phase 2: Core Types & Utils (20 minutes)**

1. Create `src/types/index.ts` (see Core Type Definitions section above)
2. Create `src/lib/utils.ts` with utility functions for box calculations
3. Create `src/lib/anthropicService.ts` (see AI section above)
4. Create `src/lib/reviewParser.ts` (fallback pattern matcher)

### **Phase 3: Basic Components (1 hour)**

1. **Create EmployeeCard.tsx:**
   - Display employee name, title, department
   - Show department color dot
   - Show plan status badge
   - Draggable with @dnd-kit
   - Action buttons (edit, plan, delete)

2. **Create BoxCell.tsx:**
   - Droppable target with @dnd-kit
   - Display box definition (label, color, description)
   - Stack employee cards
   - Click to open modal

3. **Create UnassignedEmployees.tsx:**
   - Horizontal scroll list of unassigned employees
   - Draggable cards
   - "Add Employee" button

### **Phase 4: Main Grid (1.5 hours)**

1. **Create NineBoxGrid.tsx:**
   - Setup DndContext
   - 3x3 grid layout with axis labels
   - Drag handlers (start, end)
   - Database updates on drop
   - Statistics display (total, assessed, unassigned)
   - Department distribution view
   - Export functionality

2. **Create CellDetailModal.tsx:**
   - Modal view for single cell
   - List all employees in cell
   - Navigation between cells (prev/next)
   - Quick actions (create plan, reassess)

### **Phase 5: AI Review Parser (2 hours)**

1. **Create ReviewParserModal.tsx:**
   - Two-step interface (input → review)
   - API key configuration UI
   - Textarea for review input (12 rows)
   - Character/word count display
   - "Analyzing..." loading state
   - Editable employee info fields
   - 9-box placement dropdowns
   - Editable plan sections:
     - Objectives (add/remove/edit)
     - Action items with priority & due date
     - Success metrics
   - Timeline selector
   - Confidence score display
   - AI-specific insights section
   - Beautiful gradient purple/indigo theme

2. **Integration:**
   - Add "Parse Performance Review" button to Dashboard
   - Wire up to employee creation
   - Automatically place employee on grid
   - Save generated plan

### **Phase 6: Development Plans (2 hours)**

1. **Create EmployeePlanModal.tsx:**
   - Full-screen modal
   - Employee header with 9-box position badge
   - Plan type selector
   - Timeline selector
   - Objectives section (add/edit/remove)
   - Action items section with checkboxes
   - Success metrics section
   - Progress bar (% complete)
   - Notes/reasoning field
   - Save to database
   - Auto-generation based on 9-box position

2. **Create PlansOverview.tsx:**
   - Statistics cards (total, complete, in-progress, need plans)
   - Filter controls (status + type)
   - Grid of employee cards with plan progress
   - "Employees Without Plans" section
   - Click card to open plan modal

3. **Integration:**
   - Add "Plans" view to Dashboard
   - Hook up plan CRUD operations
   - Pass plans data to NineBoxGrid for badges

### **Phase 7: Import/Export (1 hour)**

1. **Create ImportModal.tsx:**
   - File upload (CSV only)
   - Column mapping interface
   - Preview with validation
   - Error display
   - Batch import with progress
   - Download template CSV

2. **Create export utilities (`lib/export.ts`):**
   - CSV export (employee data + assessments)
   - HTML report export
   - PNG screenshot export (html2canvas)

### **Phase 8: Dashboard & Navigation (1 hour)**

1. **Create Dashboard.tsx:**
   - View switcher (Grid, Employees, Departments, Import, Plans)
   - Department selector
   - "Parse Performance Review" button
   - Load employees + assessments from database
   - Pass data to child components
   - Handle plan updates

2. **Create DepartmentManager.tsx:**
   - List departments
   - Add/edit/delete departments
   - Color picker for each department
   - Employee count per department

### **Phase 9: Polish & Testing (1 hour)**

1. **Styling:**
   - Consistent color scheme
   - Smooth transitions
   - Responsive layout
   - Loading states
   - Error messages

2. **Testing:**
   - Test drag & drop
   - Test CSV import
   - Test AI parser with various review formats
   - Test plan creation & editing
   - Test filters and navigation

---

## 🎨 **KEY FEATURES & USER FLOW**

### **User Flow 1: AI-Powered Review Parsing**

```
1. User clicks "Parse Performance Review" button
   └→ ReviewParserModal opens

2. User pastes review text (e.g., from Word doc, email)
   └→ System validates (100+ chars required)
   └→ Shows character/word count

3. User clicks "Analyze Review"
   └→ If API key not configured: prompt for key
   └→ System sends to Claude AI
   └→ Shows "Analyzing..." spinner

4. AI returns structured data:
   ├→ Employee info (name, title, dept, email)
   ├→ Performance/potential assessment
   ├→ Key strengths & development areas
   ├→ Company-specific insights
   └→ Complete development plan

5. User reviews & edits:
   ├→ Adjusts 9-box placement if needed
   ├→ Edits objectives, actions, metrics
   ├→ Changes timeline
   └→ Customizes any field

6. User clicks "Create Employee & Generate Plan"
   └→ Employee created in database
   └→ Placed on 9-box grid
   └→ Development plan saved
   └→ Modal closes → employee visible on grid
```

### **User Flow 2: Manual Assessment**

```
1. User imports employees via CSV or adds manually
   └→ Employees appear in "Unassigned" list

2. User drags employee card to a grid cell
   └→ Visual drag overlay appears
   └→ Drop zones highlight

3. User drops in target cell
   └→ Assessment created in database
   └→ Employee appears in cell
   └→ Card shows department color

4. User hovers over employee card
   └→ Action buttons appear: ✏️ Edit | 📋 Plan | 🗑️ Delete

5. User clicks "📋 Plan" button
   └→ EmployeePlanModal opens
   └→ Shows auto-generated plan template based on cell
   └→ User customizes objectives & actions
   └→ Saves plan

6. Plan badge appears on employee card
   └→ Shows progress (e.g., "3/7 complete")
```

### **User Flow 3: Plan Management**

```
1. User switches to "Plans" view
   └→ PlansOverview displays with statistics

2. User sees overview:
   ├→ Total plans: 24
   ├→ Complete: 8
   ├→ In progress: 12
   └→ Need plans: 4 employees

3. User filters plans:
   ├→ By status: Not Started / In Progress / Complete
   └→ By type: Development / Performance Improvement / etc.

4. User clicks employee card
   └→ Plan modal opens
   └→ User checks off completed action items
   └→ Progress bar updates
   └→ Saves changes

5. When all actions complete:
   └→ Plan marked as "Complete"
   └→ Employee badge shows "✓ Complete"
```

---

## 🌟 **CUSTOMIZATION FOR YOUR COMPANY**

### **Replace "Sonance" with Your Company:**

1. **In `anthropicService.ts`:**
   - Change prompt references from "Sonance" to your company name
   - Update company-specific insights prompt to reflect your values
   - Example: "Sonance's mission of premium audio excellence" → "Acme's mission of sustainable innovation"

2. **In `ReviewParserModal.tsx`:**
   - Update labels like "Sonance-Specific Insights"
   - Change to "Acme-Specific Insights"

3. **Company Values/Focus:**
   - Update the AI prompt to reflect what matters to your company
   - Examples:
     - Tech company: "technical excellence, scalability, user experience"
     - Retail: "customer service, sales performance, merchandising"
     - Healthcare: "patient outcomes, compliance, clinical quality"

### **Customizing Box Definitions:**

You can change the 9-box labels and colors in the database:

```sql
UPDATE box_definitions
SET label = 'Future Leader',
    description = 'High potential with developing skills',
    color = '#DBEAFE',
    action_hint = 'Invest in leadership training'
WHERE key = 'medium-high';
```

### **Adding Custom Fields:**

To track additional employee data:

1. Add column to database:
```sql
ALTER TABLE employees ADD COLUMN years_of_service INTEGER;
```

2. Update TypeScript type:
```typescript
export interface Employee {
  // ... existing fields
  years_of_service?: number;
}
```

3. Update components to display/edit the field

---

## 🔐 **ENVIRONMENT VARIABLES**

Create `.env.local`:

```bash
# Supabase (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Anthropic AI (Optional - can configure in-app)
VITE_ANTHROPIC_API_KEY=sk-ant-...

# Optional: Environment indicator
VITE_APP_ENV=development
```

---

## 📊 **DATABASE BEST PRACTICES**

### **Indexes:**
```sql
-- Already included in schema above
CREATE INDEX idx_employees_org ON employees(organization_id);
CREATE INDEX idx_assessments_employee ON assessments(employee_id);
CREATE INDEX idx_plans_employee ON development_plans(employee_id);
```

### **Row Level Security (RLS):**

If you want multi-tenant security:

```sql
-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE development_plans ENABLE ROW LEVEL SECURITY;

-- Create policies (example)
CREATE POLICY "Users can view employees in their org"
  ON employees FOR SELECT
  USING (organization_id = current_setting('app.current_org_id')::uuid);

-- Repeat for other tables
```

### **Triggers for updated_at:**

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Repeat for other tables
```

---

## 🚀 **DEPLOYMENT**

### **Build for Production:**

```bash
npm run build
```

### **Deploy to Vercel:**

```bash
npm install -g vercel
vercel --prod
```

### **Deploy to Netlify:**

```bash
npm install -g netlify-cli
netlify deploy --prod
```

### **Environment Variables in Production:**

Add the same env variables to your hosting platform's settings:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ANTHROPIC_API_KEY` (optional)

---

## 🎯 **FINAL NOTES**

### **What Makes This Special:**

1. **AI-Powered Parsing**: Transforms unstructured text → structured data + actionable plans
2. **Complete Workflow**: From review parsing → assessment → plan creation → tracking
3. **Visual & Interactive**: Drag-and-drop makes talent assessment intuitive
4. **Flexible**: Works with AI or without (pattern matching fallback)
5. **Customizable**: Easy to adapt prompts and labels for any company/industry

### **Key Metrics to Track:**

- **Assessment Coverage**: % of employees assessed
- **Plan Coverage**: % of assessed employees with plans
- **Plan Completion**: % of action items marked complete
- **Department Distribution**: Balance across departments
- **9-Box Distribution**: Are you top-heavy or bottom-heavy?

### **Future Enhancements:**

- [ ] Historical tracking (assessment changes over time)
- [ ] Manager self-service (managers can assess their own teams)
- [ ] Email reminders for plan milestones
- [ ] Integration with HR systems (BambooHR, Workday, etc.)
- [ ] Bulk assessment imports
- [ ] Succession planning workflows
- [ ] Anonymous 360-degree feedback
- [ ] Skills matrix integration
- [ ] Career path visualization

---

## 📚 **ADDITIONAL RESOURCES**

- **@dnd-kit docs**: https://docs.dndkit.com/
- **Supabase docs**: https://supabase.com/docs
- **Anthropic API docs**: https://docs.anthropic.com/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Lucide Icons**: https://lucide.dev/

---

## ✅ **IMPLEMENTATION CHECKLIST**

Use this to track your progress:

- [ ] Phase 1: Setup project, install dependencies, configure Supabase
- [ ] Phase 2: Create type definitions and utility functions
- [ ] Phase 3: Build basic components (EmployeeCard, BoxCell, UnassignedEmployees)
- [ ] Phase 4: Implement 9-box grid with drag & drop
- [ ] Phase 5: Create AI review parser modal
- [ ] Phase 6: Build development plans system
- [ ] Phase 7: Add import/export functionality
- [ ] Phase 8: Create dashboard and navigation
- [ ] Phase 9: Polish styling and test all features
- [ ] Customize for your company (replace Sonance references)
- [ ] Deploy to production
- [ ] Train users on the system

---

**Total Implementation Time: ~10-12 hours for experienced developer**

---

Good luck building your 9-Box Talent Assessment system! This is a comprehensive guide that should give you everything you need to recreate the full functionality. The AI review parser is the killer feature that will save HR teams countless hours of manual data entry.
