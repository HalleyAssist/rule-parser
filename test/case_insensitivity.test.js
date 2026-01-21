const
	RuleParser = require("../"),
	{ expect } = require('chai')

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
