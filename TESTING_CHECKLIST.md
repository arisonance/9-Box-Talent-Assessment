# 9-Box Talent Assessment - Testing Checklist

## Pre-Testing Setup
- [ ] Supabase project created and configured
- [ ] Environment variables set in `.env`
- [ ] Database schema migrated successfully
- [ ] Development server running (`npm run dev`)

## Authentication & Organization Setup
- [ ] **Sign Up**: Create new account with email/password
- [ ] **Email Validation**: Confirm account via email (if enabled)
- [ ] **Organization Setup**: Create organization with company name
- [ ] **User Profile**: Verify user is set as org admin
- [ ] **Sign Out/In**: Test authentication flow

## Department Management
- [ ] **Create Department**: Add first department with name and color
- [ ] **Edit Department**: Modify department name and color
- [ ] **Multiple Departments**: Create 3-4 departments for testing
- [ ] **Color Selection**: Test both preset colors and custom color picker
- [ ] **Delete Department**: Test deletion with confirmation
- [ ] **Permissions**: Verify only org admins can manage departments

## Employee Import
- [ ] **Download Template**: Download CSV template file
- [ ] **Upload CSV**: Import the provided template with sample data
- [ ] **Field Mapping**: Test column mapping interface
- [ ] **Validation**: Test with invalid data (missing names, bad emails)
- [ ] **Preview**: Verify import preview shows correct data
- [ ] **Department Mapping**: Test department name matching
- [ ] **Duplicate Handling**: Import same file twice to test updates
- [ ] **Large Dataset**: Test with 50+ employees (use template to generate)

## 9-Box Grid Assessment
- [ ] **Grid Display**: Verify all 9 boxes display with correct labels
- [ ] **Unassigned Employees**: Check sidebar shows imported employees
- [ ] **Drag and Drop**: Drag employee from sidebar to grid cell
- [ ] **Assessment Update**: Verify employee assessment saves correctly
- [ ] **Performance/Potential**: Check correct values are set based on position
- [ ] **Department Colors**: Verify employee cards show department colors
- [ ] **Box Movement**: Move employee between different boxes
- [ ] **Multiple Employees**: Place multiple employees in same box
- [ ] **Real-time Updates**: Check counts update immediately

## Filtering & Search
- [ ] **Department Filter**: Filter grid by single department
- [ ] **Multiple Departments**: Select multiple departments
- [ ] **All Departments**: Reset to show all departments
- [ ] **Employee Search**: Search employees by name in employee list
- [ ] **Search Results**: Verify filtered results are correct
- [ ] **Clear Search**: Clear search to show all employees

## Export Functionality
- [ ] **CSV Export**: Export from grid view (all data)
- [ ] **Employee List Export**: Export from employees tab
- [ ] **HTML Report**: Generate and download HTML report
- [ ] **PNG Screenshot**: Take screenshot of current grid
- [ ] **Export Modal**: Test all export options from grid
- [ ] **File Downloads**: Verify all exported files download correctly

## Data Persistence
- [ ] **Page Refresh**: Refresh page and verify assessments persist
- [ ] **Navigation**: Switch between tabs and return to grid
- [ ] **Browser Close**: Close/reopen browser and verify data remains
- [ ] **Assessment History**: Check assessed_by and assessed_at fields

## Responsive Design
- [ ] **Desktop View**: Test on standard desktop (1920x1080)
- [ ] **Tablet View**: Test on tablet size (768x1024)
- [ ] **Mobile View**: Test on mobile (375x667)
- [ ] **Grid Responsiveness**: Verify grid adapts to screen size
- [ ] **Touch Interactions**: Test drag-and-drop on touch devices

## Performance Testing
- [ ] **100 Employees**: Test with 100 employees
- [ ] **500 Employees**: Test with larger dataset (if possible)
- [ ] **Grid Rendering**: Check smooth scrolling in grid cells
- [ ] **Search Performance**: Test search with large dataset
- [ ] **Export Performance**: Time exports with large datasets

## Error Handling
- [ ] **Network Errors**: Test with poor internet connection
- [ ] **Invalid CSV**: Upload malformed CSV file
- [ ] **Missing Required Data**: Test validation messages
- [ ] **Database Errors**: Test error handling (temporarily break connection)
- [ ] **Large File Upload**: Test file size limits
- [ ] **Browser Compatibility**: Test in Chrome, Firefox, Safari

## User Experience
- [ ] **Loading States**: Verify loading indicators appear appropriately
- [ ] **Error Messages**: Check error messages are clear and helpful
- [ ] **Success Feedback**: Verify success messages for actions
- [ ] **Tooltips**: Check hover states and tooltips
- [ ] **Keyboard Navigation**: Test tab navigation and keyboard shortcuts
- [ ] **Visual Feedback**: Drag preview, hover states, focus indicators

## Role-Based Access (if multiple users available)
- [ ] **Org Admin**: Full access to all features
- [ ] **Department Manager**: Limited department access (future feature)
- [ ] **Viewer**: Read-only access (future feature)

## Business Logic Validation
- [ ] **Box Calculations**: Verify performance/potential map to correct boxes
- [ ] **Assessment Logic**: Check box_key generation is correct
- [ ] **Department Assignment**: Verify employees maintain department associations
- [ ] **Duplicate Prevention**: Test employee_id and email uniqueness
- [ ] **Data Integrity**: Verify foreign key relationships work correctly

## Final Acceptance Tests
- [ ] **Complete Workflow**: Full end-to-end user journey
- [ ] **Real Data Test**: Use actual company data (anonymized)
- [ ] **Multi-Session**: Multiple browser sessions with same organization
- [ ] **Data Backup**: Export all data and verify completeness
- [ ] **Production Readiness**: All critical paths working without errors

## Performance Benchmarks
- [ ] Initial page load: < 3 seconds
- [ ] Grid rendering (100 employees): < 2 seconds
- [ ] Drag and drop response: < 100ms
- [ ] CSV import (100 employees): < 10 seconds
- [ ] Export generation: < 5 seconds

## Security Verification
- [ ] **SQL Injection**: Test input fields with SQL injection attempts
- [ ] **XSS Protection**: Test with script tags in input fields
- [ ] **Authentication**: Verify protected routes require login
- [ ] **Authorization**: Verify users can only access their org data
- [ ] **Data Privacy**: Verify no sensitive data in client-side storage

---

## Test Results Summary

**Date**: ___________
**Tester**: ___________
**Environment**: ___________

**Total Tests**: _____ / _____
**Passed**: _____
**Failed**: _____
**Critical Issues**: _____

**Overall Status**: [ ] Ready for Production [ ] Needs Work [ ] Not Ready

### Critical Issues Found:
1. _________________________________
2. _________________________________
3. _________________________________

### Notes:
_________________________________
_________________________________