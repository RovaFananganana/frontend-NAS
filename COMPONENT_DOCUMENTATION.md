# Component Documentation

**Last Updated:** 2025-09-23  
**Version:** Post-Cleanup  
**Total Components:** 17

## Overview

This document provides a comprehensive overview of all Vue.js components in the frontend application after the component cleanup process. The application follows a clear architectural pattern with Views as entry points and components organized by usage scope (Admin, Shared, User).

## Architecture

### Component Hierarchy

```
App.vue
├── Notification.vue (Shared)
├── Router Views:
    ├── Login.vue
    ├── Admin.vue
    │   ├── Navbar.vue (Shared)
    │   ├── Sidebar.vue (Shared)
    │   └── Dynamic Components:
    │       ├── Dashboard.vue
    │       │   └── PerformanceDashboard.vue
    │       ├── UserManagement.vue
    │       ├── GroupManagement.vue
    │       ├── SimpleFileExplorer.vue (Shared)
    │       ├── PermissionManager.vue
    │       └── AccessLogs.vue
    ├── User.vue
    │   ├── Navbar.vue (Shared)
    │   ├── Sidebar.vue (Shared)
    │   └── Dynamic Components:
    │       ├── ProfileEditor.vue
    │       ├── SimpleFileExplorer.vue (Shared)
    │       ├── StorageInfo.vue
    │       └── ActivityLogs.vue
    ├── NotFound.vue
    └── TestModal.vue
        └── Modal.vue (Shared)
```

## Views (5 components)

### `Login.vue`
- **Purpose:** User authentication interface
- **Location:** `src/views/Login.vue`
- **Dependencies:** None
- **Usage:** Entry point for unauthenticated users

### `Admin.vue`
- **Purpose:** Admin dashboard layout with dynamic component loading
- **Location:** `src/views/Admin.vue`
- **Dependencies:** Navbar, Sidebar, all Admin components
- **Usage:** Main admin interface with role-based access

### `User.vue`
- **Purpose:** User dashboard layout with dynamic component loading
- **Location:** `src/views/User.vue`
- **Dependencies:** Navbar, Sidebar, all User components
- **Usage:** Main user interface for regular users

### `NotFound.vue`
- **Purpose:** 404 error page
- **Location:** `src/views/NotFound.vue`
- **Dependencies:** None
- **Usage:** Fallback route for invalid URLs

### `TestModal.vue`
- **Purpose:** Development/testing interface for modal components
- **Location:** `src/views/TestModal.vue`
- **Dependencies:** Modal.vue
- **Usage:** Development and testing purposes

## Admin Components (6 components)

### `Dashboard.vue`
- **Purpose:** Admin dashboard overview with system metrics
- **Location:** `src/components/Admin/Dashboard.vue`
- **Dependencies:** PerformanceDashboard.vue
- **Props:** None
- **Events:** None
- **Usage:** Loaded dynamically by Admin.vue

### `PerformanceDashboard.vue`
- **Purpose:** System performance monitoring and metrics display
- **Location:** `src/components/Admin/PerformanceDashboard.vue`
- **Dependencies:** None
- **Props:** None
- **Events:** None
- **Usage:** Embedded within Dashboard.vue

### `UserManagement.vue`
- **Purpose:** User account administration (create, edit, delete users)
- **Location:** `src/components/Admin/UserManagement.vue`
- **Dependencies:** API services
- **Props:** None
- **Events:** User CRUD operations
- **Usage:** Loaded dynamically by Admin.vue

### `GroupManagement.vue`
- **Purpose:** User group administration and management
- **Location:** `src/components/Admin/GroupManagement.vue`
- **Dependencies:** API services
- **Props:** None
- **Events:** Group CRUD operations
- **Usage:** Loaded dynamically by Admin.vue

### `PermissionManager.vue`
- **Purpose:** File and folder permission management interface
- **Location:** `src/components/Admin/PermissionManager.vue`
- **Dependencies:** API services
- **Props:** None
- **Events:** Permission updates
- **Usage:** Loaded dynamically by Admin.vue

### `AccessLogs.vue`
- **Purpose:** System access logging and audit trail display
- **Location:** `src/components/Admin/AccessLogs.vue`
- **Dependencies:** API services
- **Props:** None
- **Events:** None
- **Usage:** Loaded dynamically by Admin.vue

## Shared Components (8 components)

### Core Layout Components

#### `Navbar.vue`
- **Purpose:** Application navigation header
- **Location:** `src/components/Shared/Navbar.vue`
- **Dependencies:** Authentication service
- **Props:** None
- **Events:** Navigation, logout
- **Usage:** Used by both Admin.vue and User.vue

#### `Sidebar.vue`
- **Purpose:** Application sidebar navigation
- **Location:** `src/components/Shared/Sidebar.vue`
- **Dependencies:** Router, authentication service
- **Props:** None
- **Events:** Navigation
- **Usage:** Used by both Admin.vue and User.vue

#### `Notification.vue`
- **Purpose:** Application-wide notification system
- **Location:** `src/components/Shared/Notification.vue`
- **Dependencies:** Notification store
- **Props:** None
- **Events:** Notification display/dismiss
- **Usage:** Global component in App.vue

### File Management Components

#### `SimpleFileExplorer.vue`
- **Purpose:** Main file browser interface with file operations
- **Location:** `src/components/Shared/SimpleFileExplorer.vue`
- **Dependencies:** All modal components, NasFolderTree
- **Props:** Configuration options
- **Events:** File operations (upload, download, delete, etc.)
- **Usage:** Used by both Admin.vue and User.vue

#### `NasFolderTree.vue`
- **Purpose:** Hierarchical folder tree navigation for NAS
- **Location:** `src/components/Shared/NasFolderTree.vue`
- **Dependencies:** NasTreeNode.vue, useSynologyAPI
- **Props:** Root folder, selection options
- **Events:** Folder selection, expansion
- **Usage:** Used by SimpleFileExplorer.vue

#### `NasTreeNode.vue`
- **Purpose:** Individual tree node component for folder tree
- **Location:** `src/components/Shared/NasTreeNode.vue`
- **Dependencies:** None
- **Props:** Node data, level, expanded state
- **Events:** Node click, expand/collapse
- **Usage:** Used recursively by NasFolderTree.vue

### Modal Components

#### `Modal.vue`
- **Purpose:** Base modal component with overlay and positioning
- **Location:** `src/components/Shared/Modal.vue`
- **Dependencies:** None
- **Props:** Show/hide state, size options
- **Events:** Close, backdrop click
- **Usage:** Base component for all other modals

#### `CreateFolderModal.vue`
- **Purpose:** Folder creation dialog with validation
- **Location:** `src/components/Shared/CreateFolderModal.vue`
- **Dependencies:** Modal.vue, API services
- **Props:** Parent folder path
- **Events:** Folder created, cancel
- **Usage:** Used by SimpleFileExplorer.vue

#### `DeleteConfirmModal.vue`
- **Purpose:** Deletion confirmation dialog for files/folders
- **Location:** `src/components/Shared/DeleteConfirmModal.vue`
- **Dependencies:** Modal.vue
- **Props:** Item details, deletion type
- **Events:** Confirm delete, cancel
- **Usage:** Used by SimpleFileExplorer.vue

#### `RenameModal.vue`
- **Purpose:** File/folder rename dialog with validation
- **Location:** `src/components/Shared/RenameModal.vue`
- **Dependencies:** Modal.vue, API services
- **Props:** Current item name, item type
- **Events:** Rename confirmed, cancel
- **Usage:** Used by SimpleFileExplorer.vue

#### `MoveModal.vue`
- **Purpose:** File/folder move dialog with destination selection
- **Location:** `src/components/Shared/MoveModal.vue`
- **Dependencies:** Modal.vue, NasFolderTree.vue
- **Props:** Items to move
- **Events:** Move confirmed, cancel
- **Usage:** Used by SimpleFileExplorer.vue

#### `PermissionModal.vue`
- **Purpose:** File/folder permission editing dialog
- **Location:** `src/components/Shared/PermissionModal.vue`
- **Dependencies:** Modal.vue, API services
- **Props:** Item path, current permissions
- **Events:** Permissions updated, cancel
- **Usage:** Used by SimpleFileExplorer.vue and PermissionManager.vue

#### `PropertiesModal.vue`
- **Purpose:** File/folder properties display dialog
- **Location:** `src/components/Shared/PropertiesModal.vue`
- **Dependencies:** Modal.vue, API services
- **Props:** Item path
- **Events:** Close
- **Usage:** Used by SimpleFileExplorer.vue

## User Components (3 components)

### `ProfileEditor.vue`
- **Purpose:** User profile editing interface
- **Location:** `src/components/User/ProfileEditor.vue`
- **Dependencies:** API services, form validation
- **Props:** None
- **Events:** Profile updated
- **Usage:** Loaded dynamically by User.vue

### `StorageInfo.vue`
- **Purpose:** User storage quota and usage display
- **Location:** `src/components/User/StorageInfo.vue`
- **Dependencies:** API services
- **Props:** None
- **Events:** None
- **Usage:** Loaded dynamically by User.vue

### `ActivityLogs.vue`
- **Purpose:** User activity history and audit trail
- **Location:** `src/components/User/ActivityLogs.vue`
- **Dependencies:** API services
- **Props:** None
- **Events:** None
- **Usage:** Loaded dynamically by User.vue

## Component Usage Patterns

### Dynamic Component Loading
Both Admin.vue and User.vue use dynamic component loading:
```javascript
const currentComponent = computed(() => {
  return componentMap[activeView.value] || DefaultComponent
})
```

### Modal Management
All modals follow a consistent pattern:
- Extend base Modal.vue component
- Use reactive show/hide state
- Emit events for parent component handling
- Include proper validation and error handling

### API Integration
Components that interact with the backend follow consistent patterns:
- Use centralized API service
- Implement proper error handling
- Show loading states during operations
- Update local state after successful operations

## Development Guidelines

### Adding New Components
1. Place in appropriate directory (Admin/Shared/User)
2. Follow existing naming conventions (PascalCase)
3. Extend base components where applicable (Modal.vue)
4. Include proper TypeScript types and props validation
5. Add to dynamic component maps if needed

### Component Dependencies
- Keep dependencies minimal and well-defined
- Use Shared components for cross-cutting concerns
- Avoid circular dependencies
- Document all external dependencies

### Testing Considerations
- Each component should be testable in isolation
- Mock external dependencies (API services)
- Test both success and error scenarios
- Verify event emission and prop handling

## Removed Components Reference

The following components were removed during cleanup and should not be referenced:

### Unused Components (Removed)
- `FileExplorerNas.vue` (Admin)
- `EnhancedFileBrowser.vue` (User)
- `FileBrowser.vue` (User)
- `FilePreviewModal.vue` (Shared)
- `FileUpload.vue` (Shared)
- `NewItemModal.vue` (Shared)
- `ShareModal.vue` (Shared)
- `SkeletonLoader.vue` (Shared)
- `SyncStatus.vue` (Shared)
- `ToastNotifications.vue` (Shared)
- `VirtualList.vue` (Shared)
- `UploadModal.vue` (Admin)

### Duplicate Components (Consolidated)
- `CreateFolderModal.vue` (Admin) → Use Shared version
- `DeleteConfirmModal.vue` (Admin) → Use Shared version
- `RenameModal.vue` (Admin) → Use Shared version

If you need functionality from any removed component, check if it's available in the remaining components or consider implementing it as a new component following the established patterns.