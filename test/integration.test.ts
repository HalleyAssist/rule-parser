// TypeScript integration test
// This file demonstrates real-world usage of the type definitions

import RuleParser, { RuleParseError, ILExpression } from '../index';

function parseAndValidateRule(ruleText: string): ILExpression {
  try {
    const il = RuleParser.toIL(ruleText);
    return il;
  } catch (error) {
    if (error instanceof RuleParseError) {
      console.error(`Parse error [${error.code}]: ${error.message}`);
      console.error(`  at line ${error.line}, column ${error.column}`);
      console.error(`  Hint: ${error.hint}`);
      throw error;
    }
    throw error;
  }
}

// Type guard to check if an IL expression is a comparison
function isComparison(expr: ILExpression): expr is ['Gt' | 'Lt' | 'Gte' | 'Lte' | 'Eq' | 'Neq', ILExpression, ILExpression] {
  return Array.isArray(expr) && ['Gt', 'Lt', 'Gte', 'Lte', 'Eq', 'Neq'].includes(expr[0] as string);
}

// Type guard to check if an IL expression is a logical operator
function isLogical(expr: ILExpression): expr is ['And' | 'Or', ...ILExpression[]] {
  return Array.isArray(expr) && ['And', 'Or'].includes(expr[0] as string);
}

// Type guard to check if an IL expression is a value
function isValue(expr: ILExpression): expr is ['Value', any] {
  return Array.isArray(expr) && expr[0] === 'Value';
}

// Example usage
const rule1 = parseAndValidateRule('temperature > 25');
if (isComparison(rule1)) {
  const [op, left, right] = rule1;
  console.log(`Comparison: ${op}`);
}

const rule2 = parseAndValidateRule('temperature > 25 AND humidity < 80');
if (isLogical(rule2)) {
  const [op, ...operands] = rule2;
  console.log(`Logical: ${op}, operands: ${operands.length}`);
}

console.log('TypeScript integration test passed!');
