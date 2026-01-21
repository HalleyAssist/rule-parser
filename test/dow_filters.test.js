const
	RuleParser = require("../"),
	{ expect } = require('chai')

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
		const oneAm = { hours: 1, minutes: 0, tod: 100, dow: "MONDAY" }
		const threeAm = { hours: 3, minutes: 0, tod: 300, dow: "MONDAY" }
		expect(il).to.be.eql(["A", ["TimePeriodBetween", oneAm, threeAm]])
	})

	it("should parse time period with DOW range", function() {
		const expression = "A(BETWEEN 01:00 AND 03:00 ON MONDAY TO WEDNESDAY)"
		const il = RuleParser.toIL(expression)
		const oneAm = { hours: 1, minutes: 0, tod: 100, dow: "WEDNESDAY" }
		const threeAm = { hours: 3, minutes: 0, tod: 300, dow: "WEDNESDAY" }
		expect(il).to.be.eql(["A", ["TimePeriodBetween", oneAm, threeAm]])
	})

	it("should parse time period with TUESDAY", function() {
		const expression = "A(BETWEEN 09:00 AND 17:00 ON TUESDAY)"
		const il = RuleParser.toIL(expression)
		const nineAm = { hours: 9, minutes: 0, tod: 900, dow: "TUESDAY" }
		const fivePm = { hours: 17, minutes: 0, tod: 1700, dow: "TUESDAY" }
		expect(il).to.be.eql(["A", ["TimePeriodBetween", nineAm, fivePm]])
	})

	it("should parse time period with WEDNESDAY", function() {
		const expression = "A(BETWEEN 10:30 AND 14:45 ON WEDNESDAY)"
		const il = RuleParser.toIL(expression)
		const start = { hours: 10, minutes: 30, tod: 1030, dow: "WEDNESDAY" }
		const end = { hours: 14, minutes: 45, tod: 1445, dow: "WEDNESDAY" }
		expect(il).to.be.eql(["A", ["TimePeriodBetween", start, end]])
	})

	it("should parse time period with THURSDAY", function() {
		const expression = "A(BETWEEN 08:00 AND 12:00 ON THURSDAY)"
		const il = RuleParser.toIL(expression)
		const start = { hours: 8, minutes: 0, tod: 800, dow: "THURSDAY" }
		const end = { hours: 12, minutes: 0, tod: 1200, dow: "THURSDAY" }
		expect(il).to.be.eql(["A", ["TimePeriodBetween", start, end]])
	})

	it("should parse time period with FRIDAY", function() {
		const expression = "A(BETWEEN 13:00 AND 18:00 ON FRIDAY)"
		const il = RuleParser.toIL(expression)
		const start = { hours: 13, minutes: 0, tod: 1300, dow: "FRIDAY" }
		const end = { hours: 18, minutes: 0, tod: 1800, dow: "FRIDAY" }
		expect(il).to.be.eql(["A", ["TimePeriodBetween", start, end]])
	})

	it("should parse time period with SATURDAY", function() {
		const expression = "A(BETWEEN 00:00 AND 23:59 ON SATURDAY)"
		const il = RuleParser.toIL(expression)
		const start = { hours: 0, minutes: 0, tod: 0, dow: "SATURDAY" }
		const end = { hours: 23, minutes: 59, tod: 2359, dow: "SATURDAY" }
		expect(il).to.be.eql(["A", ["TimePeriodBetween", start, end]])
	})

	it("should parse time period with SUNDAY", function() {
		const expression = "A(BETWEEN 06:00 AND 12:00 ON SUNDAY)"
		const il = RuleParser.toIL(expression)
		const start = { hours: 6, minutes: 0, tod: 600, dow: "SUNDAY" }
		const end = { hours: 12, minutes: 0, tod: 1200, dow: "SUNDAY" }
		expect(il).to.be.eql(["A", ["TimePeriodBetween", start, end]])
	})

	it("should parse time period with different DOW ranges", function() {
		const expression = "A(BETWEEN 08:30 AND 17:00 ON TUESDAY TO FRIDAY)"
		const il = RuleParser.toIL(expression)
		const start = { hours: 8, minutes: 30, tod: 830, dow: "FRIDAY" }
		const end = { hours: 17, minutes: 0, tod: 1700, dow: "FRIDAY" }
		expect(il).to.be.eql(["A", ["TimePeriodBetween", start, end]])
	})

	it("should parse time period with MONDAY TO FRIDAY", function() {
		const expression = "A(BETWEEN 09:00 AND 18:00 ON MONDAY TO FRIDAY)"
		const il = RuleParser.toIL(expression)
		const start = { hours: 9, minutes: 0, tod: 900, dow: "FRIDAY" }
		const end = { hours: 18, minutes: 0, tod: 1800, dow: "FRIDAY" }
		expect(il).to.be.eql(["A", ["TimePeriodBetween", start, end]])
	})

	it("should parse time period with SATURDAY TO SUNDAY", function() {
		const expression = "A(BETWEEN 10:00 AND 22:00 ON SATURDAY TO SUNDAY)"
		const il = RuleParser.toIL(expression)
		const start = { hours: 10, minutes: 0, tod: 1000, dow: "SUNDAY" }
		const end = { hours: 22, minutes: 0, tod: 2200, dow: "SUNDAY" }
		expect(il).to.be.eql(["A", ["TimePeriodBetween", start, end]])
	})

	it("should parse DOW filter in complex expression", function() {
		const expression = "TimeOfDay() BETWEEN 08:00 AND 17:00 ON MONDAY TO FRIDAY && Event(\"type\") == \"work\""
		const il = RuleParser.toIL(expression)
		const eightAm = { hours: 8, minutes: 0, tod: 800, dow: "FRIDAY" }
		const fivePm = { hours: 17, minutes: 0, tod: 1700, dow: "FRIDAY" }
		expect(il).to.be.eql([
			"And",
			["Between", ["TimeOfDay"], ["Value", eightAm], ["Value", fivePm]],
			["Eq", ["Event", ["Value", "type"]], ["Value", "work"]]
		])
	})

	it("should parse lowercase dow in function argument", function() {
		const expression = "Duration(BETWEEN 01:00 AND 03:00 ON monday)"
		const il = RuleParser.toIL(expression)
		const oneAm = { hours: 1, minutes: 0, tod: 100, dow: "MONDAY" }
		const threeAm = { hours: 3, minutes: 0, tod: 300, dow: "MONDAY" }
		expect(il).to.be.eql(["Duration", ["TimePeriodBetween", oneAm, threeAm]])
	})

	it("should parse mixed case dow keywords", function() {
		const expression = "A(BETWEEN 12:00 AND 15:00 ON Monday TO Friday)"
		const il = RuleParser.toIL(expression)
		const noon = { hours: 12, minutes: 0, tod: 1200, dow: "FRIDAY" }
		const threePm = { hours: 15, minutes: 0, tod: 1500, dow: "FRIDAY" }
		expect(il).to.be.eql(["A", ["TimePeriodBetween", noon, threePm]])
	})

	it("should handle DOW with midnight crossing times", function() {
		const expression = "A(BETWEEN 22:00 AND 02:00 ON FRIDAY TO SATURDAY)"
		const il = RuleParser.toIL(expression)
		const tenPm = { hours: 22, minutes: 0, tod: 2200, dow: "SATURDAY" }
		const twoAm = { hours: 2, minutes: 0, tod: 200, dow: "SATURDAY" }
		expect(il).to.be.eql(["A", ["TimePeriodBetween", tenPm, twoAm]])
	})

	it("should parse BETWEEN time units with single DOW", function() {
		const expression = "A(BETWEEN 1 HOUR AND 2 HOURS ON MONDAY)"
		const il = RuleParser.toIL(expression)
		expect(il).to.be.eql(["A", ["TimePeriodBetween", 3600, 7200, "MONDAY"]])
	})

	it("should parse BETWEEN time units with DOW range", function() {
		const expression = "A(BETWEEN 5 MINUTES AND 30 MINUTES ON MONDAY TO FRIDAY)"
		const il = RuleParser.toIL(expression)
		expect(il).to.be.eql(["A", ["TimePeriodBetween", 300, 1800, "MONDAY", "FRIDAY"]])
	})

	it("should parse BETWEEN days with DOW filter", function() {
		const expression = "A(BETWEEN 1 DAY AND 7 DAYS ON SATURDAY TO SUNDAY)"
		const il = RuleParser.toIL(expression)
		expect(il).to.be.eql(["A", ["TimePeriodBetween", 86400, 604800, "SATURDAY", "SUNDAY"]])
	})

	it("should parse BETWEEN weeks with DOW filter", function() {
		const expression = "A(BETWEEN 1 WEEK AND 2 WEEKS ON TUESDAY)"
		const il = RuleParser.toIL(expression)
		expect(il).to.be.eql(["A", ["TimePeriodBetween", 604800, 1209600, "TUESDAY"]])
	})

	it("should parse BETWEEN seconds with DOW range", function() {
		const expression = "A(BETWEEN 10 SECONDS AND 60 SECONDS ON WEDNESDAY TO THURSDAY)"
		const il = RuleParser.toIL(expression)
		expect(il).to.be.eql(["A", ["TimePeriodBetween", 10, 60, "WEDNESDAY", "THURSDAY"]])
	})

	it("should parse BETWEEN minutes with all day names", function() {
		const expression = "A(BETWEEN 15 MINS AND 45 MINS ON THURSDAY TO FRIDAY)"
		const il = RuleParser.toIL(expression)
		expect(il).to.be.eql(["A", ["TimePeriodBetween", 900, 2700, "THURSDAY", "FRIDAY"]])
	})

	it("should parse BETWEEN with abbreviated DOW names", function() {
		const expression = "A(BETWEEN 2 HOURS AND 4 HOURS ON MON TO FRI)"
		const il = RuleParser.toIL(expression)
		expect(il).to.be.eql(["A", ["TimePeriodBetween", 7200, 14400, "MONDAY", "FRIDAY"]])
	})

	it("should parse BETWEEN with mixed case time units and DOW", function() {
		const expression = "A(BETWEEN 1 Hour AND 3 Hours ON monday)"
		const il = RuleParser.toIL(expression)
		expect(il).to.be.eql(["A", ["TimePeriodBetween", 3600, 10800, "MONDAY"]])
	})

	it("should work in complex expressions with DOW", function() {
		const expression = "Duration(BETWEEN 1 HOUR AND 4 HOURS ON MONDAY TO FRIDAY) && Active() == TRUE"
		const il = RuleParser.toIL(expression)
		expect(il).to.be.eql([
			"And",
			["Duration", ["TimePeriodBetween", 3600, 14400, "MONDAY", "FRIDAY"]],
			["Eq", ["Active"], ["Value", true]]
		])
	})

	it("should parse BETWEEN time units without DOW (regression test)", function() {
		const expression = "A(BETWEEN 1 DAY AND 10 DAYS)"
		const il = RuleParser.toIL(expression)
		// Should return just 2 arguments when DOW is not specified
		expect(il).to.be.eql(["A", ["TimePeriodBetween", 86400, 864000]])
	})

	it("should parse BETWEEN with dash separator and DOW", function() {
		const expression = "A(BETWEEN 1 HOUR-2 HOURS ON SATURDAY)"
		const il = RuleParser.toIL(expression)
		expect(il).to.be.eql(["A", ["TimePeriodBetween", 3600, 7200, "SATURDAY"]])
	})

	it("should parse multiple DOW ranges in same expression", function() {
		const expression = "A(BETWEEN 1 HOUR AND 2 HOURS ON MONDAY) && B(BETWEEN 3 HOURS AND 4 HOURS ON FRIDAY)"
		const il = RuleParser.toIL(expression)
		expect(il).to.be.eql([
			"And",
			["A", ["TimePeriodBetween", 3600, 7200, "MONDAY"]],
			["B", ["TimePeriodBetween", 10800, 14400, "FRIDAY"]]
		])
	})

	it("should parse BETWEEN with single day abbreviations", function() {
		const expression = "A(BETWEEN 30 MINUTES AND 90 MINUTES ON SAT TO SUN)"
		const il = RuleParser.toIL(expression)
		expect(il).to.be.eql(["A", ["TimePeriodBetween", 1800, 5400, "SATURDAY", "SUNDAY"]])
	})
})
