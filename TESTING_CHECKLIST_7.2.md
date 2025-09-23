# Testing Checklist - Task 7.2: Test Core Application Flows

## Prerequisites
1. Start the backend server: `cd backend && python app.py`
2. Start the frontend dev server: `cd frontend && npm run dev`
3. Open browser to `http://localhost:5173`

## Test Cases to Execute

### Login and Navigation Testing
- [ ] **Login Flow**
  - Navigate to login page
  - Test login with admin credentials
  - Verify redirect to `/admin` route
  - Test logout functionality
  - Test login with regular user credentials
  - Verify redirect to `/user` route

- [ ] **Navigation Between Views**
  - As admin: verify access to admin dashboard
  - As admin: verify cannot access `/user` route (should redirect to `/admin`)
  - As user: verify access to user dashboard
  - As user: verify cannot access `/admin` route (should redirect to `/user`)
  - Test direct URL navigation (type URLs in address bar)

### File Browsing Functionality

#### Admin Context File Browsing
- [ ] **Admin File Browser**
  - Verify NasFolderTree component loads in admin view
  - Test folder expansion/collapse
  - Test file listing display
  - Test navigation through folder structure
  - Verify file/folder icons display correctly
  - Test breadcrumb navigation (if present)

#### User Context File Browsing
- [ ] **User File Browser**
  - Verify NasFolderTree component loads in user view
  - Test folder expansion/collapse
  - Test file listing display
  - Test navigation through folder structure
  - Verify appropriate permissions are enforced
  - Compare with admin view to ensure proper access control

### Modal Dialog Testing
- [ ] **Create Folder Modal**
  - Open create folder dialog
  - Test form validation
  - Test successful folder creation
  - Test cancel functionality
  - Verify modal closes properly

- [ ] **Rename Modal**
  - Right-click or select file/folder to rename
  - Open rename dialog
  - Test form validation
  - Test successful rename operation
  - Test cancel functionality

- [ ] **Delete Modal**
  - Select file/folder to delete
  - Open delete confirmation dialog
  - Test confirmation flow
  - Test successful deletion
  - Test cancel functionality

- [ ] **General Modal Behavior**
  - Test modal backdrop click to close
  - Test ESC key to close
  - Test modal focus management
  - Verify no multiple modals can open simultaneously

## Expected Results
- All navigation flows work without errors
- File browsing is responsive and functional
- Modal dialogs open, function, and close properly
- No console errors during normal operation
- Proper access control between admin and user views

## Notes
- Check browser console for any JavaScript errors
- Verify network requests are successful (check Network tab)
- Test on different screen sizes if possible
- Note any performance issues or slow loading

## Issues Found
(Document any issues discovered during testing)

---
**Requirements Coverage**: 3.2, 2.3