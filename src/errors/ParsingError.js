/**
 * Represents a parsing error with position information
 */
class ParsingError extends Error {
  /**
   * Create a ParsingError
   * @param {string} message - Error message
   * @param {Object} position - Position information with line, column, and offset
   * @param {Array<string>} expected - Array of expected tokens
   * @param {string} found - What was found instead
   */
  constructor(message, position, expected, found) {
    super(message);
    this.name = 'ParsingError';
    this.position = position;
    this.expected = expected || [];
    this.found = found || '';
    
    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ParsingError.prototype);
  }

  toString() {
    const { line, column, offset } = this.position;
    let msg = `${this.name}: ${this.message}\n`;
    msg += `  at line ${line}, column ${column} (offset ${offset})\n`;
    msg += `  Expected: ${this.expected.join(', ')}\n`;
    msg += `  Found: ${this.found}`;
    return msg;
  }
}

module.exports = { ParsingError };
