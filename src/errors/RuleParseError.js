/**
 * Represents a user-friendly rule parsing error with error codes
 */
class RuleParseError extends Error {
  constructor(code, message, hint, position, found, expected, snippet) {
    super(message);
    this.name = 'RuleParseError';
    this.code = code;
    this.hint = hint;
    this.line = position.line;
    this.column = position.column;
    this.offset = position.offset;
    this.found = found;
    this.expected = expected;
    this.snippet = snippet;
    
    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, RuleParseError.prototype);
  }

  toString() {
    let msg = `${this.name} [${this.code}]: ${this.message}\n`;
    msg += `  at line ${this.line}, column ${this.column} (offset ${this.offset})\n`;
    if (this.snippet) {
      msg += `  ${this.snippet}\n`;
    }
    if (this.hint) {
      msg += `  Hint: ${this.hint}\n`;
    }
    if (this.found) {
      msg += `  Found: ${this.found}\n`;
    }
    if (this.expected && this.expected.length) {
      msg += `  Expected: ${this.expected.join(', ')}`;
    }
    return msg;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      hint: this.hint,
      line: this.line,
      column: this.column,
      offset: this.offset,
      found: this.found,
      expected: this.expected,
      snippet: this.snippet
    };
  }
}

module.exports = { RuleParseError };
