# Built-in Functions Documentation

This document describes all built-in functions available in the rule parser. These functions are part of the Intermediate Language (IL) representation that the parser generates from rule expressions.

## Table of Contents
- [Time Period Functions](#time-period-functions)
- [Comparison Operators](#comparison-operators)
- [Arithmetic Operators](#arithmetic-operators)
- [Logical Operators](#logical-operators)
- [Range/Comparison Functions](#rangecomparison-functions)
- [Value Wrapper](#value-wrapper)

---

## Time Period Functions

### TimePeriodBetween(fromTp, toTp, [fromDow, toDow])

Represents a time range, optionally filtered by day of week.

**Arguments:**
- `fromTp`: Start of time period. Can be:
  - A number representing seconds
  - A time of day object: `{hours, minutes, tod}` or `{hours, minutes, tod, dow: [...]}`
- `toTp`: End of time period. Same format as `fromTp`
- `fromDow` (optional): Starting day of week filter (e.g., "MONDAY")
- `toDow` (optional): Ending day of week filter (e.g., "FRIDAY")

**Day of Week Values:**
Valid days: `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY`

Abbreviations: `MON`, `TUE`, `WED`, `THU`, `THUR`, `FRI`, `SAT`, `SUN`

**Examples:**
```javascript
// Time range in seconds
["TimePeriodBetween", 3600, 7200]

// Time of day range
["TimePeriodBetween", {hours: 9, minutes: 0, tod: 900}, {hours: 17, minutes: 0, tod: 1700}]

// Time of day range with single day filter
["TimePeriodBetween", {hours: 9, minutes: 0, tod: 900, dow: ["MONDAY"]}, {hours: 17, minutes: 0, tod: 1700, dow: ["MONDAY"]}]

// Time of day range with day range filter
["TimePeriodBetween", {hours: 9, minutes: 0, tod: 900, dow: ["MONDAY", "FRIDAY"]}, {hours: 17, minutes: 0, tod: 1700, dow: ["MONDAY", "FRIDAY"]}]

// Time units with day of week filter
["TimePeriodBetween", 3600, 7200, "MONDAY", "FRIDAY"]
```

**Rule Syntax:**
```
Duration(BETWEEN 1 HOUR AND 2 HOURS)
TimeOfDay() BETWEEN 09:00 AND 17:00
Duration(BETWEEN 1 HOUR AND 2 HOURS ON MONDAY)
A(BETWEEN 09:00 AND 17:00 ON MONDAY TO FRIDAY)
```

---

### TimePeriodConst(constant)

Represents a constant time period like "today" or "yesterday".

**Arguments:**
- `constant`: String representing the time period constant (e.g., "today")

**Examples:**
```javascript
["TimePeriodConst", "today"]
```

**Rule Syntax:**
```
RoomDuration(today)
```

---

### TimePeriodConstAgo(amount, unit)

Represents a time period in the past.

**Arguments:**
- `amount`: Numeric value representing the quantity
- `unit`: Time unit string (case-insensitive)
  - Supported units: `SECOND`, `SECONDS`, `MINUTE`, `MINUTES`, `MIN`, `MINS`, `HOUR`, `HOURS`, `DAY`, `DAYS`, `WEEK`, `WEEKS`

**Examples:**
```javascript
// 5 minutes ago
["TimePeriodConstAgo", 5, "MINUTES"]

// 3 hours ago
["TimePeriodConstAgo", 3, "HOURS"]

// 1 week ago
["TimePeriodConstAgo", 1, "WEEK"]

// Composite time (1 week + 1 hour = 608400 seconds)
["TimePeriodConstAgo", 608400, "SECONDS"]
```

**Rule Syntax:**
```
RoomDuration(5 minutes ago)
Duration(1 WEEK AGO)
Duration(1 WEEK 1 HOUR AGO)
```

---

## Comparison Operators

These operators compare two values and return a boolean result.

### Gt(left, right)

Greater than operator (>).

**Arguments:**
- `left`: Left operand
- `right`: Right operand

**Examples:**
```javascript
["Gt", ["Duration"], ["Value", 300]]
["Gt", ["A"], ["Value", 10]]
```

**Rule Syntax:**
```
Duration() > 300
A() > 10
```

---

### Lt(left, right)

Less than operator (<).

**Arguments:**
- `left`: Left operand
- `right`: Right operand

**Examples:**
```javascript
["Lt", ["Duration"], ["Value", 100]]
["Lt", ["A"], ["B"]]
```

**Rule Syntax:**
```
Duration() < 100
A() < B()
```

---

### Gte(left, right)

Greater than or equal operator (>=).

**Arguments:**
- `left`: Left operand
- `right`: Right operand

**Examples:**
```javascript
["Gte", ["Count"], ["Value", 5]]
```

**Rule Syntax:**
```
Count() >= 5
```

---

### Lte(left, right)

Less than or equal operator (<=).

**Arguments:**
- `left`: Left operand
- `right`: Right operand

**Examples:**
```javascript
["Lte", ["Temperature"], ["Value", 25]]
```

**Rule Syntax:**
```
Temperature() <= 25
```

---

### Eq(left, right)

Equality operator (== or =).

**Arguments:**
- `left`: Left operand
- `right`: Right operand

**Examples:**
```javascript
["Eq", ["Status"], ["Value", "active"]]
["Eq", ["Count"], ["Value", 5]]
```

**Rule Syntax:**
```
Status() == "active"
Count() = 5
```

---

### Neq(left, right)

Not equal operator (!=).

**Arguments:**
- `left`: Left operand
- `right`: Right operand

**Examples:**
```javascript
["Neq", ["Status"], ["Value", "inactive"]]
```

**Rule Syntax:**
```
Status() != "inactive"
```

---

## Arithmetic Operators

These operators perform mathematical operations on numeric values.

### MathAdd(left, right)

Addition operator (+).

**Arguments:**
- `left`: Left operand (must be numeric)
- `right`: Right operand (must be numeric)

**Examples:**
```javascript
["MathAdd", ["A"], ["Value", 5]]
["MathAdd", ["Value", 10], ["Value", 20]]
["MathAdd", ["Value", 3600], ["Value", 1800]]
```

**Rule Syntax:**
```
A() + 5
10 + 20
1 hour + 30 minutes
```

---

### MathSub(left, right)

Subtraction operator (-).

**Arguments:**
- `left`: Left operand (must be numeric)
- `right`: Right operand (must be numeric)

**Examples:**
```javascript
["MathSub", ["A"], ["B"]]
["MathSub", ["Value", 100], ["Value", 25]]
```

**Rule Syntax:**
```
A() - B()
100 - 25
```

---

### MathMul(left, right)

Multiplication operator (*).

**Arguments:**
- `left`: Left operand (must be numeric)
- `right`: Right operand (must be numeric)

**Examples:**
```javascript
["MathMul", ["Value", 10], ["Value", 5]]
["MathMul", ["A"], ["Value", 2]]
```

**Rule Syntax:**
```
10 * 5
A() * 2
```

---

### MathDiv(left, right)

Division operator (/).

**Arguments:**
- `left`: Left operand (must be numeric)
- `right`: Right operand (must be numeric)

**Examples:**
```javascript
["MathDiv", ["Value", 100], ["Value", 5]]
["MathDiv", ["A"], ["B"]]
```

**Rule Syntax:**
```
100 / 5
A() / B()
```

---

### MathMod(left, right)

Modulus operator (%).

**Arguments:**
- `left`: Left operand (must be numeric)
- `right`: Right operand (must be numeric)

**Examples:**
```javascript
["MathMod", ["Value", 10], ["Value", 3]]
["MathMod", ["A"], ["B"]]
```

**Rule Syntax:**
```
10 % 3
A() % B()
```

---

### Default(value, defaultValue)

Default value operator (??). Returns the default value if the first value is null/undefined.

**Arguments:**
- `value`: Primary value
- `defaultValue`: Default value to use if primary is null/undefined (must be numeric)

**Examples:**
```javascript
["Default", ["A"], ["Value", 1]]
["Default", ["OptionalValue"], ["Value", 0]]
```

**Rule Syntax:**
```
A() ?? 1
OptionalValue() ?? 0
```

---

## Logical Operators

These operators combine boolean expressions.

### And(expr1, expr2, ...)

Logical AND operator (&& or AND). All expressions must be true.

**Arguments:**
- `expr1, expr2, ...`: Two or more boolean expressions

**Examples:**
```javascript
["And", ["A"], ["B"]]
["And", ["Gt", ["X"], ["Value", 5]], ["Lt", ["Y"], ["Value", 10]]]
["And", ["A"], ["B"], ["C"]]
```

**Rule Syntax:**
```
A() && B()
A() AND B()
X() > 5 && Y() < 10
A() && B() && C()
```

---

### Or(expr1, expr2, ...)

Logical OR operator (|| or OR). At least one expression must be true.

**Arguments:**
- `expr1, expr2, ...`: Two or more boolean expressions

**Examples:**
```javascript
["Or", ["A"], ["B"]]
["Or", ["Eq", ["Status"], ["Value", "active"]], ["Eq", ["Status"], ["Value", "pending"]]]
```

**Rule Syntax:**
```
A() || B()
A() OR B()
Status() == "active" || Status() == "pending"
```

---

### Not(expr)

Logical NOT operator (! or NOT or not). Negates a boolean expression.

**Arguments:**
- `expr`: Boolean expression to negate

**Examples:**
```javascript
["Not", ["A"]]
["Not", ["Eq", ["Status"], ["Value", "inactive"]]]
["Not", ["And", ["A"], ["B"]]]
```

**Rule Syntax:**
```
!A()
NOT A()
not A()
!(A() && B())
```

---

## Range/Comparison Functions

### Between(value, min, max)

Checks if a value is within a range (inclusive).

**Arguments:**
- `value`: Value to check
- `min`: Minimum value (inclusive)
- `max`: Maximum value (inclusive)

**Examples:**
```javascript
["Between", ["Temperature"], ["Value", 20], ["Value", 25]]
["Between", ["TimeOfDay"], ["Value", {hours: 9, minutes: 0, tod: 900}], ["Value", {hours: 17, minutes: 0, tod: 1700}]]
["Between", ["A"], ["Value", 1], ["Value", 5]]
```

**Rule Syntax:**
```
Temperature() BETWEEN 20 AND 25
TimeOfDay() BETWEEN 09:00 AND 17:00
A() IS BETWEEN 1 AND 5
A() BETWEEN 1-5
```

**Special Cases:**

Approximate equality using `==~`:
```javascript
// RoomDuration("Room 1") == ~1 becomes:
["Between", ["RoomDuration", ["Value", "Room 1"]], ["Value", 0.99], ["Value", 1.01]]

// RoomDuration("Room 1") !=~1 becomes:
["Not", ["Between", ["RoomDuration", ["Value", "Room 1"]], ["Value", 0.99], ["Value", 1.01]]]
```

---

## Value Wrapper

### Value(literalValue)

Wraps literal values (numbers, strings, booleans, arrays) in the IL representation.

**Arguments:**
- `literalValue`: The literal value to wrap

**Supported Types:**
- Numbers: integers, floats, negative numbers
- Strings: double-quoted strings
- Booleans: `true`, `false` (case-insensitive: `TRUE`, `FALSE`)
- Arrays: arrays of values

**Examples:**
```javascript
["Value", 42]
["Value", 3.14]
["Value", -10]
["Value", "hello"]
["Value", true]
["Value", false]
["Value", [1, 2, 3]]
```

**Rule Syntax:**
```
A(42)
B("hello")
C(TRUE)
D([1, 2, 3])
```

---

## Time Units

Time units can be used in expressions and are automatically converted to seconds:

| Unit | Aliases | Seconds |
|------|---------|---------|
| Second | `SECOND`, `SECONDS` | 1 |
| Minute | `MINUTE`, `MINUTES`, `MIN`, `MINS` | 60 |
| Hour | `HOUR`, `HOURS` | 3,600 |
| Day | `DAY`, `DAYS` | 86,400 |
| Week | `WEEK`, `WEEKS` | 604,800 |

**Examples:**
```javascript
// 5 minutes = 300 seconds
["Value", 300]

// 1 hour + 30 minutes = 5400 seconds
["MathAdd", ["Value", 3600], ["Value", 1800]]
```

**Rule Syntax:**
```
Duration() > 5 minutes
A(1 hour + 30 minutes)
TimeAgo(1 week ago)
```

---

## Complete Examples

### Complex Expression with Multiple Operators

**Rule:**
```
(A() + B() > 10 && C() == TRUE) || (D() BETWEEN 1-5 && !E())
```

**IL Representation:**
```javascript
[
  "Or",
  [
    "And",
    ["Gt", ["MathAdd", ["A"], ["B"]], ["Value", 10]],
    ["Eq", ["C"], ["Value", true]]
  ],
  [
    "And",
    ["Between", ["D"], ["Value", 1], ["Value", 5]],
    ["Not", ["E"]]
  ]
]
```

### Time Period with Day of Week Filter

**Rule:**
```
TimeOfDay() BETWEEN 08:00 AND 17:00 ON MONDAY TO FRIDAY && Event("type") == "work"
```

**IL Representation:**
```javascript
[
  "And",
  [
    "Between",
    ["TimeOfDay"],
    ["Value", {hours: 8, minutes: 0, tod: 800, dow: ["MONDAY", "FRIDAY"]}],
    ["Value", {hours: 17, minutes: 0, tod: 1700, dow: ["MONDAY", "FRIDAY"]}]
  ],
  ["Eq", ["Event", ["Value", "type"]], ["Value", "work"]]
]
```

### Arithmetic with Time Units

**Rule:**
```
Duration(1 hour + 30 minutes) > 5000
```

**IL Representation:**
```javascript
[
  "Gt",
  ["Duration", ["MathAdd", ["Value", 3600], ["Value", 1800]]],
  ["Value", 5000]
]
```

---

## Notes

- All operators and keywords are case-insensitive
- Function names are case-sensitive
- Time units are automatically converted to seconds
- Day of week names can be abbreviated or full names
- Parentheses can be used to control evaluation order
- Arithmetic operators only work with numeric values
