# NAS Frontend Application

A Vue 3 + Vite application for NAS (Network Attached Storage) management with separate Admin and User interfaces.

## Overview

This application provides a web-based interface for managing files, users, groups, and permissions on a NAS system. It features role-based access control with distinct Admin and User dashboards.

## Architecture

- **Vue 3** with Composition API and `<script setup>` syntax
- **Vite** for fast development and optimized builds
- **Component-based architecture** with clear separation of concerns
- **Dynamic component loading** for dashboard views
- **Shared component library** for reusable UI elements

## Documentation

- **[Component Documentation](./COMPONENT_DOCUMENTATION.md)** - Comprehensive guide to all components
- **[Component Cleanup Summary](./COMPONENT_CLEANUP_SUMMARY.md)** - Recent cleanup and optimization results
- **[Performance Optimizations](./PERFORMANCE_OPTIMIZATIONS.md)** - Performance improvements and metrics
- **[Optimization README](./README_OPTIMIZATIONS.md)** - Additional optimization details

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── Admin/          # Admin-only components
│   ├── Shared/         # Reusable components
│   └── User/           # User-only components
├── views/              # Route-level components
├── services/           # API and utility services
├── store/              # State management
└── assets/             # Static assets
```

## Key Features

### Admin Interface
- User and group management
- Permission management
- System monitoring and performance dashboard
- Access logs and audit trails
- File system administration

### User Interface
- Personal file browser
- Profile management
- Storage quota monitoring
- Activity history

### Shared Features
- File operations (upload, download, rename, delete, move)
- Folder tree navigation
- Modal-based interactions
- Real-time notifications

## Development

Learn more about Vue 3 development:
- [Vue 3 Script Setup](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup)
- [Vue 3 IDE Support](https://vuejs.org/guide/scaling-up/tooling.html#ide-support)
- [Vite Documentation](https://vitejs.dev/)

## Component Guidelines

See [Component Documentation](./COMPONENT_DOCUMENTATION.md) for detailed information about:
- Component architecture and hierarchy
- Usage patterns and best practices
- Development guidelines
- API integration patterns
