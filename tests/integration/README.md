# Integration Tests for Favorites Navigation Fix

This directory contains comprehensive integration tests for the favorites navigation fix implementation.

## Test Coverage

### Requirements Tested

- **1.1**: Navigation to exact favorite path
- **1.2**: Automatic tab selection during navigation
- **1.3**: FileExplorer content display
- **1.4**: Navigation confirmation notifications
- **4.1**: Navigation history updates with new paths
- **4.2**: Back/Forward button functionality
- **4.3**: History navigation functionality
- **4.4**: Path normalization in history
- **6.1**: Personal activity logs display
- **6.4**: Pagination functionality for logs

### Test Files

#### 1. `favorites-navigation.test.js`
Tests the complete end-to-end flow of favorites navigation:
- Navigation from FavoritesPanel to FileExplorer
- Different folder types (accessible, restricted, non-existent)
- Error handling and notifications
- Force refresh scenarios
- Sidebar integration

#### 2. `activity-logs.test.js`
Tests activity logs functionality with real data:
- Backend format compatibility (`{ logs: [...] }`)
- Frontend format compatibility (`{ items: [...] }`)
- Direct array format handling
- Date formatting and localization
- Error handling and retry functionality
- Pagination integration
- Loading states and empty states

#### 3. `navigation-history.test.js`
Tests navigation history management:
- History updates during favorite navigation
- Back/Forward button states and functionality
- Path normalization to prevent duplicates
- Complex navigation scenarios
- History size limitations
- Mixed navigation sources (favorites, breadcrumbs, manual)

#### 4. `test-runner.js`
Orchestrates all integration tests and provides:
- Test configuration and setup
- Global test utilities
- Requirements coverage validation
- Test reporting and summary

## Running the Tests

### Run All Integration Tests
```bash
npm run test:integration
```

### Run Specific Test Suites
```bash
# Favorites navigation tests only
npm run test:favorites-navigation

# Activity logs tests only
npm run test:activity-logs

# Navigation history tests only
npm run test:navigation-history
```

### Watch Mode for Development
```bash
npm run test:integration:watch
```

### Run with Detailed Output
```bash
npx vitest run tests/integration --reporter=verbose --no-coverage
```

## Test Structure

Each test file follows this structure:

1. **Setup**: Mock services, create test store, configure components
2. **Test Cases**: Organized by functionality with descriptive names
3. **Assertions**: Verify both component state and user-visible behavior
4. **Cleanup**: Proper teardown to prevent test interference

## Mock Data

Tests use realistic mock data that represents:
- Valid accessible favorites
- Invalid/non-existent favorites  
- Restricted favorites (permission denied)
- Various activity log formats
- File system structures

## Key Testing Patterns

### Component Integration
Tests mount complete component trees (User → Sidebar → FavoritesPanel → FileExplorer) to verify real integration behavior.

### Async Handling
All tests properly handle Vue's reactivity system with `nextTick()` and async operations.

### Error Scenarios
Comprehensive error testing including:
- Network failures
- Permission errors
- Invalid data formats
- Edge cases

### Event Flow Testing
Verifies complete event chains:
1. User action (click favorite)
2. Component event emission
3. Parent component handling
4. State updates
5. UI updates
6. Notifications

## Debugging Tests

### Enable Console Output
Uncomment console restoration in test files to see debug output:
```javascript
// console.log = global.originalConsoleLog
```

### Run Single Test
```bash
npx vitest run -t "should navigate to favorite folder successfully"
```

### Debug Mode
```bash
npx vitest run tests/integration --reporter=verbose --no-coverage --run
```

## Test Data Validation

Tests verify:
- Component props and state
- Event emissions and handling
- API call parameters
- Store state changes
- DOM updates and user-visible changes
- Notification content and timing

## Performance Considerations

Integration tests are designed to:
- Run efficiently in CI/CD environments
- Avoid unnecessary DOM operations
- Use appropriate timeouts for async operations
- Clean up resources properly

## Maintenance

When updating components:
1. Update corresponding test mocks
2. Verify test assertions still match expected behavior
3. Add tests for new functionality
4. Update requirement coverage documentation

## Troubleshooting

### Common Issues

1. **Tests timing out**: Increase timeout in vitest config or add more `await nextTick()` calls
2. **Mock not working**: Verify mock is set up before component mount
3. **Store state issues**: Ensure store is properly reset between tests
4. **Component not updating**: Check that reactive dependencies are properly triggered

### Debug Checklist

- [ ] All mocks are properly configured
- [ ] Component is mounted with correct props
- [ ] Store is in expected initial state
- [ ] Async operations are properly awaited
- [ ] Event emissions are verified
- [ ] DOM updates are checked after state changes