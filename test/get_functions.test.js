const
	RuleParser = require("../"),
	{ expect } = require('chai')

describe("getFunctions", function () {
	it("collects unique function names from nested IL", function () {
		const il = RuleParser.toIL(`A(B(), 1) > C() AND !(D(E()) IN (F(), G(H()) + 2, "x"))`)
		expect(RuleParser.getFunctions(il).sort()).to.be.eql(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])
	})

	it("deduplicates function names while preserving first-seen order", function () {
		const il = RuleParser.toIL(`A(A(), B()) || B() > A()`)
		expect(RuleParser.getFunctions(il)).to.be.eql(['A', 'B'])
	})

	it("returns an empty array when IL contains no functions", function () {
		expect(RuleParser.getFunctions(['And', ['Gt', ['Value', 1], ['Value', 0]], ['Not', ['Value', false]]])).to.be.eql([])
	})
})