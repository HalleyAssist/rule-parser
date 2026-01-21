const
	RuleParser = require("../"),
	{ expect } = require('chai')

describe("BETWEEN Operator", function() {
	it("should be able to parse the between operator", function () {
		const expression1 = `RoomDuration("Room 1") between 1 and 5`
		expect(RuleParser.toIL(expression1)).to.be.eql(['Between', ["RoomDuration", ["Value", "Room 1"]], ["Value", 1], ["Value", 5]])
	})

	it("should parse 'IS BETWEEN' syntax", function() {
		expect(RuleParser.toIL("A() is BETWEEN 1 and 5"))
			.to.be.eql(["Between", ["A"], ["Value", 1], ["Value", 5]])
	})

	it("should parse 'IS BETWEEN' with 'IS' keyword", function() {
		expect(RuleParser.toIL("A() IS between 1 AND 5"))
			.to.be.eql(["Between", ["A"], ["Value", 1], ["Value", 5]])
	})

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
