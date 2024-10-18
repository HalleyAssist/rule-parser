const {Grammars} = require('ebnf');

const grammar = `
statement_main       ::= statement EOF
logical_operator     ::= AND | OR
statement            ::= expression (logical_operator expression)*
expression           ::= not_expression | standard_expression | parenthesis_expression
parenthesis_expression::= BEGIN_PARENTHESIS WS* statement WS* END_PARENTHESIS
not_expression       ::= NOT (result | parenthesis_expression)
standard_expression  ::= result ((WS* eq_approx) | (WS* basic_rhs) | ((WS+ IS)? WS+ between))?
basic_rhs            ::= operator WS*  result
eq_approx            ::= eq_operator WS* "~" WS* result

PLUS                 ::= "+"
MINUS                ::= "-"
MULTIPLY             ::= "*"
DIVIDE               ::= "/"
MODULUS              ::= "%"
DEFAULT_VAL          ::= "??"
arithmetic_operator  ::= PLUS | MINUS | MULTIPLY | DIVIDE | MODULUS | DEFAULT_VAL
arithmetic_result    ::= simple_result WS* arithmetic_operator WS* ( arithmetic_result | simple_result )

simple_result        ::= fcall | value
result               ::= arithmetic_result | simple_result
value                ::= false | true | array | number_time | number | number_tod | time_period | string
BEGIN_ARRAY          ::= WS* #x5B WS*  /* [ left square bracket */
BEGIN_OBJECT         ::= WS* #x7B WS*  /* { left curly bracket */
END_ARRAY            ::= WS* #x5D WS*  /* ] right square bracket */
END_OBJECT           ::= WS* #x7D WS*  /* } right curly bracket */
NAME_SEPARATOR       ::= WS* #x3A WS*  /* : colon */
VALUE_SEPARATOR      ::= WS* #x2C WS*  /* , comma */
WS                   ::= [#x20#x09#x0A#x0D]+   /* Space | Tab | \n | \r */

operator             ::= GTE | LTE | GT | LT | EQ | NEQ
eq_operator          ::= EQ | NEQ

BEGIN_ARGUMENT       ::= "("
END_ARGUMENT         ::= ")"

BEGIN_PARENTHESIS    ::= "("
END_PARENTHESIS      ::= ")"

argument             ::= statement WS* ("," WS*)?
arguments            ::= argument*
fname                ::= [a-zA-z0-9]+
fcall                ::= fname WS* BEGIN_ARGUMENT arguments? END_ARGUMENT

between_number       ::= number ((WS+ ("and" | "AND") WS+) | (WS* "-" WS*)) number
between_tod          ::= number_tod ((WS+ ("and" | "AND") WS+)) number_tod
between              ::= ("between" | "BETWEEN") WS+ (between_number | between_tod)

AND                  ::= (WS* "&&" WS*) | (WS+ ("AND"|"and") WS+)
OR                   ::= (WS* "||" WS*) | (WS+ ("OR"|"or") WS+)
GT                   ::= ">"
LT                   ::= "<"
GTE                  ::= ">="
LTE                  ::= "<="
IS                   ::= "is" | "IS"
EQ                   ::= "==" | "="
NEQ                  ::= "!="
NOT                  ::= ("!" WS*) | ("not" WS+)
false                ::= "false" | "FALSE"
null                 ::= "null" | "NULL"
true                 ::= "true" | "TRUE"
array                ::= BEGIN_ARRAY (value (VALUE_SEPARATOR value)*)? END_ARRAY

unit                 ::= "seconds" | "second" | "minutes" | "minute" | "min" | "mins" | "min" | "hours" | "hour" | "days" | "day" | "weeks" | "week"
number               ::= "-"? ([0-9]+) ("." [0-9]+)? (("e" | "E") ( "-" | "+" )? ("0" | [1-9] [0-9]*))?
number_time          ::= number WS+ unit
number_tod           ::= ([0-9]+) ":" ([0-9]+)

time_period_const    ::= "today"
time_period          ::= time_period_const | between

string               ::= '"' (([#x20-#x21] | [#x23-#x5B] | [#x5D-#xFFFF]) | #x5C (#x22 | #x5C | #x2F | #x62 | #x66 | #x6E | #x72 | #x74 | #x75 HEXDIG HEXDIG HEXDIG HEXDIG))* '"'
HEXDIG               ::= [a-fA-F0-9]
`
module.exports = Grammars.W3C.getRules(grammar);