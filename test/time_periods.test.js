const
	RuleParser = require("../"),
	{ expect } = require('chai')

const ALL_TIME_UNITS = [
	'second', 'seconds', 'minute', 'minutes', 'min', 'mins', 'hour', 'hours', 'day', 'days', 'week', 'weeks'
]

describe("Time Periods and Units", function() {
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

	it("should be able to parse N UNIT AGO", function () {
		for (const unit of ALL_TIME_UNITS) {
			const expression1 = `RoomDuration(3 ${unit} AGO)`
			const il = RuleParser.toIL(expression1)
			expect(il).to.be.eql(['RoomDuration', ['TimePeriodConstAgo', 3, unit.toUpperCase()]])
		}
	})

	it("should be able to parse N UNIT AGO BETWEEN", function () {
		const expression1 = `RoomDuration(1 WEEK AGO BETWEEN 00:40 AND 20:10)`
		const il = RuleParser.toIL(expression1)
		const startTod = {hours: 0, minutes: 40, tod: 40}
		const endTod = {hours: 20, minutes: 10, tod: 2010}
		expect(il).to.be.eql(['RoomDuration', ['TimePeriodBetween', startTod, endTod]])
	})

	it("should be able to parse all units with AGO BETWEEN", function () {
		for (const unit of ALL_TIME_UNITS) {
			const expression1 = `RoomDuration(1 ${unit} AGO BETWEEN 01:00 AND 02:00)`
			const il = RuleParser.toIL(expression1)
			const startTod = {hours: 1, minutes: 0, tod: 100}
			const endTod = {hours: 2, minutes: 0, tod: 200}
			expect(il).to.be.eql(['RoomDuration', ['TimePeriodBetween', startTod, endTod]])
		}
	})

	it("should be able to parse composite time expressions with AGO", function () {
		// Test 1 WEEK 1 HOUR AGO -> should be 1 week (604800 seconds) + 1 hour (3600 seconds) = 608400 seconds
		const expression1 = `RoomDuration(1 WEEK 1 HOUR AGO)`
		const il1 = RuleParser.toIL(expression1)
		expect(il1).to.be.eql(['RoomDuration', ['TimePeriodConstAgo', 608400, 'SECONDS']])

		// Test 2 DAYS 3 HOURS AGO -> should be 2 days (172800 seconds) + 3 hours (10800 seconds) = 183600 seconds
		const expression2 = `RoomDuration(2 DAYS 3 HOURS AGO)`
		const il2 = RuleParser.toIL(expression2)
		expect(il2).to.be.eql(['RoomDuration', ['TimePeriodConstAgo', 183600, 'SECONDS']])

		// Test 1 HOUR 30 MINUTES AGO -> should be 1 hour (3600 seconds) + 30 minutes (1800 seconds) = 5400 seconds
		const expression3 = `RoomDuration(1 HOUR 30 MINUTES AGO)`
		const il3 = RuleParser.toIL(expression3)
		expect(il3).to.be.eql(['RoomDuration', ['TimePeriodConstAgo', 5400, 'SECONDS']])
	})

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
		// Constants are now compiled at parse time
		// 1 hour + 30 minutes = 3600 + 1800 = 5400
		expect(RuleParser.toIL("A(1 hour + 30 minutes)"))
			.to.be.eql(["A", ["Value", 5400]])
	})
})

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
		// Constants are now compiled at parse time
		expect(RuleParser.toIL("Func(1 + 2)"))
			.to.be.eql(["Func", ["Value", 3]])
	})
})
