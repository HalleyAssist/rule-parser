const
	RuleParser = require("../"),
	{ expect } = require('chai')

describe("Basic Parsing", function () {
	it("parse basic", function () {
		expect(RuleParser.toIL("1 > 2")).to.be.eql(["Gt", ["Value", 1], ["Value", 2]])
		expect(RuleParser.toIL("AFunction(1,2) > 3")).to.be.eql(["Gt", ["AFunction", ["Value", 1], ["Value", 2]], ["Value", 3]])
		expect(RuleParser.toIL("AFunction(1,2)")).to.be.eql(["AFunction", ["Value", 1], ["Value", 2]])
		expect(RuleParser.toIL("AFunction(\"string\",2) == \"string\"")).to.be.eql(["Eq", ["AFunction", ["Value", "string"], ["Value", 2]], ["Value", "string"]])
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

	it("should parse BETWEEN 01:00 AND 03:00", function () {
		const oneAm = {hours: 1, minutes: 0, tod: 100}
		const threeAm = {hours: 3, minutes: 0, tod: 300}
		const expression1 = `RoomDuration(BETWEEN 01:00 AND 03:00)`
		expect(RuleParser.toIL(expression1)).to.be.eql([
			'RoomDuration',
			['TimePeriodBetween', oneAm, threeAm]
		])
	})
})
