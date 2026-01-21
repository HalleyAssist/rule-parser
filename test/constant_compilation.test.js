const
	RuleParser = require("../"),
	{ expect } = require('chai')

describe("Constant Expression Compilation", function() {
	describe("Basic Constant Arithmetic", function() {
		it("should compile out constant addition", function() {
			const il = RuleParser.toIL("10 + 5")
			expect(il).to.be.eql(["Value", 15])
		})

		it("should compile out constant subtraction", function() {
			const il = RuleParser.toIL("10 - 5")
			expect(il).to.be.eql(["Value", 5])
		})

		it("should compile out constant multiplication", function() {
			const il = RuleParser.toIL("10 * 5")
			expect(il).to.be.eql(["Value", 50])
		})

		it("should compile out constant division", function() {
			const il = RuleParser.toIL("10 / 5")
			expect(il).to.be.eql(["Value", 2])
		})

		it("should compile out constant modulus", function() {
			const il = RuleParser.toIL("10 % 3")
			expect(il).to.be.eql(["Value", 1])
		})
	})

	describe("Time Unit Constant Compilation", function() {
		it("should compile out 1 HOUR + 1 WEEK", function() {
			const il = RuleParser.toIL("1 hour + 1 week")
			// 1 hour = 3600 seconds, 1 week = 604800 seconds
			expect(il).to.be.eql(["Value", 608400])
		})

		it("should compile out 1 HOUR + 30 MINUTES", function() {
			const il = RuleParser.toIL("1 hour + 30 minutes")
			// 1 hour = 3600 seconds, 30 minutes = 1800 seconds
			expect(il).to.be.eql(["Value", 5400])
		})

		it("should compile out 2 DAYS - 3 HOURS", function() {
			const il = RuleParser.toIL("2 days - 3 hours")
			// 2 days = 172800 seconds, 3 hours = 10800 seconds
			expect(il).to.be.eql(["Value", 162000])
		})

		it("should compile out 1 WEEK * 2", function() {
			const il = RuleParser.toIL("1 week * 2")
			// 1 week = 604800 seconds
			expect(il).to.be.eql(["Value", 1209600])
		})

		it("should compile out 1 HOUR / 2", function() {
			const il = RuleParser.toIL("1 hour / 2")
			// 1 hour = 3600 seconds
			expect(il).to.be.eql(["Value", 1800])
		})

		it("should compile out 1 WEEK % 3 DAYS", function() {
			const il = RuleParser.toIL("1 week % 3 days")
			// 1 week = 604800 seconds, 3 days = 259200 seconds
			expect(il).to.be.eql(["Value", 86400])
		})
	})

	describe("Decimal and Fractional Constants", function() {
		it("should compile out decimal addition", function() {
			const il = RuleParser.toIL("1.5 + 2.5")
			expect(il).to.be.eql(["Value", 4])
		})

		it("should compile out decimal with time units", function() {
			const il = RuleParser.toIL("1.5 hours + 0.5 hours")
			// 1.5 hours = 5400 seconds, 0.5 hours = 1800 seconds
			expect(il).to.be.eql(["Value", 7200])
		})

		it("should handle division with decimals", function() {
			const il = RuleParser.toIL("5 / 2")
			expect(il).to.be.eql(["Value", 2.5])
		})
	})

	describe("Non-Constant Expressions Should Not Be Compiled", function() {
		it("should not compile function call + constant", function() {
			const il = RuleParser.toIL("A() + 5")
			expect(il).to.be.eql(["MathAdd", ["A"], ["Value", 5]])
		})

		it("should not compile constant + function call", function() {
			const il = RuleParser.toIL("5 + A()")
			expect(il).to.be.eql(["MathAdd", ["Value", 5], ["A"]])
		})

		it("should not compile function + function", function() {
			const il = RuleParser.toIL("A() + B()")
			expect(il).to.be.eql(["MathAdd", ["A"], ["B"]])
		})

		it("should partially compile mixed expressions", function() {
			// A() + (5 + 10) should become A() + 15
			const il = RuleParser.toIL("A() + 5 + 10")
			// Due to left-to-right parsing: A() + (5 + 10)
			expect(il).to.be.eql(["MathAdd", ["A"], ["Value", 15]])
		})
	})

	describe("Constants in Comparisons", function() {
		it("should compile constants in comparison expressions", function() {
			const il = RuleParser.toIL("A() > 1 hour + 30 minutes")
			expect(il).to.be.eql(["Gt", ["A"], ["Value", 5400]])
		})

		it("should compile constants on LHS of comparison", function() {
			const il = RuleParser.toIL("10 + 5 > A()")
			expect(il).to.be.eql(["Gt", ["Value", 15], ["A"]])
		})

		it("should compile constants in equality", function() {
			const il = RuleParser.toIL("A() == 1 week + 1 day")
			expect(il).to.be.eql(["Eq", ["A"], ["Value", 691200]])
		})
	})

	describe("Constants in Function Arguments", function() {
		it("should compile constants inside function arguments", function() {
			const il = RuleParser.toIL("Func(1 hour + 30 minutes)")
			expect(il).to.be.eql(["Func", ["Value", 5400]])
		})

		it("should compile multiple constant arguments", function() {
			const il = RuleParser.toIL("Func(10 + 5, 20 * 2)")
			expect(il).to.be.eql(["Func", ["Value", 15], ["Value", 40]])
		})

		it("should mix compiled and non-compiled arguments", function() {
			const il = RuleParser.toIL("Func(5 + 5, A())")
			expect(il).to.be.eql(["Func", ["Value", 10], ["A"]])
		})
	})

	describe("Edge Cases", function() {
		it("should handle zero values", function() {
			const il = RuleParser.toIL("0 + 0")
			expect(il).to.be.eql(["Value", 0])
		})

		it("should handle negative results", function() {
			const il = RuleParser.toIL("5 - 10")
			expect(il).to.be.eql(["Value", -5])
		})

		it("should handle very small numbers", function() {
			const il = RuleParser.toIL("0.001 + 0.002")
			expect(il).to.be.eql(["Value", 0.003])
		})

		it("should handle large time values", function() {
			const il = RuleParser.toIL("52 weeks + 1 day")
			// 52 weeks = 31449600 seconds, 1 day = 86400 seconds
			expect(il).to.be.eql(["Value", 31536000])
		})
	})

	describe("Chained Arithmetic with Constants", function() {
		it("should compile chained constant operations", function() {
			// All constants compile to a single value
			const il = RuleParser.toIL("10 + 5 + 3")
			expect(il).to.be.eql(["Value", 18])
		})

		it("should compile nested constant operations", function() {
			// All constants compile to a single value
			// 1 hour + 30 minutes + 15 minutes = 3600 + 1800 + 900 = 6300
			const il = RuleParser.toIL("1 hour + 30 minutes + 15 minutes")
			expect(il).to.be.eql(["Value", 6300])
		})
	})
})
