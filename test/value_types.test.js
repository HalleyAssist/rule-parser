const
	RuleParser = require("../"),
	{ expect } = require('chai')

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
