// TypeScript type checking exercise file
// This file demonstrates how to use the type definitions
// It is not a runtime test - it's checked with: tsc --noEmit test/types.test.ts

import RuleParser, { RuleParseError, ParsingError, ILExpression } from '../index';

// Test basic toAst
const ast = RuleParser.toAst('1 > 2');
console.log(ast.type);
console.log(ast.text);

// Test toIL with simple comparison
const il1: ILExpression = RuleParser.toIL('1 > 2');

// Test toIL with function call
const il2: ILExpression = RuleParser.toIL('AFunction(1, 2) > 3');

// Test toIL with logical operators
const il3: ILExpression = RuleParser.toIL('AFunction(1) > 2 AND BFunction() < 5');

// Test toIL with BETWEEN
const il4: ILExpression = RuleParser.toIL('AFunc() BETWEEN 1 AND 5');

// Test toIL with time periods
const il5: ILExpression = RuleParser.toIL('Value() == TODAY');

// Test toIL with arithmetic
const il6: ILExpression = RuleParser.toIL('1 + 2 > 3');

// Test error handling
try {
  RuleParser.toIL('1 >');
} catch (e) {
  if (e instanceof RuleParseError) {
    console.log(e.code);
    console.log(e.message);
    console.log(e.hint);
    console.log(e.line);
    console.log(e.column);
    console.log(e.offset);
    console.log(e.found);
    console.log(e.expected);
    console.log(e.snippet);
    const json = e.toJSON();
    const str = e.toString();
  }
}

// Test that IL expressions can be destructured properly
const [op, left, right] = il1;
if (op === 'Gt') {
  console.log('Comparison operator');
}

// Test function call destructuring
const [funcName, ...args] = il2 as any;
if (typeof funcName === 'string') {
  console.log('Function name:', funcName);
}

// Test value expression
const valueExpr: ILExpression = ['Value', 42];
const [valueOp, value] = valueExpr;
if (valueOp === 'Value') {
  console.log('Value:', value);
}

// Test time of day value
const todValue: ILExpression = ['Value', { hours: 12, minutes: 30, tod: 1230 }];

// Test array value
const arrayValue: ILExpression = ['Value', [1, 2, 3]];

// Test time period
const timePeriod: ILExpression = ['TimePeriodConst', 'TODAY'];

// Test time period ago
const timePeriodAgo: ILExpression = ['TimePeriodConstAgo', 3600, 'HOURS'];

// Test time period between
const timePeriodBetween: ILExpression = ['TimePeriodBetween', 
  { hours: 8, minutes: 0, tod: 800 }, 
  { hours: 17, minutes: 0, tod: 1700 }
];

// Test between expression
const betweenExpr: ILExpression = ['Between', 
  ['Value', 10], 
  ['Value', 1], 
  ['Value', 100]
];

// Test not expression
const notExpr: ILExpression = ['Not', ['Value', true]];

// Test logical expression
const logicalExpr: ILExpression = ['And', 
  ['Gt', ['Value', 1], ['Value', 2]], 
  ['Lt', ['Value', 3], ['Value', 4]]
];

// Test arithmetic expression
const arithmeticExpr: ILExpression = ['MathAdd', 
  ['Value', 1], 
  ['Value', 2]
];

console.log('All type checks passed!');
