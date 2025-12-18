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
		const expression1 = `RoomDuration(BETWEEN 01:00 and 24:00)`
		const il = RuleParser.toIL(expression1)
		const oneAm = {hours: 1, minutes: 0, tod: 100}
		const midnight = {hours: 24, minutes: 0, tod: 2400}
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
});
