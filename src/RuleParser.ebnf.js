const {Grammars} = require('ebnf');

const grammar = `
statement_main       ::= statement EOF
logical_operator     ||= AND | OR
statement            ::= expression (logical_operator expression)*
expression           ::= not_expression | standard_expression | parenthesis_expression
parenthesis_expression ::= BEGIN_PARENTHESIS WS* statement WS* END_PARENTHESIS
not_expression       ||= NOT (result | parenthesis_expression)
standard_expression  ||= result ((WS* eq_approx) | (WS* basic_rhs) | ((WS+ IS)? WS+ between) | (WS+ in_expr))?
basic_rhs            ::= operator WS* result
eq_approx            ::= eq_operator WS* "~" WS* result

PLUS                 ::= "+"
MINUS                ::= "-"
MULTIPLY             ::= "*"
DIVIDE               ::= "/"
MODULUS              ::= "%"
DEFAULT_VAL          ::= "??"
arithmetic_operator  ::= PLUS | MINUS | MULTIPLY | DIVIDE | MODULUS | DEFAULT_VAL

number_atom          ::= number
number_time_atom     ::= number_time
tod_atom             ::= number_tod
dow_atom             ::= dow

arithmetic_operand   ::= fcall | parenthesis_expression | number_time_atom | number_atom
arithmetic_result    ::= arithmetic_operand WS* arithmetic_operator WS* (arithmetic_result | arithmetic_operand)

simple_result        ::= fcall | value
result               ::= arithmetic_result | simple_result

value_atom           ::= false | true | array | time_period | number_time_atom | number_atom | tod_atom | string
value                ::= value_atom

BEGIN_ARRAY          ::= WS* #x5B WS*  /* [ */
BEGIN_OBJECT         ::= WS* #x7B WS*  /* { */
END_ARRAY            ::= WS* #x5D WS*  /* ] */
END_OBJECT           ::= WS* #x7D WS*  /* } */
NAME_SEPARATOR       ::= WS* #x3A WS*  /* : */
VALUE_SEPARATOR      ::= WS* #x2C WS*  /* , */
WS                   ::= [#x20#x09#x0A#x0D]

operator             ::= GTE | LTE | GT | LT | EQ | NEQ
eq_operator          ::= EQ | NEQ

BEGIN_ARGUMENT       ::= "("
END_ARGUMENT         ::= ")"
BEGIN_PARENTHESIS    ::= "("
END_PARENTHESIS      ::= ")"

BEGIN_IN             ||= "IN"
in_expr              ::= BEGIN_IN WS* BEGIN_PARENTHESIS WS* arguments END_PARENTHESIS

argument             ::= statement WS*
arguments            ::= argument (WS* "," WS* argument)*
fname                ::= [A-Za-z0-9]+
fcall                ::= fname WS* BEGIN_ARGUMENT WS* arguments? END_ARGUMENT

between_dash_or_and  ||= (WS+ "AND" WS+) | (WS* "-" WS*)

between_number_inner ::= number_atom | number_time_atom
between_number       ||= between_number_inner between_dash_or_and between_number_inner

between_number_time_inner ::= number_time_atom
between_number_time  ||= between_number_time_inner between_dash_or_and between_number_time_inner (WS+ dow_range)?

between_tod_inner    ::= tod_atom
between_tod          ||= between_tod_inner (WS+ "AND" WS+) between_tod_inner (WS+ dow_range)?

between              ||= "BETWEEN" WS+ (between_number | between_tod)

dow                  ||= "MONDAY" | "MON" | "TUESDAY" | "TUE" | "WEDNESDAY" | "WED" | "THURSDAY" | "THU" | "THUR" | "FRIDAY" | "FRI" | "SATURDAY" | "SAT" | "SUNDAY" | "SUN"

dow_range_inner      ::= dow_atom
dow_range            ||= "ON" WS+ dow_range_inner (WS+ "TO" WS+ dow_range_inner)?

between_time_only    ||= "BETWEEN" WS+ between_number_time
between_tod_only     ||= "BETWEEN" WS+ between_tod
between_time_only_atom ::= between_time_only
between_tod_only_atom  ::= between_tod_only

AND                  ||= (WS* "&&" WS*) | (WS+ "AND" WS+)
OR                   ||= (WS* "||" WS*) | (WS+ "OR" WS+)
AGO                  ||= "AGO"
GT                   ::= ">"
LT                   ::= "<"
GTE                  ::= ">="
LTE                  ::= "<="
IS                   ||= "is"
EQ                   ::= "==" | "="
NEQ                  ::= "!="
NOT                  ||= ("!" WS*) | ("not" WS+)

false                ||= "FALSE"
null                 ||= "null"
true                 ||= "TRUE"

array                ::= BEGIN_ARRAY (value (VALUE_SEPARATOR value)*)? END_ARRAY

unit                 ||= "seconds" | "minutes" | "hours" | "weeks" | "days" | "second" | "minute" | "week" | "hour" | "day" | "mins" | "min"

number               ::= "-"? ([0-9]+) ("." [0-9]+)? ("e" ("-" | "+")? ("0" | [1-9] [0-9]*))?
number_time          ::= number WS+ unit
number_tod           ::= ([0-9]+) ":" ([0-9]+)

time_period_ago      ||= number_time_atom (WS+ number_time_atom)* WS+ AGO
time_period_ago_between ||= number_time_atom (WS+ number_time_atom)* WS+ AGO WS+ (between_time_only_atom | between_tod_only_atom)
time_period_const    ||= "today" | time_period_ago
time_period          ::= time_period_ago_between | time_period_const | between_tod_only | between_time_only

string               ::= '"' (([#x20-#x21] | [#x23-#x5B] | [#x5D-#xFFFF]) | #x5C (#x22 | #x5C | #x2F | #x62 | #x66 | #x6E | #x72 | #x74 | #x75 HEXDIG HEXDIG HEXDIG HEXDIG))* '"'
HEXDIG               ::= [a-fA-F0-9]
`

module.exports = Grammars.W3C.getRules(grammar);
