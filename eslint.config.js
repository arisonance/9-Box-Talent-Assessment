import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

const ignores = [
  'dist',
  'node_modules',
  'build',
  'coverage',
  'web/.next',
  'web/.next/**',
  'web/.next.types',
  'web/.next.types/**',
  '.vite',
  '.vite/**',
  '.claude',
  '.claude/**',
  'scripts/**',
  // Legacy dashboards pending refactor
  'src/components/admin/**',
  'src/components/OnboardingModal.tsx',
  'src/components/ImportModal.tsx',
  'src/components/OrganizationSetup.tsx',
  'src/components/ReviewParserModal.tsx',
  'src/components/TeamPlayerCoachingModal.tsx',
  'src/components/PlansOverview.tsx',
  'src/components/PlansDashboard.tsx',
  'src/components/DepartmentManager.tsx',
  'src/components/DepartmentSelector.tsx',
  'src/components/DevelopmentDashboard.tsx',
  'src/components/FlightRiskDashboard.tsx',
  'src/components/MatrixOrgChart.tsx',
  'src/components/UnassignedEmployees.tsx',
  'src/components/PeopleDashboard.tsx',
  'src/components/IdealTeamPlayerDashboard.tsx',
  'src/components/Feedback360CreateModal.tsx',
  'src/components/Feedback360Dashboard.tsx',
  'src/components/OrganizationMetrics.tsx',
  'src/components/QuickAuthForm.tsx',
  'src/components/ActionItemGenerator.ts',
]
const lintTargets = [
  'src/components/EmployeeDetailModal.tsx',
  'src/components/EmployeeList.tsx',
  'src/components/NineBoxGrid.tsx',
  'src/components/Dashboard.tsx',
]

export default tseslint.config([
  globalIgnores(ignores),
  {
    files: lintTargets,
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'react-refresh/only-export-components': 'off',
    },
  },
])
