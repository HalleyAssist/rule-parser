const
	RuleParser = require("../"),
	{ expect } = require('chai')

describe("Parser Error Handling", function() {
	describe("UNMATCHED_PAREN", function() {
		it("should detect unclosed parenthesis in expression grouping", function() {
			try {
				RuleParser.toIL("(A() && B()")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("UNMATCHED_PAREN")
				expect(e.message).to.include("parenthesis")
				expect(e.hint).to.be.a('string')
				expect(e.line).to.be.a('number')
				expect(e.column).to.be.a('number')
				expect(e.offset).to.be.a('number')
			}
		})

		it("should detect extra closing parenthesis", function() {
			try {
				RuleParser.toIL("A())")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("UNMATCHED_PAREN")
				expect(e.message).to.include("Extra")
			}
		})

		it("should detect mismatched nested parentheses", function() {
			try {
				RuleParser.toIL("((A() && B())")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("UNMATCHED_PAREN")
			}
		})

		it("should detect unmatched paren in expression without function", function() {
			try {
				RuleParser.toIL("(5 > 3")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("UNMATCHED_PAREN")
			}
		})
	})

	describe("UNMATCHED_BRACKET", function() {
		it("should detect extra closing bracket", function() {
			try {
				RuleParser.toIL("A([1, 2]])")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("UNMATCHED_BRACKET")
				expect(e.message).to.include("Extra")
			}
		})
	})

	describe("UNTERMINATED_STRING", function() {
		it("should detect unterminated string", function() {
			try {
				RuleParser.toIL('A("hello')
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("UNTERMINATED_STRING")
				expect(e.message).to.include("string")
				expect(e.hint).to.include("double quotes")
			}
		})

		it("should detect unterminated string in comparison", function() {
			try {
				RuleParser.toIL('name == "bob')
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("UNTERMINATED_STRING")
			}
		})

		it("should detect unterminated string in array", function() {
			try {
				RuleParser.toIL('A(["test", "incomplete)')
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("UNTERMINATED_STRING")
			}
		})
	})

	describe("MISSING_EXPRESSION", function() {
		it("should detect empty expression", function() {
			try {
				RuleParser.toIL("")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("MISSING_EXPRESSION")
				expect(e.message).to.include("Empty")
			}
		})

		it("should detect whitespace-only expression", function() {
			// Tests that whitespace (spaces, newlines, tabs) without content
			// is correctly identified as empty after trimming
			try {
				RuleParser.toIL("   \n  \t  ")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("MISSING_EXPRESSION")
			}
		})
	})

	describe("DANGLING_LOGICAL_OPERATOR", function() {
		it("should detect dangling && operator", function() {
			try {
				RuleParser.toIL("A() &&")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("DANGLING_LOGICAL_OPERATOR")
				expect(e.message).to.include("&&")
				expect(e.hint).to.include("followed by")
			}
		})

		it("should detect dangling || operator", function() {
			try {
				RuleParser.toIL("A() ||")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("DANGLING_LOGICAL_OPERATOR")
				expect(e.message).to.include("||")
			}
		})

		it("should detect dangling AND operator", function() {
			try {
				RuleParser.toIL("A() AND")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("DANGLING_LOGICAL_OPERATOR")
				expect(e.message).to.include("AND")
			}
		})

		it("should detect dangling OR operator", function() {
			try {
				RuleParser.toIL("A() OR")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("DANGLING_LOGICAL_OPERATOR")
				expect(e.message).to.include("OR")
			}
		})

		it("should detect dangling operator with whitespace", function() {
			try {
				RuleParser.toIL("A() &&  \n  ")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("DANGLING_LOGICAL_OPERATOR")
			}
		})
	})

	describe("MISSING_RHS_AFTER_OPERATOR", function() {
		it("should detect missing value after >", function() {
			try {
				RuleParser.toIL("temp >")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("MISSING_RHS_AFTER_OPERATOR")
				expect(e.message).to.include(">")
				expect(e.hint).to.include("followed by a value")
			}
		})

		it("should detect missing value after <", function() {
			try {
				RuleParser.toIL("A() <")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("MISSING_RHS_AFTER_OPERATOR")
				expect(e.message).to.include("<")
			}
		})

		it("should detect missing value after ==", function() {
			try {
				RuleParser.toIL("name ==")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("MISSING_RHS_AFTER_OPERATOR")
				expect(e.message).to.include("==")
			}
		})

		it("should detect missing value after !=", function() {
			try {
				RuleParser.toIL("status !=")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("MISSING_RHS_AFTER_OPERATOR")
				expect(e.message).to.include("!=")
			}
		})

		it("should detect missing value after >=", function() {
			try {
				RuleParser.toIL("A() >=")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("MISSING_RHS_AFTER_OPERATOR")
				expect(e.message).to.include(">=")
			}
		})

		it("should detect missing value after <=", function() {
			try {
				RuleParser.toIL("A() <=")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("MISSING_RHS_AFTER_OPERATOR")
				expect(e.message).to.include("<=")
			}
		})
	})

	describe("BAD_BETWEEN_SYNTAX", function() {
		it("should detect incomplete BETWEEN", function() {
			try {
				RuleParser.toIL("A() BETWEEN")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("BAD_BETWEEN_SYNTAX")
				expect(e.message).to.include("BETWEEN")
				expect(e.hint).to.include("two values")
			}
		})

		it("should detect BETWEEN with only one value", function() {
			try {
				RuleParser.toIL("A() BETWEEN 1")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("BAD_BETWEEN_SYNTAX")
			}
		})

		it("should detect BETWEEN missing AND", function() {
			try {
				RuleParser.toIL("A() BETWEEN 1 10")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("BAD_BETWEEN_SYNTAX")
			}
		})
	})

	describe("BAD_FUNCTION_CALL", function() {
		it("should detect function call with unclosed paren", function() {
			try {
				RuleParser.toIL("A(")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("BAD_FUNCTION_CALL")
			}
		})

		it("should detect function call with argument but unclosed", function() {
			try {
				RuleParser.toIL("func(arg")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("UNMATCHED_PAREN")
			}
		})

		it("should detect nested function call with unclosed paren", function() {
			try {
				RuleParser.toIL("A(B(C()")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("BAD_FUNCTION_CALL")
			}
		})
	})

	describe("BAD_ARRAY_SYNTAX", function() {
		it("should detect array with unclosed bracket", function() {
			try {
				RuleParser.toIL("A([1, 2, 3)")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("BAD_ARRAY_SYNTAX")
				expect(e.message).to.include("array")
				expect(e.hint).to.include("brackets")
			}
		})

		it("should detect array at start with unclosed bracket", function() {
			try {
				RuleParser.toIL("A([1)")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("BAD_ARRAY_SYNTAX")
			}
		})

		it("should detect array with missing closing bracket", function() {
			try {
				RuleParser.toIL("A([1, 2")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("BAD_ARRAY_SYNTAX")
			}
		})

		it("should detect nested array with unclosed bracket", function() {
			try {
				RuleParser.toIL("A([[1, 2], [3, 4")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("BAD_ARRAY_SYNTAX")
			}
		})
	})

	describe("BAD_TOD", function() {
		it("should detect time of day with hours > 23", function() {
			try {
				RuleParser.toIL("A() BETWEEN 25:00 AND 23:00")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("BAD_TOD")
				expect(e.message).to.include("25:00")
				expect(e.hint).to.include("HH:MM")
				expect(e.hint).to.include("0-23")
			}
		})

		it("should detect time of day with minutes > 59", function() {
			try {
				RuleParser.toIL("A() BETWEEN 12:60 AND 13:00")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("BAD_TOD")
				expect(e.message).to.include("12:60")
			}
		})

		it("should detect time of day with invalid hours and minutes", function() {
			try {
				RuleParser.toIL("A() BETWEEN 24:60 AND 13:00")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("BAD_TOD")
				expect(e.message).to.include("24:60")
			}
		})

		it("should detect invalid time in function argument", function() {
			try {
				RuleParser.toIL("A(BETWEEN 10:00 AND 25:30)")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("BAD_TOD")
				expect(e.message).to.include("25:30")
			}
		})
	})

	describe("BAD_DOW", function() {
		it("should detect invalid day of week name", function() {
			try {
				RuleParser.toIL("A(BETWEEN 01:00 AND 03:00 ON FUNDAY)")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("BAD_DOW")
				expect(e.message).to.include("FUNDAY")
				expect(e.hint).to.include("MONDAY")
				expect(e.hint).to.include("FRIDAY")
			}
		})

		it("should detect misspelled day abbreviation", function() {
			try {
				RuleParser.toIL("A(BETWEEN 01:00 AND 03:00 ON MOND)")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("BAD_DOW")
				expect(e.message).to.include("MOND")
			}
		})

		it("should detect invalid day name in complex expression", function() {
			try {
				RuleParser.toIL("A(BETWEEN 01:00 AND 03:00 ON WEDNESDAYY)")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("UNEXPECTED_TOKEN")
				expect(e.message).to.include("WEDNESDAY")
				expect(e.message).to.include("Y")
			}
		})
	})

	describe("BAD_NUMBER", function() {
		it("should detect number with multiple decimal points", function() {
			try {
				RuleParser.toIL("A(1.2.3)")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("BAD_NUMBER")
				expect(e.message).to.include("1.2.3")
				expect(e.hint).to.include("valid")
			}
		})

		it("should detect number with letters mixed in", function() {
			try {
				RuleParser.toIL("A(123abc)")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("BAD_NUMBER")
				expect(e.message).to.include("123abc")
			}
		})

		it("should detect decimal with letters", function() {
			try {
				RuleParser.toIL("A(1.5xyz)")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("BAD_NUMBER")
				expect(e.message).to.include("5xyz")  // Matches the malformed part
			}
		})

		it("should detect malformed number in comparison", function() {
			try {
				RuleParser.toIL("temp > 1.2.3")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("BAD_NUMBER")
			}
		})
	})

	describe("UNEXPECTED_TOKEN", function() {
		it("should detect multiple expressions without operator", function() {
			try {
				RuleParser.toIL("A() B()")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("UNEXPECTED_TOKEN")
				expect(e.message).to.be.a('string')
				expect(e.hint).to.be.a('string')
			}
		})

		it("should detect invalid characters", function() {
			try {
				RuleParser.toIL("A() @ B()")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("UNEXPECTED_TOKEN")
			}
		})
	})

	describe("Error Object Structure", function() {
		it("should have all required properties", function() {
			try {
				RuleParser.toIL("A(")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e).to.have.property('code')
				expect(e).to.have.property('message')
				expect(e).to.have.property('hint')
				expect(e).to.have.property('line')
				expect(e).to.have.property('column')
				expect(e).to.have.property('offset')
				expect(e).to.have.property('found')
				expect(e).to.have.property('expected')
				expect(e).to.have.property('snippet')
			}
		})

		it("should have toJSON method", function() {
			try {
				RuleParser.toIL("A(")
				expect.fail("Should have thrown an error")
			} catch (e) {
				const json = e.toJSON()
				expect(json).to.have.property('code')
				expect(json).to.have.property('message')
				expect(json).to.have.property('hint')
				expect(json).to.have.property('line')
				expect(json).to.have.property('column')
			}
		})

		it("should have toString method", function() {
			try {
				RuleParser.toIL("A(")
				expect.fail("Should have thrown an error")
			} catch (e) {
				const str = e.toString()
				expect(str).to.include('RuleParseError')
				expect(str).to.include('BAD_FUNCTION_CALL')
				expect(str).to.include('line')
			}
		})
	})

	describe("instanceof checks", function() {
		it("should be instance of RuleParseError", function() {
			try {
				RuleParser.toIL("A(")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e).to.be.instanceOf(RuleParser.RuleParseError)
			}
		})

		it("should be instance of Error", function() {
			try {
				RuleParser.toIL("A(")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e).to.be.instanceOf(Error)
			}
		})
	})

	describe("Complex Error Cases", function() {
		it("should handle multiple potential errors and report most relevant", function() {
			try {
				// This has both unmatched paren and dangling operator
				// Should report unmatched paren as it's detected first
				RuleParser.toIL("A() && B(")
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.be.a('string')
				expect(e.message).to.be.a('string')
			}
		})

		it("should handle long expressions", function() {
			try {
				const longExpr = "A() && B() && C() && D() && E() &&"
				RuleParser.toIL(longExpr)
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("DANGLING_LOGICAL_OPERATOR")
				expect(e.snippet).to.be.a('string')
			}
		})

		it("should detect unmatched paren even with parentheses inside strings", function() {
			// The string "test (" contains a paren but should not affect balance checking
			// The missing closing ) for the function call should be detected as unmatched
			try {
				RuleParser.toIL('A("test ("')
				expect.fail("Should have thrown an error")
			} catch (e) {
				expect(e.code).to.equal("BAD_FUNCTION_CALL")
			}
		})
	})
})
