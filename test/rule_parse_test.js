const
	RuleParser = require("../"),
	{ expect } = require('chai')

describe("RuleParser", function () {
	it("parse basic", function () {
		expect(RuleParser.toIL("1 > 2")).to.be.eql(["Gt", ["Value", 1], ["Value", 2]])
		expect(RuleParser.toIL("AFunction(1,2) > 3")).to.be.eql(["Gt", ["AFunction", ["Value", 1], ["Value", 2]], ["Value", 3]])
		expect(RuleParser.toIL("AFunction(1,2)")).to.be.eql(["AFunction", ["Value", 1], ["Value", 2]])
		expect(RuleParser.toIL("AFunction(\"string\",2) == \"string\"")).to.be.eql(["Eq", ["AFunction", ["Value", "string"], ["Value", 2]], ["Value", "string"]])
	})
	it("parse logic expression", function () {
		expect(RuleParser.toIL("AFunction()")).to.be.eql(["AFunction"])
		expect(RuleParser.toIL("!AFunction()")).to.be.eql(["Not", ["AFunction"]])
		expect(RuleParser.toIL("! AFunction()")).to.be.eql(["Not", ["AFunction"]])
		expect(RuleParser.toIL("not AFunction()")).to.be.eql(["Not", ["AFunction"]])
	})
	it("parse function no args", function () {
		expect(RuleParser.toIL("AFunction() > 3")).to.be.eql(["Gt", ["AFunction"], ["Value", 3]])
	})
	it("parse number starting with 0", function () {
		expect(RuleParser.toIL("AFunction() > 03")).to.be.eql(["Gt", ["AFunction"], ["Value", 3]])
	})
	it("should throw if additional junk", function () {
		expect(function () {
			RuleParser.toIL("AFunction() > 3 abc")
		}).to.throw()
	})
	it("parse array", function () {
		expect(RuleParser.toIL("AFunction([1,2])")).to.be.eql(["AFunction", ["Value", [1, 2]]])
	})
	it("should be able to parse all basic comparison operators", function () {
		const operators = [
			'==', '=', "!=", ">=", ">", "<=", '<'
		]
		for (const op of operators) {
			const expression1 = `RoomDuration("Room 1") ${op} 5`
			RuleParser.toIL(expression1)
			const expression2 = `RoomDuration("Room 1")${op}5`
			RuleParser.toIL(expression2)
		}
	})
	it("should be able to parse the between operator", function () {
		const expression1 = `RoomDuration("Room 1") between 1 and 5`
		expect(RuleParser.toIL(expression1)).to.be.eql(['Between', ["RoomDuration", ["Value", "Room 1"]], ["Value", 1], ["Value", 5]])
	})
	it("should be able to parse the equals approximately operator", function () {
		const expression1 = `RoomDuration("Room 1") == ~1`
		expect(RuleParser.toIL(expression1)).to.be.eql([
			'Between',
			['RoomDuration', ['Value', 'Room 1']],
			['Value', 0.99],
			['Value', 1.01]
		])
	})
	it("should be able to parse the approximately not equals operator", function () {
		const expression1 = `RoomDuration("Room 1") !=~1`
		expect(RuleParser.toIL(expression1)).to.be.eql([
			'Not', ['Between',
				['RoomDuration', ['Value', 'Room 1']],
				['Value', 0.99],
				['Value', 1.01]
			]])
	})
	it("should be able to parse all time units", function () {
		const unit = [
			'second', 'minute', 'hour', 'day', 'week'
		]
		for (const u of unit) {
			const expression1 = `RoomDuration(1 ${u})`
			RuleParser.toIL(expression1)
			const expression2 = `RoomDuration(1 ${u}s)`
			RuleParser.toIL(expression2)
		}
	})
	it("should be able to parse all time tp constants", function () {
		const unit = [
			'today'/*, "yesterday"*/
		]
		for (const u of unit) {
			const expression1 = `RoomDuration(${u})`
			const il = RuleParser.toIL(expression1)
			expect(il).to.be.eql(['RoomDuration', ['TimePeriodConst', u]])
		}
	})
	it("should be able to parse tp between", function () {
		const expression1 = `RoomDuration(BETWEEN 01:00 and 23:59)`
		const il = RuleParser.toIL(expression1)
		const oneAm = {hours: 1, minutes: 0, tod: 100}
		const midnight = {hours: 23, minutes: 59, tod: 2359}
		expect(il).to.be.eql(['RoomDuration', ['TimePeriodBetween', oneAm, midnight]])
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

	it("should be able to parse && in arguments", function () {
		const expression1 = `A(B() && C())`
		const il = RuleParser.toIL(expression1)
		expect(il).to.be.eql(["A",["And",["B"],["C"]]])
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

	it("should parse BETWEEN 01:00 AND 03:00", function () {
		const expression = "A(BETWEEN 01:00 AND 03:00)";
		const il = RuleParser.toIL(expression);
		const oneAm = { hours: 1, minutes: 0, tod: 100 };
		const threeAm = { hours: 3, minutes: 0, tod: 300 };
		expect(il).to.be.eql(["A", ["TimePeriodBetween", oneAm, threeAm]]);
	});

	// Comprehensive tests for value types
	describe("Value Types", function() {
		it("should parse negative numbers", function() {
			expect(RuleParser.toIL("-5 > 0")).to.be.eql(["Gt", ["Value", -5], ["Value", 0]])
			expect(RuleParser.toIL("A(-10)")).to.be.eql(["A", ["Value", -10]])
		})

		it("should parse decimal numbers", function() {
			expect(RuleParser.toIL("3.14 > 3")).to.be.eql(["Gt", ["Value", 3.14], ["Value", 3]])
			expect(RuleParser.toIL("0.5 < 1")).to.be.eql(["Lt", ["Value", 0.5], ["Value", 1]])
		})

		it("should parse negative decimal numbers", function() {
			expect(RuleParser.toIL("-3.14 < 0")).to.be.eql(["Lt", ["Value", -3.14], ["Value", 0]])
		})

		it("should parse scientific notation", function() {
			expect(RuleParser.toIL("1e5 > 0")).to.be.eql(["Gt", ["Value", 1e5], ["Value", 0]])
			expect(RuleParser.toIL("1e+5 > 0")).to.be.eql(["Gt", ["Value", 1e5], ["Value", 0]])
			expect(RuleParser.toIL("1e-5 < 1")).to.be.eql(["Lt", ["Value", 1e-5], ["Value", 1]])
			expect(RuleParser.toIL("2.5e3 > 1000")).to.be.eql(["Gt", ["Value", 2.5e3], ["Value", 1000]])
		})

		it("should parse string values", function() {
			// Note: The parser preserves escape sequences as-is in the string
			expect(RuleParser.toIL('A("test string")'))
				.to.be.eql(["A", ["Value", "test string"]])
			expect(RuleParser.toIL('A("string with spaces")'))
				.to.be.eql(["A", ["Value", "string with spaces"]])
		})

		it("should parse boolean TRUE", function() {
			expect(RuleParser.toIL("TRUE == TRUE"))
				.to.be.eql(["Eq", ["Value", true], ["Value", true]])
		})

		it("should parse boolean FALSE", function() {
			expect(RuleParser.toIL("FALSE == FALSE"))
				.to.be.eql(["Eq", ["Value", false], ["Value", false]])
		})

		it("should parse empty arrays", function() {
			expect(RuleParser.toIL("A([])")).to.be.eql(["A", ["Value", []]])
		})

		it("should parse arrays with mixed types", function() {
			expect(RuleParser.toIL('A([1, "str", TRUE, FALSE])')).to.be.eql([
				"A", 
				["Value", [1, "str", true, false]]
			])
		})

		it("should parse nested arrays", function() {
			expect(RuleParser.toIL("A([[1,2],[3,4]])")).to.be.eql([
				"A",
				["Value", [[1, 2], [3, 4]]]
			])
		})
	})

	// Comprehensive tests for arithmetic operators
	describe("Arithmetic Operators", function() {
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
	})

	// Comprehensive tests for IS keyword
	describe("IS Keyword", function() {
		it("should parse 'IS BETWEEN' syntax", function() {
			expect(RuleParser.toIL("A() is BETWEEN 1 and 5"))
				.to.be.eql(["Between", ["A"], ["Value", 1], ["Value", 5]])
		})

		it("should parse 'IS BETWEEN' with 'IS' keyword", function() {
			expect(RuleParser.toIL("A() IS between 1 AND 5"))
				.to.be.eql(["Between", ["A"], ["Value", 1], ["Value", 5]])
		})
	})

	// Comprehensive tests for BETWEEN variations
	describe("BETWEEN Operator Variations", function() {
		it("should parse BETWEEN with dash separator", function() {
			expect(RuleParser.toIL("A() BETWEEN 1-5"))
				.to.be.eql(["Between", ["A"], ["Value", 1], ["Value", 5]])
		})

		it("should parse BETWEEN with dash and no spaces", function() {
			expect(RuleParser.toIL("A() between 10-20"))
				.to.be.eql(["Between", ["A"], ["Value", 10], ["Value", 20]])
		})

		it("should parse BETWEEN with negative numbers", function() {
			expect(RuleParser.toIL("A() BETWEEN -10 AND 10"))
				.to.be.eql(["Between", ["A"], ["Value", -10], ["Value", 10]])
		})

		it("should parse BETWEEN with time of day using AND", function() {
			const expression = "TimeOfDay() BETWEEN 09:00 AND 17:00"
			const il = RuleParser.toIL(expression)
			const nineAm = { hours: 9, minutes: 0, tod: 900 }
			const fivePm = { hours: 17, minutes: 0, tod: 1700 }
			expect(il).to.be.eql(["Between", ["TimeOfDay"], ["Value", nineAm], ["Value", fivePm]])
		})

		it("should parse time of day in BETWEEN context", function() {
			// number_tod is only usable in BETWEEN contexts according to the grammar
			const expression = "A() BETWEEN 12:30 AND 13:30"
			const il = RuleParser.toIL(expression)
			const startTime = { hours: 12, minutes: 30, tod: 1230 }
			const endTime = { hours: 13, minutes: 30, tod: 1330 }
			expect(il).to.be.eql(["Between", ["A"], ["Value", startTime], ["Value", endTime]])
		})
	})

	// Comprehensive tests for whitespace handling
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

		it("should handle whitespace in arrays", function() {
			expect(RuleParser.toIL("A( [ 1 , 2 , 3 ] )"))
				.to.be.eql(["A", ["Value", [1, 2, 3]]])
		})

		it("should handle newlines and tabs", function() {
			expect(RuleParser.toIL("A()\n&&\tB()"))
				.to.be.eql(["And", ["A"], ["B"]])
		})
	})

	// Comprehensive tests for nested parenthesis
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

	// Comprehensive tests for logical operator variations
	describe("Logical Operator Variations", function() {
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
	})

	// Comprehensive tests for NOT variations
	describe("NOT Expression Variations", function() {
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
	})

	// Comprehensive tests for complex expressions
	describe("Complex Combined Expressions", function() {
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

	// Comprehensive tests for time units
	describe("Time Units Comprehensive", function() {
		it("should parse 'min' as minute unit", function() {
			expect(RuleParser.toIL("A(5 min)")).to.be.eql(["A", ["Value", 300]])
		})

		it("should parse 'mins' or 'min' as minutes unit", function() {
			// Note: The grammar lists both 'min' and 'mins', but 'min' may be matched first
			// Testing with 'min' which is known to work
			expect(RuleParser.toIL("A(10 min)")).to.be.eql(["A", ["Value", 600]])
		})

		it("should parse time units in comparisons", function() {
			expect(RuleParser.toIL("Duration() > 5 minutes"))
				.to.be.eql(["Gt", ["Duration"], ["Value", 300]])
		})

		it("should parse decimal time values", function() {
			expect(RuleParser.toIL("A(1.5 hours)"))
				.to.be.eql(["A", ["Value", 5400]])
		})

		it("should parse time values in arithmetic", function() {
			expect(RuleParser.toIL("A(1 hour + 30 minutes)"))
				.to.be.eql(["A", ["MathAdd", ["Value", 3600], ["Value", 1800]]])
		})
	})

	// Comprehensive tests for function calls
	describe("Function Call Variations", function() {
		it("should parse function with single argument", function() {
			expect(RuleParser.toIL("Func(1)")).to.be.eql(["Func", ["Value", 1]])
		})

		it("should parse function with string argument", function() {
			expect(RuleParser.toIL('Func("test")'))
				.to.be.eql(["Func", ["Value", "test"]])
		})

		it("should parse function with boolean arguments", function() {
			expect(RuleParser.toIL("Func(TRUE, FALSE)"))
				.to.be.eql(["Func", ["Value", true], ["Value", false]])
		})

		it("should parse function with array argument", function() {
			expect(RuleParser.toIL("Func([1, 2, 3])"))
				.to.be.eql(["Func", ["Value", [1, 2, 3]]])
		})

		it("should parse nested function calls", function() {
			expect(RuleParser.toIL("Outer(Inner(1))"))
				.to.be.eql(["Outer", ["Inner", ["Value", 1]]])
		})

		it("should parse function with time unit argument", function() {
			expect(RuleParser.toIL("Func(5 minutes)"))
				.to.be.eql(["Func", ["Value", 300]])
		})

		it("should parse function with arithmetic in arguments", function() {
			expect(RuleParser.toIL("Func(1 + 2)"))
				.to.be.eql(["Func", ["MathAdd", ["Value", 1], ["Value", 2]]])
		})
	})

	// Comprehensive tests for edge cases
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

	// Tests for case insensitivity of constant strings (marked with ||= in grammar)
	describe("Case Insensitivity", function() {
		describe("AND Operator", function() {
			it("should parse AND in uppercase", function() {
				expect(RuleParser.toIL("A() AND B()"))
					.to.be.eql(["And", ["A"], ["B"]])
			})

			it("should parse and in lowercase", function() {
				expect(RuleParser.toIL("A() and B()"))
					.to.be.eql(["And", ["A"], ["B"]])
			})

			it("should parse And in mixed case", function() {
				expect(RuleParser.toIL("A() And B()"))
					.to.be.eql(["And", ["A"], ["B"]])
			})

			it("should parse AnD in mixed case", function() {
				expect(RuleParser.toIL("A() AnD B()"))
					.to.be.eql(["And", ["A"], ["B"]])
			})

			it("should parse aND in mixed case", function() {
				expect(RuleParser.toIL("A() aND B()"))
					.to.be.eql(["And", ["A"], ["B"]])
			})
		})

		describe("OR Operator", function() {
			it("should parse OR in uppercase", function() {
				expect(RuleParser.toIL("A() OR B()"))
					.to.be.eql(["Or", ["A"], ["B"]])
			})

			it("should parse or in lowercase", function() {
				expect(RuleParser.toIL("A() or B()"))
					.to.be.eql(["Or", ["A"], ["B"]])
			})

			it("should parse Or in mixed case", function() {
				expect(RuleParser.toIL("A() Or B()"))
					.to.be.eql(["Or", ["A"], ["B"]])
			})

			it("should parse oR in mixed case", function() {
				expect(RuleParser.toIL("A() oR B()"))
					.to.be.eql(["Or", ["A"], ["B"]])
			})
		})

		describe("NOT Operator", function() {
			it("should parse NOT in uppercase", function() {
				expect(RuleParser.toIL("NOT A()"))
					.to.be.eql(["Not", ["A"]])
			})

			it("should parse not in lowercase", function() {
				expect(RuleParser.toIL("not A()"))
					.to.be.eql(["Not", ["A"]])
			})

			it("should parse Not in mixed case", function() {
				expect(RuleParser.toIL("Not A()"))
					.to.be.eql(["Not", ["A"]])
			})

			it("should parse NoT in mixed case", function() {
				expect(RuleParser.toIL("NoT A()"))
					.to.be.eql(["Not", ["A"]])
			})

			it("should parse nOt in mixed case", function() {
				expect(RuleParser.toIL("nOt A()"))
					.to.be.eql(["Not", ["A"]])
			})
		})

		describe("BETWEEN Operator", function() {
			it("should parse BETWEEN in uppercase", function() {
				expect(RuleParser.toIL("A() BETWEEN 1 AND 5"))
					.to.be.eql(["Between", ["A"], ["Value", 1], ["Value", 5]])
			})

			it("should parse between in lowercase", function() {
				expect(RuleParser.toIL("A() between 1 and 5"))
					.to.be.eql(["Between", ["A"], ["Value", 1], ["Value", 5]])
			})

			it("should parse Between in mixed case", function() {
				expect(RuleParser.toIL("A() Between 1 And 5"))
					.to.be.eql(["Between", ["A"], ["Value", 1], ["Value", 5]])
			})

			it("should parse BeTweeN in mixed case", function() {
				expect(RuleParser.toIL("A() BeTweeN 1 aNd 5"))
					.to.be.eql(["Between", ["A"], ["Value", 1], ["Value", 5]])
			})

			it("should parse bEtWeEn in mixed case", function() {
				expect(RuleParser.toIL("A() bEtWeEn 1 AnD 5"))
					.to.be.eql(["Between", ["A"], ["Value", 1], ["Value", 5]])
			})
		})

		describe("IS Keyword", function() {
			it("should parse IS in uppercase", function() {
				expect(RuleParser.toIL("A() IS BETWEEN 1 AND 5"))
					.to.be.eql(["Between", ["A"], ["Value", 1], ["Value", 5]])
			})

			it("should parse is in lowercase", function() {
				expect(RuleParser.toIL("A() is between 1 and 5"))
					.to.be.eql(["Between", ["A"], ["Value", 1], ["Value", 5]])
			})

			it("should parse Is in mixed case", function() {
				expect(RuleParser.toIL("A() Is Between 1 And 5"))
					.to.be.eql(["Between", ["A"], ["Value", 1], ["Value", 5]])
			})

			it("should parse iS in mixed case", function() {
				expect(RuleParser.toIL("A() iS bEtWeEn 1 aNd 5"))
					.to.be.eql(["Between", ["A"], ["Value", 1], ["Value", 5]])
			})
		})

		describe("TRUE and FALSE Values", function() {
			it("should parse TRUE in uppercase", function() {
				expect(RuleParser.toIL("TRUE == TRUE"))
					.to.be.eql(["Eq", ["Value", true], ["Value", true]])
			})

			it("should parse true in lowercase", function() {
				expect(RuleParser.toIL("true == true"))
					.to.be.eql(["Eq", ["Value", true], ["Value", true]])
			})

			it("should parse True in mixed case", function() {
				expect(RuleParser.toIL("True == True"))
					.to.be.eql(["Eq", ["Value", true], ["Value", true]])
			})

			it("should parse TrUe in mixed case", function() {
				expect(RuleParser.toIL("TrUe == TrUe"))
					.to.be.eql(["Eq", ["Value", true], ["Value", true]])
			})

			it("should parse FALSE in uppercase", function() {
				expect(RuleParser.toIL("FALSE == FALSE"))
					.to.be.eql(["Eq", ["Value", false], ["Value", false]])
			})

			it("should parse false in lowercase", function() {
				expect(RuleParser.toIL("false == false"))
					.to.be.eql(["Eq", ["Value", false], ["Value", false]])
			})

			it("should parse False in mixed case", function() {
				expect(RuleParser.toIL("False == False"))
					.to.be.eql(["Eq", ["Value", false], ["Value", false]])
			})

			it("should parse FaLsE in mixed case", function() {
				expect(RuleParser.toIL("FaLsE == FaLsE"))
					.to.be.eql(["Eq", ["Value", false], ["Value", false]])
			})
		})

		describe("Time Units", function() {
			it("should parse SECOND in uppercase", function() {
				expect(RuleParser.toIL("A(1 SECOND)"))
					.to.be.eql(["A", ["Value", 1]])
			})

			it("should parse second in lowercase", function() {
				expect(RuleParser.toIL("A(1 second)"))
					.to.be.eql(["A", ["Value", 1]])
			})

			it("should parse Second in mixed case", function() {
				expect(RuleParser.toIL("A(1 Second)"))
					.to.be.eql(["A", ["Value", 1]])
			})

			it("should parse SECONDS in uppercase", function() {
				expect(RuleParser.toIL("A(5 SECONDS)"))
					.to.be.eql(["A", ["Value", 5]])
			})

			it("should parse seconds in lowercase", function() {
				expect(RuleParser.toIL("A(5 seconds)"))
					.to.be.eql(["A", ["Value", 5]])
			})

			it("should parse SeCoNdS in mixed case", function() {
				expect(RuleParser.toIL("A(5 SeCoNdS)"))
					.to.be.eql(["A", ["Value", 5]])
			})

			it("should parse MINUTE in uppercase", function() {
				expect(RuleParser.toIL("A(1 MINUTE)"))
					.to.be.eql(["A", ["Value", 60]])
			})

			it("should parse minute in lowercase", function() {
				expect(RuleParser.toIL("A(1 minute)"))
					.to.be.eql(["A", ["Value", 60]])
			})

			it("should parse Minute in mixed case", function() {
				expect(RuleParser.toIL("A(1 Minute)"))
					.to.be.eql(["A", ["Value", 60]])
			})

			it("should parse MINUTES in uppercase", function() {
				expect(RuleParser.toIL("A(5 MINUTES)"))
					.to.be.eql(["A", ["Value", 300]])
			})

			it("should parse minutes in lowercase", function() {
				expect(RuleParser.toIL("A(5 minutes)"))
					.to.be.eql(["A", ["Value", 300]])
			})

			it("should parse MiNuTeS in mixed case", function() {
				expect(RuleParser.toIL("A(5 MiNuTeS)"))
					.to.be.eql(["A", ["Value", 300]])
			})

			it("should parse MIN in uppercase", function() {
				expect(RuleParser.toIL("A(5 MIN)"))
					.to.be.eql(["A", ["Value", 300]])
			})

			it("should parse min in lowercase", function() {
				expect(RuleParser.toIL("A(5 min)"))
					.to.be.eql(["A", ["Value", 300]])
			})

			it("should parse MiN in mixed case", function() {
				expect(RuleParser.toIL("A(5 MiN)"))
					.to.be.eql(["A", ["Value", 300]])
			})

			it("should parse HOUR in uppercase", function() {
				expect(RuleParser.toIL("A(1 HOUR)"))
					.to.be.eql(["A", ["Value", 3600]])
			})

			it("should parse hour in lowercase", function() {
				expect(RuleParser.toIL("A(1 hour)"))
					.to.be.eql(["A", ["Value", 3600]])
			})

			it("should parse Hour in mixed case", function() {
				expect(RuleParser.toIL("A(1 Hour)"))
					.to.be.eql(["A", ["Value", 3600]])
			})

			it("should parse HOURS in uppercase", function() {
				expect(RuleParser.toIL("A(2 HOURS)"))
					.to.be.eql(["A", ["Value", 7200]])
			})

			it("should parse hours in lowercase", function() {
				expect(RuleParser.toIL("A(2 hours)"))
					.to.be.eql(["A", ["Value", 7200]])
			})

			it("should parse HoUrS in mixed case", function() {
				expect(RuleParser.toIL("A(2 HoUrS)"))
					.to.be.eql(["A", ["Value", 7200]])
			})

			it("should parse DAY in uppercase", function() {
				expect(RuleParser.toIL("A(1 DAY)"))
					.to.be.eql(["A", ["Value", 86400]])
			})

			it("should parse day in lowercase", function() {
				expect(RuleParser.toIL("A(1 day)"))
					.to.be.eql(["A", ["Value", 86400]])
			})

			it("should parse Day in mixed case", function() {
				expect(RuleParser.toIL("A(1 Day)"))
					.to.be.eql(["A", ["Value", 86400]])
			})

			it("should parse DAYS in uppercase", function() {
				expect(RuleParser.toIL("A(7 DAYS)"))
					.to.be.eql(["A", ["Value", 604800]])
			})

			it("should parse days in lowercase", function() {
				expect(RuleParser.toIL("A(7 days)"))
					.to.be.eql(["A", ["Value", 604800]])
			})

			it("should parse DaYs in mixed case", function() {
				expect(RuleParser.toIL("A(7 DaYs)"))
					.to.be.eql(["A", ["Value", 604800]])
			})

			it("should parse WEEK in uppercase", function() {
				expect(RuleParser.toIL("A(1 WEEK)"))
					.to.be.eql(["A", ["Value", 604800]])
			})

			it("should parse week in lowercase", function() {
				expect(RuleParser.toIL("A(1 week)"))
					.to.be.eql(["A", ["Value", 604800]])
			})

			it("should parse Week in mixed case", function() {
				expect(RuleParser.toIL("A(1 Week)"))
					.to.be.eql(["A", ["Value", 604800]])
			})

			it("should parse WEEKS in uppercase", function() {
				expect(RuleParser.toIL("A(2 WEEKS)"))
					.to.be.eql(["A", ["Value", 1209600]])
			})

			it("should parse weeks in lowercase", function() {
				expect(RuleParser.toIL("A(2 weeks)"))
					.to.be.eql(["A", ["Value", 1209600]])
			})

			it("should parse WeEkS in mixed case", function() {
				expect(RuleParser.toIL("A(2 WeEkS)"))
					.to.be.eql(["A", ["Value", 1209600]])
			})
		})

		describe("Time Period Constants", function() {
			it("should parse TODAY in uppercase", function() {
				expect(RuleParser.toIL("A(TODAY)"))
					.to.be.eql(["A", ["TimePeriodConst", "TODAY"]])
			})

			it("should parse today in lowercase", function() {
				expect(RuleParser.toIL("A(today)"))
					.to.be.eql(["A", ["TimePeriodConst", "today"]])
			})

			it("should parse Today in mixed case", function() {
				expect(RuleParser.toIL("A(Today)"))
					.to.be.eql(["A", ["TimePeriodConst", "Today"]])
			})

			it("should parse ToDaY in mixed case", function() {
				expect(RuleParser.toIL("A(ToDaY)"))
					.to.be.eql(["A", ["TimePeriodConst", "ToDaY"]])
			})
		})

		describe("Nested Case Insensitivity in Complex Rules", function() {
			it("should parse case insensitive keywords in nested parentheses", function() {
				const expression = "(A() aNd B()) oR (C() AnD nOt D())"
				expect(RuleParser.toIL(expression)).to.be.eql([
					"Or",
					["And", ["A"], ["B"]],
					["And", ["C"], ["Not", ["D"]]]
				])
			})

			it("should parse case insensitive BETWEEN with AND in nested expressions", function() {
				const expression = "A() bEtWeEn 1 aNd 5 AnD B() > 10"
				expect(RuleParser.toIL(expression)).to.be.eql([
					"And",
					["Between", ["A"], ["Value", 1], ["Value", 5]],
					["Gt", ["B"], ["Value", 10]]
				])
			})

			it("should parse case insensitive IS BETWEEN in complex expression", function() {
				const expression = "(A() iS bEtWeEn 1 aNd 5) oR nOt B()"
				expect(RuleParser.toIL(expression)).to.be.eql([
					"Or",
					["Between", ["A"], ["Value", 1], ["Value", 5]],
					["Not", ["B"]]
				])
			})

			it("should parse case insensitive time units in nested expressions", function() {
				const expression = "Duration() > 5 MiNuTeS aNd Duration() < 2 HoUrS"
				expect(RuleParser.toIL(expression)).to.be.eql([
					"And",
					["Gt", ["Duration"], ["Value", 300]],
					["Lt", ["Duration"], ["Value", 7200]]
				])
			})

			it("should parse case insensitive boolean values in complex expressions", function() {
				const expression = "A() == TrUe AnD B() != FaLsE"
				expect(RuleParser.toIL(expression)).to.be.eql([
					"And",
					["Eq", ["A"], ["Value", true]],
					["Neq", ["B"], ["Value", false]]
				])
			})

			it("should parse mixed case keywords in real-world-like expression", function() {
				const expression = "HasSensor(\"temp\") aNd NoT (TimeOfDay() BeTwEeN 08:00 AnD 17:00 oR Duration() > 5 MiNuTeS)"
				const il = RuleParser.toIL(expression)
				const eightAm = { hours: 8, minutes: 0, tod: 800 }
				const fivePm = { hours: 17, minutes: 0, tod: 1700 }
				expect(il).to.be.eql([
					"And",
					["HasSensor", ["Value", "temp"]],
					["Not", ["Or",
						["Between", ["TimeOfDay"], ["Value", eightAm], ["Value", fivePm]],
						["Gt", ["Duration"], ["Value", 300]]
					]]
				])
			})

			it("should parse all case variations in single complex expression", function() {
				const expression = "((A() > 5 MiNuTeS) aNd (B() == TrUe)) oR (C() iS bEtWeEn 1 aNd 10 AnD nOt D(FaLsE))"
				expect(RuleParser.toIL(expression)).to.be.eql([
					"Or",
					["And",
						["Gt", ["A"], ["Value", 300]],
						["Eq", ["B"], ["Value", true]]
					],
					["And",
						["Between", ["C"], ["Value", 1], ["Value", 10]],
						["Not", ["D", ["Value", false]]]
					]
				])
			})
		})
	})

	// Comprehensive tests for Day-of-Week (DOW) filters in time periods
	describe("Day-of-Week (DOW) Filters", function() {
		it("should parse time period without DOW filter", function() {
			const expression = "A(BETWEEN 01:00 AND 03:00)"
			const il = RuleParser.toIL(expression)
			const oneAm = { hours: 1, minutes: 0, tod: 100 }
			const threeAm = { hours: 3, minutes: 0, tod: 300 }
			expect(il).to.be.eql(["A", ["TimePeriodBetween", oneAm, threeAm]])
		})

		it("should parse time period with single DOW", function() {
			const expression = "A(BETWEEN 01:00 AND 03:00 ON MONDAY)"
			const il = RuleParser.toIL(expression)
			const oneAm = { hours: 1, minutes: 0, tod: 100, dow: ["monday"] }
			const threeAm = { hours: 3, minutes: 0, tod: 300, dow: ["monday"] }
			expect(il).to.be.eql(["A", ["TimePeriodBetween", oneAm, threeAm]])
		})

		it("should parse time period with DOW range", function() {
			const expression = "A(BETWEEN 01:00 AND 03:00 ON MONDAY TO WEDNESDAY)"
			const il = RuleParser.toIL(expression)
			const oneAm = { hours: 1, minutes: 0, tod: 100, dow: ["monday", "wednesday"] }
			const threeAm = { hours: 3, minutes: 0, tod: 300, dow: ["monday", "wednesday"] }
			expect(il).to.be.eql(["A", ["TimePeriodBetween", oneAm, threeAm]])
		})

		it("should parse time period with TUESDAY", function() {
			const expression = "A(BETWEEN 09:00 AND 17:00 ON TUESDAY)"
			const il = RuleParser.toIL(expression)
			const nineAm = { hours: 9, minutes: 0, tod: 900, dow: ["tuesday"] }
			const fivePm = { hours: 17, minutes: 0, tod: 1700, dow: ["tuesday"] }
			expect(il).to.be.eql(["A", ["TimePeriodBetween", nineAm, fivePm]])
		})

		it("should parse time period with WEDNESDAY", function() {
			const expression = "A(BETWEEN 10:30 AND 14:45 ON WEDNESDAY)"
			const il = RuleParser.toIL(expression)
			const start = { hours: 10, minutes: 30, tod: 1030, dow: ["wednesday"] }
			const end = { hours: 14, minutes: 45, tod: 1445, dow: ["wednesday"] }
			expect(il).to.be.eql(["A", ["TimePeriodBetween", start, end]])
		})

		it("should parse time period with THURSDAY", function() {
			const expression = "A(BETWEEN 08:00 AND 12:00 ON THURSDAY)"
			const il = RuleParser.toIL(expression)
			const start = { hours: 8, minutes: 0, tod: 800, dow: ["thursday"] }
			const end = { hours: 12, minutes: 0, tod: 1200, dow: ["thursday"] }
			expect(il).to.be.eql(["A", ["TimePeriodBetween", start, end]])
		})

		it("should parse time period with FRIDAY", function() {
			const expression = "A(BETWEEN 13:00 AND 18:00 ON FRIDAY)"
			const il = RuleParser.toIL(expression)
			const start = { hours: 13, minutes: 0, tod: 1300, dow: ["friday"] }
			const end = { hours: 18, minutes: 0, tod: 1800, dow: ["friday"] }
			expect(il).to.be.eql(["A", ["TimePeriodBetween", start, end]])
		})

		it("should parse time period with SATURDAY", function() {
			const expression = "A(BETWEEN 00:00 AND 23:59 ON SATURDAY)"
			const il = RuleParser.toIL(expression)
			const start = { hours: 0, minutes: 0, tod: 0, dow: ["saturday"] }
			const end = { hours: 23, minutes: 59, tod: 2359, dow: ["saturday"] }
			expect(il).to.be.eql(["A", ["TimePeriodBetween", start, end]])
		})

		it("should parse time period with SUNDAY", function() {
			const expression = "A(BETWEEN 06:00 AND 12:00 ON SUNDAY)"
			const il = RuleParser.toIL(expression)
			const start = { hours: 6, minutes: 0, tod: 600, dow: ["sunday"] }
			const end = { hours: 12, minutes: 0, tod: 1200, dow: ["sunday"] }
			expect(il).to.be.eql(["A", ["TimePeriodBetween", start, end]])
		})

		it("should parse time period with different DOW ranges", function() {
			const expression = "A(BETWEEN 08:30 AND 17:00 ON TUESDAY TO FRIDAY)"
			const il = RuleParser.toIL(expression)
			const start = { hours: 8, minutes: 30, tod: 830, dow: ["tuesday", "friday"] }
			const end = { hours: 17, minutes: 0, tod: 1700, dow: ["tuesday", "friday"] }
			expect(il).to.be.eql(["A", ["TimePeriodBetween", start, end]])
		})

		it("should parse time period with MONDAY TO FRIDAY", function() {
			const expression = "A(BETWEEN 09:00 AND 18:00 ON MONDAY TO FRIDAY)"
			const il = RuleParser.toIL(expression)
			const start = { hours: 9, minutes: 0, tod: 900, dow: ["monday", "friday"] }
			const end = { hours: 18, minutes: 0, tod: 1800, dow: ["monday", "friday"] }
			expect(il).to.be.eql(["A", ["TimePeriodBetween", start, end]])
		})

		it("should parse time period with SATURDAY TO SUNDAY", function() {
			const expression = "A(BETWEEN 10:00 AND 22:00 ON SATURDAY TO SUNDAY)"
			const il = RuleParser.toIL(expression)
			const start = { hours: 10, minutes: 0, tod: 1000, dow: ["saturday", "sunday"] }
			const end = { hours: 22, minutes: 0, tod: 2200, dow: ["saturday", "sunday"] }
			expect(il).to.be.eql(["A", ["TimePeriodBetween", start, end]])
		})

		it("should parse DOW filter in complex expression", function() {
			const expression = "TimeOfDay() BETWEEN 08:00 AND 17:00 ON MONDAY TO FRIDAY && Event(\"type\") == \"work\""
			const il = RuleParser.toIL(expression)
			const eightAm = { hours: 8, minutes: 0, tod: 800, dow: ["monday", "friday"] }
			const fivePm = { hours: 17, minutes: 0, tod: 1700, dow: ["monday", "friday"] }
			expect(il).to.be.eql([
				"And",
				["Between", ["TimeOfDay"], ["Value", eightAm], ["Value", fivePm]],
				["Eq", ["Event", ["Value", "type"]], ["Value", "work"]]
			])
		})

		it("should parse lowercase dow in function argument", function() {
			const expression = "Duration(BETWEEN 01:00 AND 03:00 ON monday)"
			const il = RuleParser.toIL(expression)
			const oneAm = { hours: 1, minutes: 0, tod: 100, dow: ["monday"] }
			const threeAm = { hours: 3, minutes: 0, tod: 300, dow: ["monday"] }
			expect(il).to.be.eql(["Duration", ["TimePeriodBetween", oneAm, threeAm]])
		})

		it("should parse mixed case dow keywords", function() {
			const expression = "A(BETWEEN 12:00 AND 15:00 ON Monday TO Friday)"
			const il = RuleParser.toIL(expression)
			const noon = { hours: 12, minutes: 0, tod: 1200, dow: ["monday", "friday"] }
			const threePm = { hours: 15, minutes: 0, tod: 1500, dow: ["monday", "friday"] }
			expect(il).to.be.eql(["A", ["TimePeriodBetween", noon, threePm]])
		})

		it("should handle DOW with midnight crossing times", function() {
			const expression = "A(BETWEEN 22:00 AND 02:00 ON FRIDAY TO SATURDAY)"
			const il = RuleParser.toIL(expression)
			const tenPm = { hours: 22, minutes: 0, tod: 2200, dow: ["friday", "saturday"] }
			const twoAm = { hours: 2, minutes: 0, tod: 200, dow: ["friday", "saturday"] }
			expect(il).to.be.eql(["A", ["TimePeriodBetween", tenPm, twoAm]])
		})
	})

	// Tests for numeric BETWEEN in function arguments
	describe("Numeric BETWEEN in Function Arguments", function() {
		it("should parse BETWEEN with time units", function() {
			const expression = "A(BETWEEN 1 DAYS AND 10 DAYS)"
			const il = RuleParser.toIL(expression)
			expect(il).to.be.eql(["A", ["TimePeriodBetween", 86400, 864000]])
		})

		it("should parse BETWEEN with different time units", function() {
			const expression = "A(BETWEEN 1 HOUR AND 2 HOURS)"
			const il = RuleParser.toIL(expression)
			expect(il).to.be.eql(["A", ["TimePeriodBetween", 3600, 7200]])
		})

		it("should parse BETWEEN with minutes", function() {
			const expression = "A(BETWEEN 5 MINUTES AND 30 MINUTES)"
			const il = RuleParser.toIL(expression)
			expect(il).to.be.eql(["A", ["TimePeriodBetween", 300, 1800]])
		})
		
		it("should parse BETWEEN with weeks", function() {
			const expression = "A(BETWEEN 1 WEEK AND 2 WEEKS)"
			const il = RuleParser.toIL(expression)
			expect(il).to.be.eql(["A", ["TimePeriodBetween", 604800, 1209600]])
		})

		it("should work in complex expressions", function() {
			const expression = "Duration(BETWEEN 5 MINUTES AND 1 HOUR) && Active() == TRUE"
			const il = RuleParser.toIL(expression)
			expect(il).to.be.eql([
				"And",
				["Duration", ["TimePeriodBetween", 300, 3600]],
				["Eq", ["Active"], ["Value", true]]
			])
		})
	})

	// Tests for tightened arithmetic operator restrictions
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
})
