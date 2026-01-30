# TypeScript Support

This package includes TypeScript type declarations for the RuleParser API.

## Using with TypeScript

The type declarations are automatically available when you install the package:

```typescript
import RuleParser, { RuleParseError, ILExpression } from '@halleyassist/rule-parser';

// Parse a rule string to IL
const il: ILExpression = RuleParser.toIL('temperature > 25');

// Handle errors with proper types
try {
  const result = RuleParser.toIL('invalid rule >');
} catch (error) {
  if (error instanceof RuleParseError) {
    console.error(`Error [${error.code}]: ${error.message}`);
    console.error(`Hint: ${error.hint}`);
  }
}
```

## Available Types

### Main API
- `RuleParser.toAst(txt: string): ASTNode` - Parse to Abstract Syntax Tree
- `RuleParser.toIL(txt: string): ILExpression` - Parse to Intermediate Language

### Error Types
- `RuleParseError` - User-friendly error with error codes and helpful hints
- `ParsingError` - Low-level EBNF parsing error

### IL Expression Types
The IL (Intermediate Language) is a tree structure representing the parsed rule:
- `ValueExpression` - Simple values (numbers, strings, booleans, arrays)
- `FunctionCall` - Function calls with arguments
- `ComparisonExpression` - Comparison operators (>, <, ==, etc.)
- `LogicalExpression` - Logical operators (AND, OR)
- `ArithmeticExpression` - Arithmetic operators (+, -, *, /, %)
- `BetweenExpression` - BETWEEN operator
- `NotExpression` - NOT operator
- `TimePeriodExpression` - Time period constants and ranges

## Type Checking

To verify your TypeScript code:

```bash
npx tsc --noEmit your-file.ts
```

For more examples, see the test files in `test/types.test.ts` and `test/integration.test.ts`.
