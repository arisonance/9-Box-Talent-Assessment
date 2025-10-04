# 9-Box Talent Assessment - Quick Setup Guide

## Prerequisites
- Node.js 18+
- Supabase account

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your Project URL and anon key

2. **Configure Environment Variables**
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env with your Supabase credentials
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Set Up Database**
   - Go to your Supabase project → SQL Editor
   - Copy and paste the entire contents of `supabase/migrations/001_initial_schema.sql`
   - Run the SQL to create all tables, functions, and policies

### 3. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` to access the application.

## First-Time Usage

1. **Sign Up**: Create an account with your email
2. **Create Organization**: Enter your company name
3. **Add Departments**: Go to Departments tab and add your teams
4. **Import Employees**: Use the Import tab to upload your employee data
5. **Start Assessing**: Drag employees into the 9-box grid to assess them

## Features Overview

### ✅ Authentication & Organizations
- Email/password authentication
- Organization setup and management
- Role-based permissions (Admin, Manager, Viewer)

### ✅ Employee Management
- CSV import with field mapping
- Department organization with color coding
- Employee search and filtering
- Export to CSV

### ✅ 9-Box Assessment Grid
- Interactive drag-and-drop interface
- Real-time assessment updates
- Visual performance/potential mapping
- Department filtering

### ✅ Export & Reporting
- CSV data export
- HTML visual reports
- PNG grid snapshots
- Department distribution analysis

### ✅ Department Management
- Create and edit departments
- Color-coded organization
- Department-based filtering

## Troubleshooting

### Database Connection Issues
- Verify your Supabase URL and API key
- Ensure the database schema has been created
- Check Supabase project status

### Import Issues
- Ensure CSV files use UTF-8 encoding
- Required fields: `name` (minimum)
- Check department names match exactly

### Performance Issues
- The app is optimized for up to 1,000 employees
- Large datasets may require pagination (future enhancement)

## Production Deployment

### Build for Production
```bash
npm run build
```

### Deploy Options
- **Vercel**: Connect your GitHub repo for automatic deployments
- **Netlify**: Drag and drop the `dist` folder
- **Static Hosting**: Upload `dist` folder contents

### Environment Variables for Production
Set these in your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Support

- Check the main README.md for detailed documentation
- Review the PRD.md for feature specifications
- Open issues for bugs or feature requests