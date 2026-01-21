const
	RuleParser = require("../"),
	{ expect } = require('chai')

describe("Arithmetic Operators", function() {
	it("should be able to parse arithmetic (1)", function () {
		const expression1 = `A() + D(1) == 2`
		const il = RuleParser.toIL(expression1)
		expect(il).to.be.eql(["Eq",["MathAdd",["A"],["D",["Value",1]]],["Value",2]])
	})

	it("should be able to parse arithmetic (2)", function () {
		const expression1 = `A() + D(1) * 4 == 2 * A()`
		const il = RuleParser.toIL(expression1)
		expect(il).to.be.eql(["Eq",["MathAdd",["A"],["MathMul",["D",["Value",1]],["Value",4]]],["MathMul",["Value",2],["A"]]])
	})

	it("should be able to parse arithmetic (3)", function () {
		const expression1 = `A() + D(1)`
		const il = RuleParser.toIL(expression1)
		expect(il).to.be.eql(["MathAdd",["A"],["D",["Value",1]]])
	})

	it("should parse subtraction operator", function() {
		expect(RuleParser.toIL("A() - B()")).to.be.eql(["MathSub", ["A"], ["B"]])
	})

	it("should parse division operator", function() {
		expect(RuleParser.toIL("A() / B()")).to.be.eql(["MathDiv", ["A"], ["B"]])
	})

	it("should parse modulus operator", function() {
		expect(RuleParser.toIL("A() % B()")).to.be.eql(["MathMod", ["A"], ["B"]])
	})

	it("should parse chained arithmetic operations", function() {
		expect(RuleParser.toIL("A() + B() - C()"))
			.to.be.eql(["MathAdd", ["A"], ["MathSub", ["B"], ["C"]]])
	})

	it("should parse arithmetic with numbers", function() {
		expect(RuleParser.toIL("10 + 5")).to.be.eql(["MathAdd", ["Value", 10], ["Value", 5]])
		expect(RuleParser.toIL("10 - 5")).to.be.eql(["MathSub", ["Value", 10], ["Value", 5]])
		expect(RuleParser.toIL("10 * 5")).to.be.eql(["MathMul", ["Value", 10], ["Value", 5]])
		expect(RuleParser.toIL("10 / 5")).to.be.eql(["MathDiv", ["Value", 10], ["Value", 5]])
		expect(RuleParser.toIL("10 % 3")).to.be.eql(["MathMod", ["Value", 10], ["Value", 3]])
	})

	it("should respect operator precedence (multiplication before addition)", function() {
		// Note: The parser doesn't enforce precedence; it parses left-to-right
		// This test documents the actual behavior
		expect(RuleParser.toIL("2 + 3 * 4"))
			.to.be.eql(["MathAdd", ["Value", 2], ["MathMul", ["Value", 3], ["Value", 4]]])
	})

	it("should parse arithmetic in comparisons", function() {
		expect(RuleParser.toIL("A() + 5 > 10"))
			.to.be.eql(["Gt", ["MathAdd", ["A"], ["Value", 5]], ["Value", 10]])
	})

	it("should be able to parse default value operator", function () {
		const expression1 = `A() ?? 1`
		const il = RuleParser.toIL(expression1)
		expect(il).to.be.eql(["Default",["A"],["Value",1]])
	})

	it("should be able to parse default value operator in an expression", function () {
		const expression1 = `A() ?? 1 < 20`
		const il = RuleParser.toIL(expression1)
		expect(il).to.be.eql(["Lt",["Default",["A"],["Value",1]],["Value",20]])
	})
})

describe("Arithmetic Operator Restrictions", function() {
	it("should reject arithmetic with string values", function() {
		expect(function() {
			RuleParser.toIL('A() + "string"')
		}).to.throw()
	})

	it("should reject arithmetic with boolean TRUE", function() {
		expect(function() {
			RuleParser.toIL('A() * TRUE')
		}).to.throw()
	})

	it("should reject arithmetic with boolean FALSE", function() {
		expect(function() {
			RuleParser.toIL('A() / FALSE')
		}).to.throw()
	})

	it("should reject arithmetic with arrays", function() {
		expect(function() {
			RuleParser.toIL('A() - [1,2,3]')
		}).to.throw()
	})

	it("should reject arithmetic with BETWEEN expressions", function() {
		expect(function() {
			RuleParser.toIL('A() + BETWEEN 1 AND 5')
		}).to.throw()
	})

	it("should reject default operator with string", function() {
		expect(function() {
			RuleParser.toIL('A() ?? "default"')
		}).to.throw()
	})

	it("should reject arithmetic with time period constants", function() {
		expect(function() {
			RuleParser.toIL('A() + today')
		}).to.throw()
	})

	it("should reject comparison with BETWEEN on RHS", function() {
		expect(function() {
			RuleParser.toIL('A() > BETWEEN 1 AND 5')
		}).to.throw()
	})

	it("should allow arithmetic with numbers", function() {
		expect(RuleParser.toIL("A() + 5")).to.be.eql(["MathAdd", ["A"], ["Value", 5]])
		expect(RuleParser.toIL("10 * 2")).to.be.eql(["MathMul", ["Value", 10], ["Value", 2]])
	})

	it("should allow arithmetic with function calls", function() {
		expect(RuleParser.toIL("A() - B()")).to.be.eql(["MathSub", ["A"], ["B"]])
		expect(RuleParser.toIL("A() / B()")).to.be.eql(["MathDiv", ["A"], ["B"]])
	})

	it("should allow arithmetic with time units", function() {
		expect(RuleParser.toIL("A() + 1 hour")).to.be.eql(["MathAdd", ["A"], ["Value", 3600]])
		expect(RuleParser.toIL("A() - 30 minutes")).to.be.eql(["MathSub", ["A"], ["Value", 1800]])
	})

	it("should allow default operator with numbers", function() {
		expect(RuleParser.toIL("A() ?? 5")).to.be.eql(["Default", ["A"], ["Value", 5]])
	})

	it("should allow default operator with function calls", function() {
		expect(RuleParser.toIL("A() ?? B()")).to.be.eql(["Default", ["A"], ["B"]])
	})

	it("should allow chained arithmetic with valid operands", function() {
		expect(RuleParser.toIL("A() + B() * C()"))
			.to.be.eql(["MathAdd", ["A"], ["MathMul", ["B"], ["C"]]])
	})
})
