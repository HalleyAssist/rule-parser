const { ParsingError } = require('ebnf');
const { RuleParseError } = require('./RuleParseError');

/**
 * Analyzes parsing errors and maps them to user-friendly error codes
 */
class ErrorAnalyzer {
  /**
   * Analyze a ParsingError and return a user-friendly RuleParseError
   * @param {string} input - The input string that failed to parse
   * @param {ParsingError} parsingError - The ParsingError from the parser (optional)
   * @returns {RuleParseError} - A user-friendly error with error code
   */
  static analyzeParseFailure(input, parsingError = null) {
    const trimmedInput = input.trim();
    
    // Check for empty or missing expression first (fast path)
    if (!trimmedInput) {
      const position = { line: 1, column: 1, offset: 0 };
      return new RuleParseError(
        "MISSING_EXPRESSION",
        "Empty or missing expression.",
        "Provide a valid rule expression.",
        position,
        "empty input",
        ["expression"],
        ""
      );
    }
    
    // If we have a ParsingError, use its information
    if (parsingError && parsingError instanceof ParsingError) {
      return this._analyzeFromParsingError(input, parsingError);
    }
    
    // Fallback to string-based analysis (for validation errors)
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
   * Analyze error using ParsingError exception data
   * @private
   */
  static _analyzeFromParsingError(input, err) {
    const position = err.position;
    const expected = err.expected || [];
    const found = err.found || '';
    const failureTree = err.failureTree || [];
    
    // Get snippet around error position
    const snippetStart = Math.max(0, position.offset - 20);
    const snippetEnd = Math.min(input.length, position.offset + 30);
    const snippet = (snippetStart > 0 ? '...' : '') + 
                    input.substring(snippetStart, snippetEnd) +
                    (snippetEnd < input.length ? '...' : '');
    
    // Analyze what was expected to determine error type using failureTree
    const errorInfo = this._detectErrorFromFailureTree(input, position, expected, found, failureTree);
    
    return new RuleParseError(
      errorInfo.code,
      errorInfo.message,
      errorInfo.hint,
      position,
      found,
      expected,
      snippet
    );
  }

  /**
   * Detect error type from failureTree
   * @private
   */
  static _detectErrorFromFailureTree(input, position, expected, found, failureTree) {
    const beforeError = input.substring(0, position.offset);
    
    // Helper to check if a name exists in the failure tree
    const hasFailure = (name) => {
      const search = (nodes) => {
        if (!Array.isArray(nodes)) return false;
        for (const node of nodes) {
          if (node.name === name) return true;
          if (node.children && search(node.children)) return true;
        }
        return false;
      };
      return search(failureTree);
    };
    
    // Helper to check if a name exists at top level only
    const hasTopLevelFailure = (name) => {
      if (!Array.isArray(failureTree)) return false;
      return failureTree.some(node => node.name === name);
    };
    
    // Check for bad number format first
    const badNum = this._findBadNumber(input);
    if (badNum) {
      return {
        code: "BAD_NUMBER",
        message: `Invalid number format: ${badNum}`,
        hint: "Numbers must be valid integers or decimals, e.g. 42, 3.14, -5, 1.5e10.",
      };
    }
    
    // Check for unterminated string - if the top level failure is 'string', check if it's unterminated
    if (hasTopLevelFailure('string') && found === "end of input") {
      if (this._hasUnterminatedString(input)) {
        return {
          code: "UNTERMINATED_STRING",
          message: "Unterminated string literal.",
          hint: "String literals must be enclosed in double quotes, e.g. \"hello world\".",
        };
      }
    }
    
    // Check if parser was expecting END_ARGUMENT (closing paren for function)
    if (hasFailure('END_ARGUMENT')) {
      return {
        code: "BAD_FUNCTION_CALL",
        message: "Invalid function call syntax.",
        hint: "Function calls must have matching parentheses, e.g. func() or func(arg1, arg2).",
      };
    }
    
    // Check if parser was expecting END_ARRAY (closing bracket)
    if (hasFailure('END_ARRAY')) {
      return {
        code: "BAD_ARRAY_SYNTAX",
        message: "Invalid array syntax.",
        hint: "Arrays must be enclosed in brackets with comma-separated values, e.g. [1, 2, 3].",
      };
    }
    
    // Check for dangling logical operator (expecting expression/statement at end of input)
    if ((hasFailure('expression') || hasFailure('statement')) && found === "end of input") {
      // Check if there's a logical operator before the error
      const trimmed = input.trim();
      if (/&&\s*$/.test(trimmed)) {
        return {
          code: "DANGLING_LOGICAL_OPERATOR",
          message: "Logical operator '&&' at end of expression.",
          hint: "Logical operators (&&, ||, AND, OR) must be followed by an expression.",
        };
      }
      if (/\|\|\s*$/.test(trimmed)) {
        return {
          code: "DANGLING_LOGICAL_OPERATOR",
          message: "Logical operator '||' at end of expression.",
          hint: "Logical operators (&&, ||, AND, OR) must be followed by an expression.",
        };
      }
      if (/\bAND\b\s*$/i.test(trimmed)) {
        return {
          code: "DANGLING_LOGICAL_OPERATOR",
          message: "Logical operator 'AND' at end of expression.",
          hint: "Logical operators (&&, ||, AND, OR) must be followed by an expression.",
        };
      }
      if (/\bOR\b\s*$/i.test(trimmed)) {
        return {
          code: "DANGLING_LOGICAL_OPERATOR",
          message: "Logical operator 'OR' at end of expression.",
          hint: "Logical operators (&&, ||, AND, OR) must be followed by an expression.",
        };
      }
    }
    
    // Check for BETWEEN - if we see BETWEEN in input and found end of input with WS failure
    if (/\bBETWEEN\b/i.test(input) && found === "end of input") {
      return {
        code: "BAD_BETWEEN_SYNTAX",
        message: "Invalid BETWEEN syntax.",
        hint: "BETWEEN requires two values: 'expr BETWEEN value1 AND value2' or 'expr BETWEEN value1-value2'.",
      };
    }
    
    // Check if parser expected BEGIN_ARGUMENT at top level and found is not alphabetic
    // This means parser thought something was a function but it's actually a comparison
    if (hasTopLevelFailure('BEGIN_ARGUMENT')) {
      const trimmed = beforeError.trim();
      // If found is a comparison operator, this is likely missing RHS
      if (found.match(/^[><=!]/)) {
        return {
          code: "MISSING_RHS_AFTER_OPERATOR",
          message: `Expected a value after '${found}'.`,
          hint: "Comparison operators must be followed by a value, e.g. temp > 25, name == \"bob\".",
        };
      }
      
      // Also check if beforeError ends with comparison operator
      const compOps = ['>=', '<=', '==', '!=', '>', '<', '=', '==~', '!=~'];
      for (const op of compOps) {
        if (trimmed.endsWith(op)) {
          return {
            code: "MISSING_RHS_AFTER_OPERATOR",
            message: `Expected a value after '${op}'.`,
            hint: "Comparison operators must be followed by a value, e.g. temp > 25, name == \"bob\".",
          };
        }
      }
    }
    
    // Check for value/result expected (could be missing RHS)
    if ((hasFailure('value') || hasFailure('result') || hasFailure('simple_result')) && found === "end of input") {
      // Check for comparison operator
      const trimmed = beforeError.trim();
      const compOps = ['>=', '<=', '==', '!=', '>', '<', '=', '==~', '!=~'];
      
      for (const op of compOps) {
        if (trimmed.endsWith(op)) {
          return {
            code: "MISSING_RHS_AFTER_OPERATOR",
            message: `Expected a value after '${op}'.`,
            hint: "Comparison operators must be followed by a value, e.g. temp > 25, name == \"bob\".",
          };
        }
      }
    }
    
    // General unmatched parentheses check
    const parenBalance = this._checkParenBalance(input);
    if (parenBalance > 0 && found === "end of input") {
      return {
        code: "UNMATCHED_PAREN",
        message: "Unclosed parenthesis detected.",
        hint: "Every opening '(' must have a matching closing ')'. Check your expression for missing closing parentheses.",
      };
    } else if (parenBalance < 0) {
      return {
        code: "UNMATCHED_PAREN",
        message: "Extra closing parenthesis detected.",
        hint: "Every closing ')' must have a matching opening '('. Remove the extra closing parenthesis.",
      };
    }
    
    // General unmatched brackets check
    const bracketBalance = this._checkBracketBalance(input);
    if (bracketBalance > 0 && found === "end of input") {
      return {
        code: "UNMATCHED_BRACKET",
        message: "Unclosed bracket detected.",
        hint: "Every opening '[' must have a matching closing ']'. Check your array syntax.",
      };
    } else if (bracketBalance < 0) {
      return {
        code: "UNMATCHED_BRACKET",
        message: "Extra closing bracket detected.",
        hint: "Every closing ']' must have a matching opening '['. Remove the extra closing bracket.",
      };
    }
    
    // Default to unexpected token
    const foundDesc = found === "end of input" ? "end of input" : `'${found}'`;
    return {
      code: "UNEXPECTED_TOKEN",
      message: `Unexpected ${foundDesc} at position ${position.offset}.`,
      hint: "Check your syntax. Common issues include missing operators, invalid characters, or malformed expressions.",
    };
  }

  /**
   * Detect the error pattern in the input (fallback for non-ParsingError cases)
   * @private
   * @param {string} input - The input to analyze
   * @param {Object} position - Position information
   * @param {string} snippet - Code snippet
   * @returns {Object} Error information
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

    // Check for bad time of day (TOD) format
    const badTod = this._findBadTimeOfDay(input);
    if (badTod) {
      return {
        code: "BAD_TOD",
        message: `Invalid time of day: ${badTod.value}`,
        hint: "Time of day must be in HH:MM format with hours 0-23 and minutes 0-59, e.g. 08:30, 14:00, 23:59.",
        found: badTod.value,
        expected: ["HH:MM"]
      };
    }

    // Check for bad day of week (DOW)
    const badDow = this._findBadDayOfWeek(input);
    if (badDow) {
      return {
        code: "BAD_DOW",
        message: `Invalid day of week: ${badDow}`,
        hint: "Valid days are: MONDAY/MON, TUESDAY/TUE, WEDNESDAY/WED, THURSDAY/THU, FRIDAY/FRI, SATURDAY/SAT, SUNDAY/SUN.",
        found: badDow,
        expected: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]
      };
    }

    // Check for bad number format
    const badNumber = this._findBadNumber(input);
    if (badNumber) {
      return {
        code: "BAD_NUMBER",
        message: `Invalid number format: ${badNumber}`,
        hint: "Numbers must be valid integers or decimals, e.g. 42, 3.14, -5, 1.5e10.",
        found: badNumber,
        expected: ["valid number"]
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

  /**
   * Check if string is properly terminated
   * @private
   * @param {string} input - Input to check
   * @returns {boolean} True if string is unterminated
   */
  static _hasUnterminatedString(input) {
    let inString = false;
    let i = 0;
    while (i < input.length) {
      const char = input[i];
      
      if (char === '"') {
        if (!inString) {
          inString = true;
        } else {
          // Check if this quote is escaped by counting preceding backslashes
          let backslashCount = 0;
          let j = i - 1;
          while (j >= 0 && input[j] === '\\') {
            backslashCount++;
            j--;
          }
          // If even number of backslashes (including 0), the quote is not escaped
          if (backslashCount % 2 === 0) {
            inString = false;
          }
        }
      }
      i++;
    }
    return inString;
  }

  /**
   * Check parenthesis balance
   * @private
   * @param {string} input - Input to check
   * @returns {number} Balance (positive = unclosed, negative = extra closing)
   */
  static _checkParenBalance(input) {
    let balance = 0;
    let inString = false;
    let i = 0;
    while (i < input.length) {
      const char = input[i];
      
      if (char === '"') {
        if (!inString) {
          inString = true;
        } else {
          // Check if this quote is escaped
          let backslashCount = 0;
          let j = i - 1;
          while (j >= 0 && input[j] === '\\') {
            backslashCount++;
            j--;
          }
          if (backslashCount % 2 === 0) {
            inString = false;
          }
        }
      }
      
      // Only count parentheses outside of strings
      if (!inString) {
        if (char === '(') balance++;
        else if (char === ')') balance--;
      }
      i++;
    }
    return balance;
  }

  /**
   * Find position of extra closing paren
   * @private
   */
  static _findExtraCloseParen(input) {
    let balance = 0;
    let inString = false;
    let i = 0;
    while (i < input.length) {
      const char = input[i];
      
      if (char === '"') {
        if (!inString) {
          inString = true;
        } else {
          // Check if this quote is escaped
          let backslashCount = 0;
          let j = i - 1;
          while (j >= 0 && input[j] === '\\') {
            backslashCount++;
            j--;
          }
          if (backslashCount % 2 === 0) {
            inString = false;
          }
        }
      }
      
      if (!inString) {
        if (char === '(') balance++;
        else if (char === ')') {
          balance--;
          if (balance < 0) return i;
        }
      }
      i++;
    }
    return -1;
  }

  /**
   * Check bracket balance
   * @private
   * @param {string} input - Input to check
   * @returns {number} Balance (positive = unclosed, negative = extra closing)
   */
  static _checkBracketBalance(input) {
    let balance = 0;
    let inString = false;
    let i = 0;
    while (i < input.length) {
      const char = input[i];
      
      if (char === '"') {
        if (!inString) {
          inString = true;
        } else {
          // Check if this quote is escaped
          let backslashCount = 0;
          let j = i - 1;
          while (j >= 0 && input[j] === '\\') {
            backslashCount++;
            j--;
          }
          if (backslashCount % 2 === 0) {
            inString = false;
          }
        }
      }
      
      if (!inString) {
        if (char === '[') balance++;
        else if (char === ']') balance--;
      }
      i++;
    }
    return balance;
  }

  static _findDanglingLogicalOperator(input) {
    const trimmed = input.trim();
    const logicalOps = [
      { pattern: /&&\s*$/, op: '&&' },
      { pattern: /\|\|\s*$/, op: '||' },
      { pattern: /\bAND\b\s*$/i, op: 'AND' },
      { pattern: /\bOR\b\s*$/i, op: 'OR' }
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
    // Check if BETWEEN keyword exists but not followed by proper syntax
    if (/\bBETWEEN\b/i.test(input)) {
      // Check for valid BETWEEN patterns
      const hasValidBetweenAnd = /\bBETWEEN\s+\S+\s+AND\s+\S+/i.test(input);
      const hasValidBetweenDash = /\bBETWEEN\s+\S+-\s*\S+/i.test(input);
      return !hasValidBetweenAnd && !hasValidBetweenDash;
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
    // Check if there's no logical operator between function calls
    const betweenPattern = /\)\s+(?!&&|\|\||AND|OR|BETWEEN)/i;
    if (betweenPattern.test(input)) {
      // Make sure the next thing after ) is an identifier (suggesting another expression)
      return /\)\s+[a-zA-Z]/.test(input);
    }
    return false;
  }

  static _getLastToken(input) {
    const trimmed = input.trim();
    // Get last 20 characters or the whole string if shorter
    const lastPart = trimmed.substring(Math.max(0, trimmed.length - 20));
    return lastPart;
  }

  /**
   * Check for invalid time of day format (e.g., 25:00, 12:60)
   * @private
   */
  static _findBadTimeOfDay(input) {
    // Look for patterns like HH:MM where hours or minutes are out of range
    const todPattern = /\b(\d{1,2}):(\d{1,2})\b/g;
    let match;
    
    while ((match = todPattern.exec(input)) !== null) {
      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const fullMatch = match[0];
      
      // Check if hours or minutes are out of valid range
      if (hours > 23 || minutes > 59) {
        return { value: fullMatch, hours, minutes };
      }
    }
    return null;
  }

  /**
   * Check for invalid day of week
   * @private
   */
  static _findBadDayOfWeek(input) {
    // Look for ON keyword followed by potential day name
    const onPattern = /\bON\s+([A-Z]+)/i;
    const match = onPattern.exec(input);
    
    if (match) {
      const dayCandidate = match[1].toUpperCase();
      const validDays = ['MONDAY', 'MON', 'TUESDAY', 'TUE', 'WEDNESDAY', 'WED', 
                         'THURSDAY', 'THU', 'THUR', 'FRIDAY', 'FRI', 'SATURDAY', 
                         'SAT', 'SUNDAY', 'SUN'];
      
      if (!validDays.includes(dayCandidate)) {
        return dayCandidate;
      }
    }
    return null;
  }

  /**
   * Check for invalid number format (e.g., 1.2.3, 123abc)
   * @private
   */
  static _findBadNumber(input) {
    // Look for malformed numbers - multiple decimal points or numbers followed by letters
    const badNumberPatterns = [
      /\b\d+\.\d+\.\d+/,  // Multiple decimal points like 1.2.3
      /\b\d+[a-zA-Z]+\d*/,  // Numbers with letters mixed in like 123abc
      /\b\d+\.\d+[a-zA-Z]+/  // Decimals with letters like 1.5abc
    ];
    
    for (const pattern of badNumberPatterns) {
      const match = pattern.exec(input);
      if (match) {
        return match[0];
      }
    }
    return null;
  }

  static _escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

module.exports = { ErrorAnalyzer };
