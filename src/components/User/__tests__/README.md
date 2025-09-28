# ActivityLogs Component Tests

## Overview

This directory contains comprehensive unit tests for the `ActivityLogs.vue` component, which handles displaying user activity logs with pagination and error handling.

## Test Coverage

The test suite covers all major functionality areas as specified in the requirements:

### 1. Data Loading with Different Formats (Requirements 6.1, 6.4)
- **Backend format**: `{ logs: [...], total: ... }`
- **Frontend format**: `{ items: [...], total: ... }`
- **Direct array format**: `[...]`
- **Empty data handling**
- **Unrecognized format handling**
- **Invalid log entry filtering**

### 2. Error Handling (Requirements 8.1, 8.2, 8.3)
- **HTTP error codes**: 404, 403, 500
- **Network errors**: Connection issues
- **Custom error messages**: From API responses
- **Generic error fallbacks**
- **Retry functionality**: After errors occur

### 3. Pagination (Requirements 6.4)
- **Page calculation**: Total pages based on data count
- **Navigation controls**: Previous/Next buttons
- **Boundary handling**: Cannot go below page 1 or above max page
- **Loading state**: Prevents navigation during API calls
- **Single page scenarios**: Proper display when only one page exists

### 4. Data Formatting (Requirements 7.1, 7.2, 7.3)
- **Action formatting**: Maps action codes to readable French text
- **Date formatting**: Handles various date formats and invalid dates
- **Target information**: Displays file/folder names and handles missing data
- **Fallback handling**: Graceful degradation for missing information

### 5. UI States
- **Loading state**: Shows spinner and loading message
- **Error state**: Displays error messages with retry button
- **Empty state**: Shows informative message when no logs exist
- **Data state**: Displays logs with pagination when data is available

### 6. Integration Tests
- **Complete flow**: End-to-end functionality testing
- **Error recovery**: Testing retry mechanisms
- **Pagination flow**: Multi-page navigation scenarios

## Test Structure

```
ActivityLogs.test.js
├── Component Initialization
├── Data Loading - Different Formats
├── Error Handling
├── Pagination
├── Data Formatting
├── Action Formatting
├── Date Formatting
├── UI States
└── Integration Tests
```

## Key Features Tested

1. **Robust Data Parsing**: Handles multiple backend response formats
2. **Comprehensive Error Handling**: Covers all error scenarios with appropriate messages
3. **Pagination Logic**: Ensures proper navigation and boundary checking
4. **Data Formatting**: Validates French localization and date formatting
5. **UI State Management**: Tests all possible component states
6. **Integration Scenarios**: End-to-end workflow validation

## Running Tests

```bash
# Run all ActivityLogs tests
npm test -- ActivityLogs.test.js

# Run tests in watch mode
npm test -- ActivityLogs.test.js --watch

# Run tests with coverage
npm test -- ActivityLogs.test.js --coverage
```

## Requirements Mapping

- **6.1**: User activity log display ✅
- **6.4**: Pagination and error handling ✅
- **7.1**: Action formatting ✅
- **7.2**: Target information display ✅
- **7.3**: Date formatting ✅
- **8.1**: Loading indicators ✅
- **8.2**: Error messages ✅
- **8.3**: Retry functionality ✅

All specified requirements have been thoroughly tested with comprehensive test cases covering both happy path and edge case scenarios.