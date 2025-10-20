# Modular System Quick Start

## 🚀 5-Minute Setup

Your platform is now modular! Here's how to use it:

### Step 1: Enable/Disable Features (No Code!)

Edit `src/config/modules.ts` and change any `enabled` flag:

```typescript
export const MODULES = {
  '360_feedback': {
    key: '360_feedback',
    name: '360 Feedback',
    enabled: false,  // ← Disabled! Feature will hide automatically
    // ...
  },
  
  onboarding: {
    key: 'onboarding',
    name: 'Employee Onboarding',
    enabled: true,   // ← Enabled! Feature will show
    // ...
  },
};
```

That's it! No database changes, no migrations. Just toggle `true`/`false`.

### Step 2: Make Existing Components Modular

Wrap any component with a module check:

**Before:**
```typescript
function Feedback360Dashboard() {
  return <div>360 Feedback UI</div>;
}
```

**After:**
```typescript
import { useModule } from '../hooks/useModule';

function Feedback360Dashboard() {
  const isEnabled = useModule('360_feedback');
  if (!isEnabled) return null;  // ← Feature hides when disabled
  
  return <div>360 Feedback UI</div>;
}
```

### Step 3: Use in Conditional UI

Check multiple modules at once:

```typescript
import { useModules } from '../hooks/useModule';

function DashboardNav() {
  const modules = useModules([
    'nine_box',
    'calibration', 
    '360_feedback',
    'succession_planning'
  ]);
  
  return (
    <nav>
      {modules.nine_box && <NavLink to="/9-box">9-Box Grid</NavLink>}
      {modules.calibration && <NavLink to="/calibrate">Calibration</NavLink>}
      {modules['360_feedback'] && <NavLink to="/360">360 Feedback</NavLink>}
      {modules.succession_planning && <NavLink to="/succession">Succession</NavLink>}
    </nav>
  );
}
```

## 📦 What You Get

### All Current Features Organized
- **22 modules** across 8 categories
- All existing features preserved
- Easy to enable/disable with one flag
- Automatic dependency checking

### Three Simple Hooks
1. `useModule(key)` - Check if enabled
2. `useModuleConfig(key)` - Get module details
3. `useModules([keys])` - Check multiple at once

### Zero Database Changes
- No migrations needed
- No Supabase changes
- Works with existing data
- Pure configuration-based system

## 🎯 Example: Disable Beta Features

Want to hide all beta features in production?

```typescript
// In modules.ts, set all beta features to false:
matrix_organization: {
  enabled: false,  // Beta feature disabled
  beta: true,
}
```

Or programmatically:

```typescript
import { MODULES } from '../config/modules';

// Disable all beta features
Object.values(MODULES).forEach(module => {
  if (module.beta) {
    module.enabled = false;
  }
});
```

## 🔥 Example: Progressive Rollout

**Week 1: Core features only**
```typescript
// Enable only essential features
nine_box: { enabled: true },
people_dashboard: { enabled: true },
performance_reviews: { enabled: true },
// Everything else: enabled: false
```

**Week 2: Add development features**
```typescript
development_plans: { enabled: true },
one_on_ones: { enabled: true },
```

**Week 3: Add analytics**
```typescript
analytics_dashboard: { enabled: true },
data_quality: { enabled: true },
```

**Week 4: Full rollout**
```typescript
// Enable everything
```

## 🛠️ Real World Example

Here's how to make your Dashboard modular:

```typescript
// src/components/Dashboard.tsx
import { useModules } from '../hooks/useModule';

function Dashboard() {
  const modules = useModules([
    'nine_box',
    'people_dashboard',
    'calibration',
    'development_plans',
    '360_feedback',
    'analytics_dashboard',
  ]);
  
  return (
    <div>
      <nav>
        {modules.people_dashboard && (
          <TabButton active={view === 'people'}>People</TabButton>
        )}
        {modules.nine_box && (
          <TabButton active={view === 'evaluate'}>9-Box</TabButton>
        )}
        {modules.calibration && (
          <TabButton active={view === 'calibrate'}>Calibration</TabButton>
        )}
        {modules.development_plans && (
          <TabButton active={view === 'develop'}>Development</TabButton>
        )}
        {modules['360_feedback'] && (
          <TabButton active={view === '360'}>360 Feedback</TabButton>
        )}
        {modules.analytics_dashboard && (
          <TabButton active={view === 'analytics'}>Analytics</TabButton>
        )}
      </nav>
      
      <main>
        {view === 'people' && modules.people_dashboard && <PeopleDashboard />}
        {view === 'evaluate' && modules.nine_box && <NineBoxGrid />}
        {view === 'calibrate' && modules.calibration && <CalibrationView />}
        {view === 'develop' && modules.development_plans && <DevelopmentPlans />}
        {view === '360' && modules['360_feedback'] && <Feedback360 />}
        {view === 'analytics' && modules.analytics_dashboard && <Analytics />}
      </main>
    </div>
  );
}
```

## 🎨 Styling Based on Modules

You can even style based on what's enabled:

```typescript
import { getEnabledModules } from '../config/modules';

function AppLayout() {
  const enabledCount = getEnabledModules().length;
  
  return (
    <div className={enabledCount > 15 ? 'complex-nav' : 'simple-nav'}>
      {/* Adjust layout based on feature count */}
    </div>
  );
}
```

## 📊 Module Categories

Organize your navigation by category:

```typescript
import { getModulesByCategory } from '../config/modules';

function NavBar() {
  const assessmentModules = getModulesByCategory('assessment');
  const developmentModules = getModulesByCategory('development');
  const analyticsModules = getModulesByCategory('analytics');
  
  return (
    <nav>
      {assessmentModules.length > 0 && (
        <section>
          <h3>Assessment</h3>
          {assessmentModules.map(m => (
            <NavLink key={m.key} to={`/${m.key}`}>{m.name}</NavLink>
          ))}
        </section>
      )}
      
      {developmentModules.length > 0 && (
        <section>
          <h3>Development</h3>
          {developmentModules.map(m => (
            <NavLink key={m.key} to={`/${m.key}`}>{m.name}</NavLink>
          ))}
        </section>
      )}
      
      {analyticsModules.length > 0 && (
        <section>
          <h3>Analytics</h3>
          {analyticsModules.map(m => (
            <NavLink key={m.key} to={`/${m.key}`}>{m.name}</NavLink>
          ))}
        </section>
      )}
    </nav>
  );
}
```

## ⚡ Performance Bonus: Code Splitting

Combine with React.lazy() to not load disabled features:

```typescript
import { lazy, Suspense } from 'react';
import { useModule } from '../hooks/useModule';

// Only load code when module is enabled
const Feedback360 = lazy(() => import('./Feedback360Dashboard'));
const SuccessionPlanning = lazy(() => import('./SuccessionPlanning'));

function App() {
  const has360 = useModule('360_feedback');
  const hasSuccession = useModule('succession_planning');
  
  return (
    <Suspense fallback={<Loading />}>
      {has360 && <Feedback360 />}
      {hasSuccession && <SuccessionPlanning />}
    </Suspense>
  );
}
```

Disabled features never load—faster app, smaller bundle!

## 🎯 Common Patterns

### Pattern 1: Feature Gate with Fallback

```typescript
function Reports() {
  const hasAnalytics = useModule('analytics_dashboard');
  
  if (!hasAnalytics) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <Lock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Analytics Disabled</h3>
        <p className="text-gray-600">Contact your admin to enable this feature.</p>
      </div>
    );
  }
  
  return <AnalyticsDashboard />;
}
```

### Pattern 2: Conditional Sub-Features

```typescript
function EmployeeProfile({ employee }) {
  const modules = useModules(['performance_reviews', 'development_plans', 'manager_notes']);
  
  return (
    <div>
      <EmployeeHeader employee={employee} />
      
      {modules.performance_reviews && (
        <section>
          <h3>Performance History</h3>
          <PerformanceTimeline employee={employee} />
        </section>
      )}
      
      {modules.development_plans && (
        <section>
          <h3>Development Plans</h3>
          <DevelopmentPlansList employee={employee} />
        </section>
      )}
      
      {modules.manager_notes && (
        <section>
          <h3>Manager Notes</h3>
          <ManagerNotesList employee={employee} />
        </section>
      )}
    </div>
  );
}
```

### Pattern 3: Dynamic Route Configuration

```typescript
import { getEnabledModules } from '../config/modules';

function AppRoutes() {
  const enabledModules = getEnabledModules();
  
  return (
    <Routes>
      {enabledModules.map(module => (
        <Route 
          key={module.key} 
          path={`/${module.key}`} 
          element={<ModuleView module={module} />} 
        />
      ))}
    </Routes>
  );
}
```

## 🐛 Debugging

### Check what's enabled

```typescript
import { getEnabledModules } from '../config/modules';

console.log('Enabled modules:', getEnabledModules().map(m => m.name));
```

### Check dependencies

```typescript
import { areDependenciesMet } from '../config/modules';

console.log('Calibration deps met:', areDependenciesMet('calibration'));
// Checks if nine_box and performance_reviews are enabled
```

### Verify module exists

```typescript
import { getModule } from '../config/modules';

const module = getModule('my_feature');
if (!module) {
  console.error('Module "my_feature" not found in registry');
}
```

## 📚 Next Steps

1. ✅ Read `MODULAR-ARCHITECTURE.md` for full documentation
2. ✅ Read `ORGANIZATIONAL-HEALTH-RECOMMENDATIONS.md` for strategic guidance
3. ✅ Start wrapping components with `useModule()`
4. ✅ Disable features you don't need yet
5. ✅ Gradually enable features as you're ready

## 🎉 You're Done!

Your platform is now modular. All existing features are preserved, but now you have fine-grained control over what's enabled.

**Questions?** Check the full documentation in `MODULAR-ARCHITECTURE.md`.

