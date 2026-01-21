# Test Organization

This directory contains comprehensive tests for the rule-parser. The tests have been organized into focused, logical groups for better maintainability and clarity.

## Test Files

### Core Functionality

- **`basic_parsing.test.js`** - Basic parsing operations
  - Simple comparisons and operators
  - Function calls
  - Arrays
  - Approximate equality operators
  
- **`value_types.test.js`** - Value type parsing
  - Numbers (integers, decimals, scientific notation, negative)
  - Strings
  - Booleans (TRUE/FALSE)
  - Arrays (empty, nested, mixed types)

- **`arithmetic.test.js`** - Arithmetic operations
  - Basic operators (+, -, *, /, %, ??)
  - Operator precedence
  - Arithmetic restrictions (what can/cannot be used)
  - Default value operator

### Operators

- **`logical_operators.test.js`** - Logical operations
  - AND, OR, NOT operators
  - Parenthesis grouping
  - Complex combined expressions
  - Operator precedence

- **`between_operator.test.js`** - BETWEEN operator
  - Numeric ranges
  - Time of day ranges
  - Time unit ranges
  - IS BETWEEN syntax
  - Dash separator syntax

### Time Handling

- **`time_periods.test.js`** - Time periods and units
  - Time units (second, minute, hour, day, week)
  - Time period constants (today)
  - Time period between expressions
  - AGO expressions
  - Composite time expressions
  - Function calls with time arguments

- **`dow_filters.test.js`** - Day-of-week filters
  - Single day filters
  - Day ranges (MONDAY TO FRIDAY)
  - All day names (full and abbreviated)
  - DOW filters with time periods
  - DOW filters with time units

### Edge Cases and Testing

- **`edge_cases.test.js`** - Special scenarios
  - Whitespace handling
  - Deeply nested parenthesis
  - Zero and extreme values
  - Function names with numbers
  - Default operator edge cases

- **`case_insensitivity.test.js`** - Case handling
  - Case variations for all keywords (AND, OR, NOT, BETWEEN, IS, TRUE, FALSE)
  - Case variations for time units
  - Case variations for time period constants
  - Mixed case in complex expressions

- **`error_handling.test.js`** - Error cases and validation
  - Invalid time of day formats
  - Invalid day of week names
  - Empty expressions
  - Operator precedence edge cases
  - Time value boundaries
  - Nested function calls
  - Approximate equality edge cases
  - String and array edge cases

## Test Statistics

- **Total tests**: 252 (219 original + 33 new)
- **Test files**: 10 focused modules
- **Original file size**: 1442 lines
- **New structure**: ~1730 lines (with better organization and new tests)

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx mocha test/basic_parsing.test.js
```

## Test Coverage Areas

The test suite covers:
- ✅ Basic parsing and operators
- ✅ Value types (numbers, strings, booleans, arrays)
- ✅ Arithmetic operations and restrictions
- ✅ Logical operators (AND, OR, NOT)
- ✅ BETWEEN operator variations
- ✅ Time periods and units
- ✅ Day-of-week filters
- ✅ Case insensitivity
- ✅ Edge cases and error handling
- ✅ Whitespace handling
- ✅ Nested expressions
- ✅ Complex combined rules

## Adding New Tests

When adding new tests:
1. Choose the appropriate test file based on the feature being tested
2. Follow the existing test naming conventions
3. Use descriptive test names that explain what is being tested
4. Include comments for complex or non-obvious test cases
5. Ensure tests are independent and can run in any order
