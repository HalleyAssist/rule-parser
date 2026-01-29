const { ParsingError } = require('./ParsingError');
const { RuleParseError } = require('./RuleParseError');

/**
 * Analyzes parsing errors and maps them to user-friendly error codes
 */
class ErrorAnalyzer {
  /**
   * Analyze a failed parse and return a user-friendly RuleParseError
   * @param {string} input - The input string that failed to parse
   * @returns {RuleParseError} - A user-friendly error with error code
   */
  static analyzeParseFailure(input) {
    const trimmedInput = input.trim();
    
    // Calculate position information
    const lines = trimmedInput.split('\n');
    const line = lines.length;
    const lastLine = lines[lines.length - 1] || '';
    const column = lastLine.length + 1;
    const offset = trimmedInput.length;
    
    const position = { line, column, offset };
    
    // Get snippet (last 50 chars or the whole input if shorter)
    const snippetStart = Math.max(0, trimmedInput.length - 50);
    const snippet = (snippetStart > 0 ? '...' : '') + trimmedInput.substring(snippetStart);
    
    // Analyze the error pattern
    const errorInfo = this._detectErrorPattern(trimmedInput, position, snippet);
    
    return new RuleParseError(
      errorInfo.code,
      errorInfo.message,
      errorInfo.hint,
      position,
      errorInfo.found,
      errorInfo.expected,
      snippet
    );
  }

  /**
   * Detect the error pattern in the input
   * @private
   */
  static _detectErrorPattern(input, position, snippet) {
    // Check for unterminated string first (this affects other checks)
    if (this._hasUnterminatedString(input)) {
      return {
        code: "UNTERMINATED_STRING",
        message: "Unterminated string literal.",
        hint: "String literals must be enclosed in double quotes, e.g. \"hello world\".",
        found: "end of input",
        expected: ["\""]
      };
    }

    // Check for dangling logical operators
    const danglingOp = this._findDanglingLogicalOperator(input);
    if (danglingOp) {
      return {
        code: "DANGLING_LOGICAL_OPERATOR",
        message: `Logical operator '${danglingOp}' at end of expression.`,
        hint: "Logical operators (&&, ||, AND, OR) must be followed by an expression.",
        found: danglingOp,
        expected: ["expression", "function call", "value"]
      };
    }

    // Check for missing RHS after comparison operator
    const danglingCompOp = this._findDanglingComparisonOperator(input);
    if (danglingCompOp) {
      return {
        code: "MISSING_RHS_AFTER_OPERATOR",
        message: `Expected a value after '${danglingCompOp}'.`,
        hint: "Comparison operators must be followed by a value, e.g. temp > 25, name == \"bob\".",
        found: "end of input",
        expected: ["value", "function call", "number", "string"]
      };
    }

    // Check for bad BETWEEN syntax
    if (this._hasBadBetweenSyntax(input)) {
      return {
        code: "BAD_BETWEEN_SYNTAX",
        message: "Invalid BETWEEN syntax.",
        hint: "BETWEEN requires two values: 'expr BETWEEN value1 AND value2' or 'expr BETWEEN value1-value2'.",
        found: "incomplete BETWEEN expression",
        expected: ["BETWEEN value1 AND value2"]
      };
    }

    // Check for bad function call syntax (more specific than general paren check)
    if (this._hasBadFunctionCall(input)) {
      return {
        code: "BAD_FUNCTION_CALL",
        message: "Invalid function call syntax.",
        hint: "Function calls must have matching parentheses, e.g. func() or func(arg1, arg2).",
        found: "incomplete function call",
        expected: [")"]
      };
    }

    // Check for bad array syntax (more specific than general bracket check)
    if (this._hasBadArraySyntax(input)) {
      return {
        code: "BAD_ARRAY_SYNTAX",
        message: "Invalid array syntax.",
        hint: "Arrays must be enclosed in brackets with comma-separated values, e.g. [1, 2, 3].",
        found: "incomplete array",
        expected: ["]", ","]
      };
    }

    // Check for unmatched parentheses (general check)
    const parenBalance = this._checkParenBalance(input);
    if (parenBalance > 0) {
      return {
        code: "UNMATCHED_PAREN",
        message: "Unclosed parenthesis detected.",
        hint: "Every opening '(' must have a matching closing ')'. Check your expression for missing closing parentheses.",
        found: "end of input",
        expected: [")"]
      };
    } else if (parenBalance < 0) {
      const closeIndex = this._findExtraCloseParen(input);
      return {
        code: "UNMATCHED_PAREN",
        message: "Extra closing parenthesis detected.",
        hint: "Every closing ')' must have a matching opening '('. Remove the extra closing parenthesis.",
        found: ")",
        expected: ["expression", "operator"]
      };
    }

    // Check for unmatched brackets (general check)
    const bracketBalance = this._checkBracketBalance(input);
    if (bracketBalance > 0) {
      return {
        code: "UNMATCHED_BRACKET",
        message: "Unclosed bracket detected.",
        hint: "Every opening '[' must have a matching closing ']'. Check your array syntax.",
        found: "end of input",
        expected: ["]"]
      };
    } else if (bracketBalance < 0) {
      return {
        code: "UNMATCHED_BRACKET",
        message: "Extra closing bracket detected.",
        hint: "Every closing ']' must have a matching opening '['. Remove the extra closing bracket.",
        found: "]",
        expected: ["expression", "operator"]
      };
    }

    // Check for empty or missing expression
    if (!input.trim() || input.trim().length === 0) {
      return {
        code: "MISSING_EXPRESSION",
        message: "Empty or missing expression.",
        hint: "Provide a valid rule expression.",
        found: "empty input",
        expected: ["expression"]
      };
    }

    // Check for multiple expressions without logical operators
    if (this._hasMultipleExpressionsWithoutOperator(input)) {
      return {
        code: "UNEXPECTED_TOKEN",
        message: "Multiple expressions without logical operator.",
        hint: "Use logical operators (&&, ||, AND, OR) to combine multiple expressions.",
        found: "expression",
        expected: ["&&", "||", "AND", "OR"]
      };
    }

    // Default to unexpected token
    const found = this._getLastToken(input) || "unknown token";
    return {
      code: "UNEXPECTED_TOKEN",
      message: `Unexpected token: ${found}`,
      hint: "Check your syntax. Common issues include missing operators, invalid characters, or malformed expressions.",
      found: found,
      expected: ["valid expression"]
    };
  }

  static _checkParenBalance(input) {
    let balance = 0;
    let inString = false;
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      const prevChar = i > 0 ? input[i - 1] : '';
      
      // Track string context
      if (char === '"' && prevChar !== '\\') {
        inString = !inString;
      }
      
      // Only count parentheses outside of strings
      if (!inString) {
        if (char === '(') balance++;
        else if (char === ')') balance--;
      }
    }
    return balance;
  }

  static _findExtraCloseParen(input) {
    let balance = 0;
    let inString = false;
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      const prevChar = i > 0 ? input[i - 1] : '';
      
      if (char === '"' && prevChar !== '\\') {
        inString = !inString;
      }
      
      if (!inString) {
        if (char === '(') balance++;
        else if (char === ')') {
          balance--;
          if (balance < 0) return i;
        }
      }
    }
    return -1;
  }

  static _checkBracketBalance(input) {
    let balance = 0;
    let inString = false;
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      const prevChar = i > 0 ? input[i - 1] : '';
      
      if (char === '"' && prevChar !== '\\') {
        inString = !inString;
      }
      
      if (!inString) {
        if (char === '[') balance++;
        else if (char === ']') balance--;
      }
    }
    return balance;
  }

  static _hasUnterminatedString(input) {
    let inString = false;
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      const prevChar = i > 0 ? input[i - 1] : '';
      
      if (char === '"' && prevChar !== '\\') {
        inString = !inString;
      }
    }
    return inString;
  }

  static _findDanglingLogicalOperator(input) {
    const trimmed = input.trim();
    const logicalOps = [
      { pattern: /&&\s*$/, op: '&&' },
      { pattern: /\|\|\s*$/, op: '||' },
      { pattern: /\bAND\s*$/i, op: 'AND' },
      { pattern: /\bOR\s*$/i, op: 'OR' }
    ];
    
    for (const { pattern, op } of logicalOps) {
      if (pattern.test(trimmed)) {
        return op;
      }
    }
    return null;
  }

  static _findDanglingComparisonOperator(input) {
    const trimmed = input.trim();
    const compOps = ['>=', '<=', '==', '!=', '>', '<', '=', '==~', '!=~'];
    
    for (const op of compOps) {
      const pattern = new RegExp(`${this._escapeRegex(op)}\\s*$`);
      if (pattern.test(trimmed)) {
        return op;
      }
    }
    return null;
  }

  static _hasBadBetweenSyntax(input) {
    const upperInput = input.toUpperCase();
    // Check if BETWEEN keyword exists but not followed by proper syntax
    if (/\bBETWEEN\b/i.test(input)) {
      // Very basic check - if we have BETWEEN but parsing failed, it's likely bad syntax
      // More sophisticated checks could be added here
      return !(/\bBETWEEN\s+.+\s+AND\s+.+/i.test(input) || /\bBETWEEN\s+.+-\s*.+/i.test(input));
    }
    return false;
  }

  static _hasBadFunctionCall(input) {
    // Only return true if:
    // 1. We have a function pattern (identifier followed by open paren)
    // 2. The parentheses are unbalanced
    // 3. There are NO array brackets (so we don't confuse arrays with function calls)
    // 4. The imbalance is specifically in a function call context
    
    const funcPattern = /[a-zA-Z0-9]+\s*\(/;
    const hasArrayBracket = /\[/.test(input);
    
    if (!funcPattern.test(input) || hasArrayBracket) {
      return false;
    }
    
    const parenBalance = this._checkParenBalance(input);
    if (parenBalance > 0) {
      // We have unclosed parens in what looks like a function call
      // Make sure it's not just a general parenthesis expression
      // by checking if the first occurrence of ( is preceded by an identifier
      const firstParenMatch = input.match(/^[^(]*([a-zA-Z0-9]+)\s*\(/);
      if (firstParenMatch) {
        return true;
      }
    }
    
    return false;
  }

  static _hasBadArraySyntax(input) {
    // Only return true if:
    // 1. We have an array bracket [
    // 2. The brackets are unbalanced
    // 3. It's clearly in an array context (inside function args or standalone)
    
    if (!/\[/.test(input)) {
      return false;
    }
    
    const bracketBalance = this._checkBracketBalance(input);
    if (bracketBalance > 0) {
      // We have unclosed brackets - this is likely an array issue
      return true;
    }
    
    return false;
  }

  static _hasMultipleExpressionsWithoutOperator(input) {
    // Detect patterns like "A() B()" without && or || between them
    // This is a simplified check
    const funcPattern = /\)\s+[a-zA-Z]/;
    if (funcPattern.test(input)) {
      // Check if there's no logical operator between
      const betweenPattern = /\)\s+(?!&&|\|\||AND|OR|BETWEEN|and|or|between)[a-zA-Z]/i;
      return betweenPattern.test(input);
    }
    return false;
  }

  static _getLastToken(input) {
    const trimmed = input.trim();
    // Get last 20 characters or the whole string if shorter
    const lastPart = trimmed.substring(Math.max(0, trimmed.length - 20));
    return lastPart;
  }

  static _escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

module.exports = { ErrorAnalyzer };
