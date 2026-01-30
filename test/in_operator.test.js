const
	RuleParser = require("../"),
	{ expect } = require('chai')

describe("IN() Operator", function() {
	it("should parse IN with string literals", function () {
		const expression = `Value() IN ("a","b")`
		expect(RuleParser.toIL(expression)).to.be.eql(['ArrayIn', ["Value"], ["Value", "a"], ["Value", "b"]])
	})

	it("should parse IN with string literals and no spaces", function () {
		const expression = `Value() IN("a","b")`
		expect(RuleParser.toIL(expression)).to.be.eql(['ArrayIn', ["Value"], ["Value", "a"], ["Value", "b"]])
	})

	it("should parse IN with function calls", function () {
		const expression = `Value() IN (A(), B())`
		expect(RuleParser.toIL(expression)).to.be.eql(['ArrayIn', ["Value"], ["A"], ["B"]])
	})

	it("should parse IN with mixed values", function () {
		const expression = `Value() IN ("a", B(), "c")`
		expect(RuleParser.toIL(expression)).to.be.eql(['ArrayIn', ["Value"], ["Value", "a"], ["B"], ["Value", "c"]])
	})

	it("should parse IN with numbers", function () {
		const expression = `Value() IN (1, 2, 3)`
		expect(RuleParser.toIL(expression)).to.be.eql(['ArrayIn', ["Value"], ["Value", 1], ["Value", 2], ["Value", 3]])
	})

	it("should parse IN with function call on LHS", function () {
		const expression = `GetValue() IN ("a", "b", "c")`
		expect(RuleParser.toIL(expression)).to.be.eql(['ArrayIn', ["GetValue"], ["Value", "a"], ["Value", "b"], ["Value", "c"]])
	})

	it("should parse IN with boolean values", function () {
		const expression = `Value() IN (TRUE, FALSE)`
		expect(RuleParser.toIL(expression)).to.be.eql(['ArrayIn', ["Value"], ["Value", true], ["Value", false]])
	})

	it("should parse IN with single value", function () {
		const expression = `Value() IN ("a")`
		expect(RuleParser.toIL(expression)).to.be.eql(['ArrayIn', ["Value"], ["Value", "a"]])
	})

	it("should parse IN in complex expression with AND", function () {
		const expression = `Value() IN ("a", "b") && Other() == 5`
		expect(RuleParser.toIL(expression)).to.be.eql([
			"And",
			["ArrayIn", ["Value"], ["Value", "a"], ["Value", "b"]],
			["Eq", ["Other"], ["Value", 5]]
		])
	})

	it("should parse IN in complex expression with OR", function () {
		const expression = `Value() IN ("a", "b") || Other() > 10`
		expect(RuleParser.toIL(expression)).to.be.eql([
			"Or",
			["ArrayIn", ["Value"], ["Value", "a"], ["Value", "b"]],
			["Gt", ["Other"], ["Value", 10]]
		])
	})

	it("should parse IN with function calls returning values", function () {
		const expression = `A() IN (B(), C(), D())`
		expect(RuleParser.toIL(expression)).to.be.eql(['ArrayIn', ["A"], ["B"], ["C"], ["D"]])
	})

	it("should parse IN with arithmetic on LHS", function () {
		const expression = `Value() + 1 IN (5, 6, 7)`
		expect(RuleParser.toIL(expression)).to.be.eql(['ArrayIn', ["MathAdd", ["Value"], ["Value", 1]], ["Value", 5], ["Value", 6], ["Value", 7]])
	})

	it("should parse IN with expressions as arguments", function () {
		const expression = `Value() IN (A() + 1, B() - 2)`
		expect(RuleParser.toIL(expression)).to.be.eql([
			'ArrayIn', 
			["Value"], 
			["MathAdd", ["A"], ["Value", 1]], 
			["MathSub", ["B"], ["Value", 2]]
		])
	})

	it("should parse IN with nested function calls", function () {
		const expression = `Value() IN (A(B()), C(D()))`
		expect(RuleParser.toIL(expression)).to.be.eql(['ArrayIn', ["Value"], ["A", ["B"]], ["C", ["D"]]])
	})

	it("should parse NOT with IN operator", function () {
		const expression = `!(Value() IN ("a", "b"))`
		expect(RuleParser.toIL(expression)).to.be.eql(['Not', ['ArrayIn', ["Value"], ["Value", "a"], ["Value", "b"]]])
	})

	it("should parse IN with case insensitive keyword", function () {
		const expression = `Value() in ("a", "b")`
		expect(RuleParser.toIL(expression)).to.be.eql(['ArrayIn', ["Value"], ["Value", "a"], ["Value", "b"]])
	})

	it("should parse IN with mixed case keyword", function () {
		const expression = `Value() In ("a", "b")`
		expect(RuleParser.toIL(expression)).to.be.eql(['ArrayIn', ["Value"], ["Value", "a"], ["Value", "b"]])
	})
})
