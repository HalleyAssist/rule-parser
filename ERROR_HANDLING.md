# Parser Error Handling

The rule parser now provides comprehensive error handling with user-friendly error messages, hints, and error codes for programmatic handling.

## Error Classes

### ParsingError

The `ParsingError` class is provided by the [node-ebnf](https://github.com/HalleyAssist/node-ebnf) library and contains low-level parsing failure information:

```javascript
{
  position: {
    line: number,     // Line number where error occurred
    column: number,   // Column number where error occurred  
    offset: number    // Character offset from start
  },
  expected: string[], // Array of expected tokens
  found: string       // What was found instead
}
```

Note: The parser catches `ParsingError` internally and converts it to a more user-friendly `RuleParseError`.

### RuleParseError

All parsing errors are thrown as `RuleParseError` instances with the following properties:

```javascript
{
  code: string,        // Error code for programmatic handling
  message: string,     // Human-readable error message
  hint: string,        // Helpful suggestion for fixing the error
  line: number,        // Line number where error occurred
  column: number,      // Column number where error occurred
  offset: number,      // Character offset from start
  found: string,       // What was found at error position
  expected: string[],  // What was expected
  snippet: string      // Code snippet showing error location
}
```

## Error Codes

| Code | Description | Example |
|------|-------------|---------|
| `UNMATCHED_PAREN` | Unclosed or extra parentheses | `(A() && B()` |
| `UNMATCHED_BRACKET` | Unclosed or extra brackets | `A([1, 2)` |
| `UNTERMINATED_STRING` | String missing closing quote | `A("hello` |
| `MISSING_EXPRESSION` | Empty or whitespace-only input | ` ` |
| `DANGLING_LOGICAL_OPERATOR` | Logical operator at end | `A() &&` |
| `MISSING_RHS_AFTER_OPERATOR` | Comparison without value | `temp >` |
| `BAD_BETWEEN_SYNTAX` | Incomplete BETWEEN | `A() BETWEEN` |
| `BAD_FUNCTION_CALL` | Malformed function call | `func(arg` |
| `BAD_ARRAY_SYNTAX` | Malformed array | `A([1, 2` |
| `BAD_TOD` | Invalid time of day | `A() BETWEEN 25:00 AND 23:00` |
| `BAD_DOW` | Invalid day of week | `A(BETWEEN 01:00 AND 03:00 ON FUNDAY)` |
| `BAD_NUMBER` | Invalid number format | `A(1.2.3)` or `A(123abc)` |
| `UNEXPECTED_TOKEN` | Other syntax errors | `A() B()` |

## Usage Examples

### Basic Error Handling

```javascript
const RuleParser = require('@halleyassist/rule-parser');

try {
  const ast = RuleParser.toIL('A(');
} catch (error) {
  if (error instanceof RuleParser.RuleParseError) {
    console.log(`Error [${error.code}]: ${error.message}`);
    console.log(`Hint: ${error.hint}`);
    console.log(`Location: line ${error.line}, column ${error.column}`);
  }
}
```

### Programmatic Error Handling

```javascript
try {
  const ast = RuleParser.toIL(userInput);
} catch (error) {
  switch (error.code) {
    case 'UNMATCHED_PAREN':
      // Handle unmatched parentheses
      break;
    case 'UNTERMINATED_STRING':
      // Handle unterminated strings
      break;
    default:
      // Handle other errors
  }
}
```

### Getting Error as JSON

```javascript
try {
  const ast = RuleParser.toIL('A(');
} catch (error) {
  const errorData = error.toJSON();
  // Send to logging service, API, etc.
  console.log(JSON.stringify(errorData, null, 2));
}
```

### Display User-Friendly Error

```javascript
try {
  const ast = RuleParser.toIL(userInput);
} catch (error) {
  // Show formatted error to user
  console.log(error.toString());
  
  // Example output:
  // RuleParseError [BAD_FUNCTION_CALL]: Invalid function call syntax.
  //   at line 1, column 3 (offset 2)
  //   A(
  //   Hint: Function calls must have matching parentheses, e.g. func() or func(arg1, arg2).
  //   Found: incomplete function call
  //   Expected: )
}
```

## Error Detection Features

- **Smart String Handling**: Correctly ignores parentheses, brackets, and quotes inside string literals
- **Escape Sequence Support**: Properly handles escaped quotes and backslashes in strings
- **Position Information**: Provides accurate line, column, and offset for error location
- **Context-Aware**: Distinguishes between similar errors (e.g., unmatched paren vs bad function call)
- **Helpful Hints**: Each error includes a hint to help users fix the problem

## Testing

The implementation includes comprehensive tests covering all error codes:

```bash
npm test -- test/parser_errors.test.js
```

All 328 tests (287 existing + 41 new) pass without regression.
