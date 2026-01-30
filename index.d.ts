// TypeScript definitions for @halleyassist/rule-parser

/**
 * Position information for errors
 */
export interface Position {
  line: number;
  column: number;
  offset: number;
}

/**
 * Rule parsing error with detailed error information
 */
export class RuleParseError extends Error {
  name: 'RuleParseError';
  code: string;
  hint: string;
  line: number;
  column: number;
  offset: number;
  found: string;
  expected: string[];
  snippet: string;

  constructor(
    code: string,
    message: string,
    hint: string,
    position: Position,
    found: string,
    expected: string[],
    snippet: string
  );

  toString(): string;
  toJSON(): {
    code: string;
    message: string;
    hint: string;
    line: number;
    column: number;
    offset: number;
    found: string;
    expected: string[];
    snippet: string;
  };
}

/**
 * Parsing error from the EBNF parser
 */
export class ParsingError extends Error {
  name: 'ParsingError';
}

/**
 * AST Node from the EBNF parser
 */
export interface ASTNode {
  type: string;
  text: string;
  children?: ASTNode[];
  parent?: ASTNode;
  [key: string]: any;
}

/**
 * Time of day value with hours and minutes
 */
export interface TimeOfDay {
  hours: number;
  minutes: number;
  tod: number;
  dow?: string;
}

/**
 * Primitive value types that can appear in the IL
 */
export type PrimitiveValue = string | number | boolean | TimeOfDay;

/**
 * Array value type
 */
export type ArrayValue = PrimitiveValue[];

/**
 * Any value that can appear in the IL
 */
export type ILValue = PrimitiveValue | ArrayValue;

/**
 * Value expression in the IL
 */
export type ValueExpression = ['Value', ILValue];

/**
 * Time period constant expression
 */
export type TimePeriodConst = ['TimePeriodConst', string];

/**
 * Time period constant ago expression
 */
export type TimePeriodConstAgo = ['TimePeriodConstAgo', number, string];

/**
 * Time period between expression
 */
export type TimePeriodBetween = 
  | ['TimePeriodBetween', TimeOfDay | number, TimeOfDay | number]
  | ['TimePeriodBetween', TimeOfDay | number, TimeOfDay | number, string]
  | ['TimePeriodBetween', TimeOfDay | number, TimeOfDay | number, string, string];

/**
 * Time period between ago expression
 */
export type TimePeriodBetweenAgo = ['TimePeriodBetweenAgo', number, TimeOfDay, TimeOfDay];

/**
 * Any time period expression
 */
export type TimePeriodExpression = 
  | TimePeriodConst 
  | TimePeriodConstAgo 
  | TimePeriodBetween 
  | TimePeriodBetweenAgo;

/**
 * Forward declaration for ILExpression to handle recursive types
 */
export type ILExpression = 
  | ValueExpression
  | TimePeriodExpression
  | FunctionCall
  | ComparisonExpression
  | LogicalExpression
  | ArithmeticExpression
  | BetweenExpression
  | NotExpression;

/**
 * Function call expression
 * Note: The first element is the function name (not an operator like 'Gt', 'And', etc.)
 * Functions can have zero or more arguments
 */
export type FunctionCall = [string, ...ILExpression[]];

/**
 * Comparison operators
 */
export type ComparisonOp = 'Gt' | 'Lt' | 'Gte' | 'Lte' | 'Eq' | 'Neq';

/**
 * Comparison expression
 */
export type ComparisonExpression = [ComparisonOp, ILExpression, ILExpression];

/**
 * Logical operators
 */
export type LogicalOp = 'And' | 'Or';

/**
 * Logical expression
 * Note: Logical operators require at least two operands
 */
export type LogicalExpression = [LogicalOp, ILExpression, ILExpression, ...ILExpression[]];

/**
 * Arithmetic operators
 */
export type ArithmeticOp = 'MathAdd' | 'MathSub' | 'MathDiv' | 'MathMul' | 'MathMod' | 'Default';

/**
 * Arithmetic expression
 */
export type ArithmeticExpression = [ArithmeticOp, ILExpression, ILExpression];

/**
 * Between expression
 */
export type BetweenExpression = ['Between', ILExpression, ILExpression, ILExpression];

/**
 * Not expression
 */
export type NotExpression = ['Not', ILExpression];

/**
 * Rule parser class
 */
declare class RuleParser {
  /**
   * Parse a rule string into an Abstract Syntax Tree (AST)
   * @param txt - The rule string to parse
   * @returns The AST node representing the parsed rule
   * @throws {RuleParseError} If the rule string is invalid
   */
  static toAst(txt: string): ASTNode;

  /**
   * Parse a rule string into an Intermediate Language (IL) representation
   * @param txt - The rule string to parse
   * @returns The IL expression representing the parsed rule
   * @throws {RuleParseError} If the rule string is invalid
   */
  static toIL(txt: string): ILExpression;
}

export default RuleParser;
export { RuleParser };
