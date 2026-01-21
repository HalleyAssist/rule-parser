const
	RuleParser = require("../"),
	{ expect } = require('chai')

describe("Logical Operators", function () {
	it("parse logic expression", function () {
		expect(RuleParser.toIL("AFunction()")).to.be.eql(["AFunction"])
		expect(RuleParser.toIL("!AFunction()")).to.be.eql(["Not", ["AFunction"]])
		expect(RuleParser.toIL("! AFunction()")).to.be.eql(["Not", ["AFunction"]])
		expect(RuleParser.toIL("not AFunction()")).to.be.eql(["Not", ["AFunction"]])
	})

	it("should be able to parse && in arguments", function () {
		const expression1 = `A(B() && C())`
		const il = RuleParser.toIL(expression1)
		expect(il).to.be.eql(["A",["And",["B"],["C"]]])
	})

	it("should be able to parse parenthesis", function () {
		const expression1 = `(A()==2 and B()==1) and (C(2) && D(1))`
		const il = RuleParser.toIL(expression1)
		expect(il).to.be.eql([
			'And',
			['And', ['Eq', ["A"], ["Value", 2]], ['Eq', ["B"], ["Value", 1]]],
			['And', ['C', ["Value", 2]], ['D', ["Value", 1]]]
		])
	})

	it("should be able to parse not expressions (1)", function () {
		const expression1 = `!D(1)`
		let il = RuleParser.toIL(expression1)
		expect(il).to.be.eql(['Not', ['D', ['Value', 1]]])
		const expression2 = `! D(1)&& !D(2)`
		il = RuleParser.toIL(expression2)
		expect(il).to.be.eql(['And', ['Not', ['D', ['Value', 1]]], ['Not', ['D', ['Value', 2]]]])
		const expression3 = `(! D(1) && !D(3)) && !D(2)`
		il = RuleParser.toIL(expression3)
		expect(il).to.be.eql([
			'And',
			['And', ['Not', ['D', ['Value', 1]]], ['Not', ['D', ['Value', 3]]]],
			['Not', ['D', ['Value', 2]]]
		])
	})

	it("should be able to parse not expressions (2)", function () {
		const expression1 = `(A()==2 and B()==1) and (C(2) && !D(1))`
		const il = RuleParser.toIL(expression1)
		expect(il).to.be.eql([
			'And',
			['And', ['Eq', ["A"], ["Value", 2]], ['Eq', ["B"], ["Value", 1]]],
			['And', ['C', ["Value", 2]], ['Not', ['D', ["Value", 1]]]]
		])
	})

	it("should be able to parse not expressions (3)", function () {
		const expression1 = `(A()==2 and B()==1) and ! (C(2) && D(1))`
		const il = RuleParser.toIL(expression1)
		expect(il).to.be.eql([
			'And',
			['And', ['Eq', ["A"], ["Value", 2]], ['Eq', ["B"], ["Value", 1]]],
			['Not', ['And', ['C', ["Value", 2]], ['D', ["Value", 1]]]]
		])
	})

	it("should be able to parse or expressions (1)", function () {
		const expression1 = `(A()==2 and B()==1) or (C(2) && D(1))`
		const il = RuleParser.toIL(expression1)
		expect(il).to.be.eql([
			'Or',
			['And', ['Eq', ["A"], ["Value", 2]], ['Eq', ["B"], ["Value", 1]]],
			['And', ['C', ["Value", 2]], ['D', ["Value", 1]]]
		])
	})

	it("should be able to parse or expressions (2)", function () {
		const expression1 = `(A()==2 or B()==1) and (C(2) || D(1))`
		const il = RuleParser.toIL(expression1)
		expect(il).to.be.eql([
			'And',
			['Or', ['Eq', ["A"], ["Value", 2]], ['Eq', ["B"], ["Value", 1]]],
			['Or', ['C', ["Value", 2]], ['D', ["Value", 1]]]
		])
	})

	it("should be able to parse or expressions (3)", function () {
		const expression1 = `A() or !(C(2) && D(1))`
		const il = RuleParser.toIL(expression1)
		expect(il).to.be.eql([
			'Or',
			["A"],
			['Not', ['And', ['C', ["Value", 2]], ['D', ["Value", 1]]]]
		])
	})

	it("should be able to parse or expressions (4)", function () {
		const expression1 = `A() and !(C(2) || D(1))`
		const il = RuleParser.toIL(expression1)
		expect(il).to.be.eql([
			'And',
			["A"],
			['Not', ['Or', ['C', ["Value", 2]], ['D', ["Value", 1]]]]
		])
	})

	it("should be able to parse real or expressions (1)", function () {
		const expression1 = "HasCapableSensor(\"weight\") && !((TimeOfDay() BETWEEN 0800 AND 1200 && Event(\"kind\") == \"measurement\" && EventHasData(\"weight\") && TimeLastTrueSet(\"slot1\")) || TimeLastTrueCheck(\"slot1\") < 5 minutes)"
		const il = RuleParser.toIL(expression1) 
		expect(il).to.be.eql(
			["And", 
			["HasCapableSensor", ["Value", "weight"]], 
			["Not", ["Or", 
				["And", ["Between", ["TimeOfDay"], ["Value", 800], ["Value", 1200]], ["Eq", ["Event", ["Value", "kind"]], ["Value", "measurement"]], ["EventHasData", ["Value", "weight"]], ["TimeLastTrueSet", ["Value", "slot1"]]], 
				["Lt", ["TimeLastTrueCheck", ["Value", "slot1"]], ["Value", 300]]
			]]])
	})

	it("should parse uppercase AND", function() {
		expect(RuleParser.toIL("A() AND B()"))
			.to.be.eql(["And", ["A"], ["B"]])
	})

	it("should parse lowercase and", function() {
		expect(RuleParser.toIL("A() and B()"))
			.to.be.eql(["And", ["A"], ["B"]])
	})

	it("should parse uppercase OR", function() {
		expect(RuleParser.toIL("A() OR B()"))
			.to.be.eql(["Or", ["A"], ["B"]])
	})

	it("should parse lowercase or", function() {
		expect(RuleParser.toIL("A() or B()"))
			.to.be.eql(["Or", ["A"], ["B"]])
	})

	it("should parse mixed case logical operators", function() {
		expect(RuleParser.toIL("A() AnD B() Or C()"))
			.to.be.eql(["Or", ["And", ["A"], ["B"]], ["C"]])
	})

	it("should parse 'not' with lowercase", function() {
		expect(RuleParser.toIL("not A()")).to.be.eql(["Not", ["A"]])
	})

	it("should parse 'NOT' with uppercase", function() {
		expect(RuleParser.toIL("NOT A()")).to.be.eql(["Not", ["A"]])
	})

	it("should parse NOT with values", function() {
		expect(RuleParser.toIL("!5")).to.be.eql(["Not", ["Value", 5]])
		expect(RuleParser.toIL("!TRUE")).to.be.eql(["Not", ["Value", true]])
	})

	it("should parse chained NOT expressions", function() {
		expect(RuleParser.toIL("!A() && !B() && !C()"))
			.to.be.eql(["And", ["Not", ["A"]], ["Not", ["B"]], ["Not", ["C"]]])
	})

	it("should parse expression with all operator types", function() {
		const expression = "A() + 5 > 10 && B() - 3 < 7 || !C()"
		const il = RuleParser.toIL(expression)
		expect(il).to.be.eql([
			"Or",
			["And", 
				["Gt", ["MathAdd", ["A"], ["Value", 5]], ["Value", 10]],
				["Lt", ["MathSub", ["B"], ["Value", 3]], ["Value", 7]]
			],
			["Not", ["C"]]
		])
	})

	it("should parse expression with mixed arithmetic and comparison", function() {
		// Parentheses are for logical expressions, not arithmetic grouping
		const expression = "A() * 2 + B() / 3 >= C() - 5"
		const il = RuleParser.toIL(expression)
		expect(il).to.be.eql([
			"Gte",
			["MathMul", ["A"], ["MathAdd", ["Value", 2], ["MathDiv", ["B"], ["Value", 3]]]],
			["MathSub", ["C"], ["Value", 5]]
		])
	})

	it("should parse complex nested expression with multiple operator types", function() {
		const expression = "(A() + B() > 10 && C() == TRUE) || (D() BETWEEN 1-5 && !E())"
		const il = RuleParser.toIL(expression)
		expect(il).to.be.eql([
			"Or",
			["And", 
				["Gt", ["MathAdd", ["A"], ["B"]], ["Value", 10]],
				["Eq", ["C"], ["Value", true]]
			],
			["And",
				["Between", ["D"], ["Value", 1], ["Value", 5]],
				["Not", ["E"]]
			]
		])
	})
})
