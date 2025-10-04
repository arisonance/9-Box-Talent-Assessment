# 9-Box Talent Assessment

A modern web application for talent assessment using the 9-box grid methodology. Built with React, TypeScript, and Supabase.

## 🚀 Quick Start (Bypass Mode - No Setup Required!)

```bash
npm install
npm run dev
```

The dev server auto-opens your default browser at http://127.0.0.1:5173/ — if it doesn't, open that link manually and click **"Enter Dashboard"**

**That's it! No authentication, no database setup needed.** The app runs with 15 pre-loaded test employees.

## Features

- **9-Box Grid Visualization**: Interactive drag-and-drop talent placement
- **Employee Management**: Import, manage, and assess employees
- **Department Organization**: Color-coded department management
- **Role-based Permissions**: Org Admin, Department Manager, and Viewer roles
- **CSV Import/Export**: Bulk employee data management
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Build Tool**: Vite
- **Drag & Drop**: @dnd-kit
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 9-box-talent-assessment
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   
   a. Create a new Supabase project at [supabase.com](https://supabase.com)
   
   b. Copy your project URL and anon key from Project Settings > API
   
   c. Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   
   In your Supabase SQL Editor, run the migration file:
   ```sql
   -- Copy and paste the contents of supabase/migrations/001_initial_schema.sql
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://127.0.0.1:5173](http://127.0.0.1:5173) if the browser doesn't open automatically

## Usage

### Initial Setup

1. **Sign Up**: Create an account with your email
2. **Organization Setup**: Enter your organization name
3. **Department Creation**: Add departments with color coding
4. **Employee Import**: Use the CSV import feature or add employees manually

### 9-Box Assessment

The 9-box grid evaluates employees on two dimensions:

- **Performance** (X-axis): Low → Medium → High
- **Potential** (Y-axis): Low → Medium → High

#### Default Box Categories

| Position | Label | Description |
|----------|-------|-------------|
| Low/Low | Realign & Redirect | Not delivering; can't adapt |
| Med/Low | Core Foundation | Solid; limited potential |
| High/Low | Master Craftsperson | Expert; right level |
| Low/Med | Evaluate Further | Potential present; not meeting |
| Med/Med | Steady Contributor | Reliable; meets |
| High/Med | Performance Leader | Exceptional results |
| Low/High | Rising Talent | Underperforming; high potential |
| Med/High | Emerging Leader | Meets; ready for more |
| High/High | Star / Top Talent | Exceeds; fast learner |

### CSV Import Format

```csv
employee_id,name,email,department,manager,title,location,performance,potential
EMP001,John Doe,john@company.com,Engineering,Jane Smith,Senior Engineer,New York,high,high
```

**Required fields**: `employee_id`, `name`
**Optional fields**: `email`, `department`, `manager`, `title`, `location`, `performance`, `potential`

## User Roles

- **Org Admin**: Full access to all features and data
- **Department Manager**: Can manage employees in their departments
- **Viewer**: Read-only access to organizational data

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Browser Auto-Launch Rules

- `npm run dev` uses the shared Vite config (host `127.0.0.1`, port `5173`, `open: true`) so your default browser should pop automatically.
- Wait for the terminal to show `Local: http://127.0.0.1:5173/` before interacting with the app.
- If the tab does not appear, re-run `npm run dev -- --open --host 127.0.0.1 --port 5173` or open the URL manually.
- Avoid hard-coding other ports in scripts—use the existing Vite config so everyone gets the same behavior.

### Project Structure

```
src/
├── components/         # React components
├── lib/               # Utilities and configurations
├── types/             # TypeScript type definitions
└── App.tsx           # Main application component
```

### Database Schema

The application uses the following main tables:

- `organizations` - Organization data
- `users` - User profiles and roles
- `departments` - Department information
- `employees` - Employee data
- `assessments` - 9-box assessments
- `box_definitions` - 9-box category definitions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.
