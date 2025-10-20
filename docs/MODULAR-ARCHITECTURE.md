# Modular Architecture Guide

## Overview

The Sonance Talent Management platform is built with a modular architecture that allows you to easily enable/disable features without touching database configurations. All features are organized into logical modules that can be toggled via simple configuration files.

## Architecture

### 1. Module Configuration (`src/config/modules.ts`)

Central registry of all platform features. Each module has:
- **Key**: Unique identifier (e.g., `'nine_box'`, `'360_feedback'`)
- **Name**: Display name
- **Description**: What the module does
- **Enabled**: Boolean flag to enable/disable
- **Category**: Logical grouping (core, assessment, development, etc.)
- **Dependencies**: Optional array of required modules
- **Beta**: Optional flag to mark as beta

### 2. Hooks (`src/hooks/useModule.ts`)

Simple React hooks to check module status:
- `useModule(key)` - Returns boolean if module is enabled
- `useModuleConfig(key)` - Returns full module configuration
- `useModules([keys])` - Check multiple modules at once

### 3. Component Integration

Components use hooks to conditionally render based on module status.

## How to Use

### Enable/Disable Features

Edit `src/config/modules.ts` and change the `enabled` flag:

```typescript
export const MODULES: Record<ModuleKey, ModuleConfig> = {
  '360_feedback': {
    key: '360_feedback',
    name: '360 Feedback',
    description: 'Multi-rater feedback surveys',
    enabled: true,  // ← Change to false to disable
    category: 'assessment',
  },
  
  // ... other modules
};
```

### Use in Components

**Simple conditional rendering:**

```typescript
import { useModule } from '../hooks/useModule';

function Feedback360Dashboard() {
  const isEnabled = useModule('360_feedback');
  
  // Feature automatically hides when disabled
  if (!isEnabled) return null;
  
  return (
    <div>
      {/* Your 360 feedback UI */}
    </div>
  );
}
```

**Check multiple modules:**

```typescript
import { useModules } from '../hooks/useModule';

function DevelopmentDashboard() {
  const modules = useModules(['development_plans', 'succession_planning', 'flight_risk']);
  
  return (
    <div>
      {modules.development_plans && <DevelopmentPlansSection />}
      {modules.succession_planning && <SuccessionSection />}
      {modules.flight_risk && <FlightRiskSection />}
    </div>
  );
}
```

**Get module metadata:**

```typescript
import { useModuleConfig } from '../hooks/useModule';

function FeatureCard({ moduleKey }) {
  const module = useModuleConfig(moduleKey);
  
  return (
    <div>
      <h3>{module?.name}</h3>
      <p>{module?.description}</p>
      {module?.beta && <span className="badge">Beta</span>}
    </div>
  );
}
```

## Available Modules

### Core (2 modules)
- `nine_box` - 9-Box Talent Grid ✅
- `people_dashboard` - People Directory ✅

### Assessment (4 modules)
- `performance_reviews` - Performance Reviews ✅
- `calibration` - Calibration Sessions ✅ (requires: nine_box, performance_reviews)
- `360_feedback` - 360 Feedback ✅
- `ideal_team_player` - Ideal Team Player Assessment ✅

### Development (4 modules)
- `development_plans` - Development Plans ✅
- `succession_planning` - Succession Planning ✅ (requires: nine_box)
- `flight_risk` - Flight Risk Assessment ✅ (requires: nine_box)
- `one_on_ones` - One-on-One Meetings ✅

### Performance (2 modules)
- `pips` - Performance Improvement Plans ✅
- `manager_notes` - Manager Notes ✅

### Lifecycle (1 module)
- `onboarding` - Employee Onboarding ✅

### Structure (3 modules)
- `org_chart` - Organization Chart ✅
- `matrix_organization` - Matrix Organization 🧪 Beta (requires: org_chart)
- `department_management` - Department Management ✅

### Analytics (2 modules)
- `analytics_dashboard` - Analytics Dashboard ✅
- `data_quality` - Data Quality Monitor ✅

### AI Features (3 modules)
- `ai_insights` - AI Insights & Suggestions ✅
- `ai_review_parser` - AI Review Parser ✅ (requires: performance_reviews)
- `transcript_importer` - Meeting Transcript Import ✅ (requires: one_on_ones)

### Admin (1 module)
- `import_export` - Data Import/Export ✅

**Total: 22 modules** across 8 categories

## Module Dependencies

Some modules depend on others. The system automatically checks dependencies:

```typescript
// Calibration requires both nine_box and performance_reviews
calibration: {
  key: 'calibration',
  name: 'Calibration Sessions',
  enabled: true,
  dependsOn: ['nine_box', 'performance_reviews'],
}
```

If you disable a module that others depend on, those dependent modules won't render even if enabled.

## Best Practices

### 1. Conditional Rendering at Component Root

Always check module status at the top of your component:

```typescript
function MyFeature() {
  const isEnabled = useModule('my_feature');
  
  // Early return if disabled
  if (!isEnabled) return null;
  
  // Rest of component logic...
  return <div>Feature content</div>;
}
```

### 2. Group Related Features

Use `useModules()` to check multiple related features efficiently:

```typescript
function Dashboard() {
  const { nine_box, calibration, analytics_dashboard } = useModules([
    'nine_box',
    'calibration', 
    'analytics_dashboard'
  ]);
  
  return (
    <div>
      {nine_box && <NineBoxGrid />}
      {calibration && <CalibrationView />}
      {analytics_dashboard && <AnalyticsDashboard />}
    </div>
  );
}
```

### 3. Handle Missing Modules Gracefully

Don't crash if a module is disabled. Show fallback UI:

```typescript
function Reports() {
  const hasAnalytics = useModule('analytics_dashboard');
  
  if (!hasAnalytics) {
    return (
      <div className="text-center p-8">
        <p>Analytics dashboard is not available.</p>
        <p className="text-sm text-gray-600">Contact admin to enable this feature.</p>
      </div>
    );
  }
  
  return <AnalyticsDashboard />;
}
```

### 4. Use Categories for Navigation

Organize navigation based on enabled modules by category:

```typescript
import { getModulesByCategory } from '../config/modules';

function Navigation() {
  const assessmentModules = getModulesByCategory('assessment');
  const developmentModules = getModulesByCategory('development');
  
  return (
    <nav>
      {assessmentModules.length > 0 && (
        <section>
          <h3>Assessment</h3>
          {assessmentModules.map(module => (
            <NavLink key={module.key} to={`/${module.key}`}>
              {module.name}
            </NavLink>
          ))}
        </section>
      )}
      
      {/* Same for other categories */}
    </nav>
  );
}
```

## Migration Guide

### Wrapping Existing Components

To make an existing feature modular:

**Before:**
```typescript
function MyFeature() {
  return <div>Feature content</div>;
}
```

**After:**
```typescript
import { useModule } from '../hooks/useModule';

function MyFeature() {
  const isEnabled = useModule('my_feature');
  if (!isEnabled) return null;
  
  return <div>Feature content</div>;
}
```

That's it! No other changes needed.

## Performance Considerations

### Memoization

The hooks use `useMemo` internally, so they're efficient:

```typescript
// This won't cause unnecessary re-renders
const isEnabled = useModule('nine_box');
```

### Code Splitting

Combine with React.lazy() for code splitting:

```typescript
import { lazy, Suspense } from 'react';
import { useModule } from '../hooks/useModule';

const Feedback360 = lazy(() => import('./Feedback360Dashboard'));

function Dashboard() {
  const has360 = useModule('360_feedback');
  
  if (!has360) return null;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Feedback360 />
    </Suspense>
  );
}
```

This way, code for disabled features is never loaded!

## Troubleshooting

### Module not hiding when disabled

**Check:**
1. Is the `enabled` flag set to `false` in `modules.ts`?
2. Does your component use `useModule()` or check manually?
3. Did you refresh the page after changing the config?

### Dependencies not working

**Check:**
1. Is the `dependsOn` array correctly specified in `modules.ts`?
2. Are all dependency modules enabled?
3. Use `areDependenciesMet(key)` to debug:

```typescript
import { areDependenciesMet } from '../config/modules';

console.log('Calibration deps met:', areDependenciesMet('calibration'));
```

### Feature still loads even when disabled

**Check:**
1. Make sure you're returning `null` when disabled, not just hiding with CSS
2. Verify the module key matches exactly (case-sensitive)
3. Clear browser cache and restart dev server

## Adding New Modules

### 1. Add to module registry

Edit `src/config/modules.ts`:

```typescript
export const MODULES: Record<ModuleKey, ModuleConfig> = {
  // ... existing modules
  
  my_new_feature: {
    key: 'my_new_feature',
    name: 'My New Feature',
    description: 'Description of what it does',
    enabled: true,
    category: 'development', // or appropriate category
    dependsOn: ['nine_box'], // optional dependencies
    beta: true, // optional beta flag
  },
};
```

### 2. Add TypeScript type

Update the `ModuleKey` type at the top of `modules.ts`:

```typescript
export type ModuleKey =
  | 'nine_box'
  | 'people_dashboard'
  // ... existing keys
  | 'my_new_feature'; // ← Add your key
```

### 3. Use in component

```typescript
import { useModule } from '../hooks/useModule';

function MyNewFeature() {
  const isEnabled = useModule('my_new_feature');
  if (!isEnabled) return null;
  
  return <div>My feature UI</div>;
}
```

## Testing

### Test with modules disabled

```typescript
import { render } from '@testing-library/react';
import { MODULES } from '../config/modules';

describe('MyComponent', () => {
  it('hides when module is disabled', () => {
    // Temporarily disable
    const original = MODULES.my_feature.enabled;
    MODULES.my_feature.enabled = false;
    
    const { container } = render(<MyComponent />);
    expect(container).toBeEmptyDOMElement();
    
    // Restore
    MODULES.my_feature.enabled = original;
  });
});
```

## Summary

✅ **Simple** - Just a config file, no database needed  
✅ **Type-safe** - Full TypeScript support  
✅ **Performant** - Memoized hooks, works with code splitting  
✅ **Flexible** - Easy to add, remove, or modify modules  
✅ **Zero overhead** - Disabled features don't load  

The modular architecture keeps your codebase maintainable and allows you to scale features based on organizational needs.

