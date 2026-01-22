const
	RuleParser = require("../"),
	{ expect } = require('chai')

describe("Edge Cases and Special Scenarios", function() {
	describe("Whitespace Handling", function() {
		it("should handle expressions with minimal whitespace", function() {
			expect(RuleParser.toIL("A()>5")).to.be.eql(["Gt", ["A"], ["Value", 5]])
			expect(RuleParser.toIL("A()&&B()")).to.be.eql(["And", ["A"], ["B"]])
		})

		it("should handle expressions with excessive whitespace", function() {
			expect(RuleParser.toIL("A()   >   5"))
				.to.be.eql(["Gt", ["A"], ["Value", 5]])
			expect(RuleParser.toIL("A()   &&   B()"))
				.to.be.eql(["And", ["A"], ["B"]])
		})

		it("should handle whitespace in function arguments", function() {
			expect(RuleParser.toIL("A( 1 , 2 )"))
				.to.be.eql(["A", ["Value", 1], ["Value", 2]])
		})

		it("should handle whitespace after expression", function() {
			expect(RuleParser.toIL("A(1,2)    "))
				.to.be.eql(["A", ["Value", 1], ["Value", 2]])
		})

		it("should handle whitespace before expression", function() {
			expect(RuleParser.toIL("   A(1,2)"))
				.to.be.eql(["A", ["Value", 1], ["Value", 2]])
		})

		it("should handle whitespace in arrays", function() {
			expect(RuleParser.toIL("A( [ 1 , 2 , 3 ] )"))
				.to.be.eql(["A", ["Value", [1, 2, 3]]])
		})

		it("should handle newlines and tabs", function() {
			expect(RuleParser.toIL("A()\n&&\tB()"))
				.to.be.eql(["And", ["A"], ["B"]])
		})
	})

	describe("Nested Parenthesis Expressions", function() {
		it("should parse deeply nested parenthesis", function() {
			const expression = "((A() > 5))"
			expect(RuleParser.toIL(expression))
				.to.be.eql(["Gt", ["A"], ["Value", 5]])
		})

		it("should parse multiple levels of nesting with logical operators", function() {
			const expression = "(((A() && B()) || C()) && D())"
			expect(RuleParser.toIL(expression)).to.be.eql([
				"And",
				["Or", ["And", ["A"], ["B"]], ["C"]],
				["D"]
			])
		})

		it("should parse complex nested expressions", function() {
			const expression = "((A() > 5) && (B() < 10)) || ((C() == 3) && (D() != 4))"
			const il = RuleParser.toIL(expression)
			expect(il).to.be.eql([
				"Or",
				["And", ["Gt", ["A"], ["Value", 5]], ["Lt", ["B"], ["Value", 10]]],
				["And", ["Eq", ["C"], ["Value", 3]], ["Neq", ["D"], ["Value", 4]]]
			])
		})
	})

	describe("Edge Cases", function() {
		it("should handle zero values", function() {
			expect(RuleParser.toIL("0 == 0"))
				.to.be.eql(["Eq", ["Value", 0], ["Value", 0]])
		})

		it("should handle very small decimal numbers", function() {
			expect(RuleParser.toIL("0.001 < 0.002"))
				.to.be.eql(["Lt", ["Value", 0.001], ["Value", 0.002]])
		})

		it("should handle very large numbers", function() {
			expect(RuleParser.toIL("999999999 > 0"))
				.to.be.eql(["Gt", ["Value", 999999999], ["Value", 0]])
		})

		it("should handle function names with numbers", function() {
			expect(RuleParser.toIL("Func123()")).to.be.eql(["Func123"])
		})

		it("should parse single value expression", function() {
			expect(RuleParser.toIL("5")).to.be.eql(["Value", 5])
			expect(RuleParser.toIL("TRUE")).to.be.eql(["Value", true])
		})

		it("should parse default operator with function calls", function() {
			expect(RuleParser.toIL("A() ?? B()"))
				.to.be.eql(["Default", ["A"], ["B"]])
		})

		it("should parse default operator with multiple fallbacks", function() {
			expect(RuleParser.toIL("A() ?? B() ?? 5"))
				.to.be.eql(["Default", ["A"], ["Default", ["B"], ["Value", 5]]])
		})
	})
})
