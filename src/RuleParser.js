const { Grammars, Parser } = require('ebnf'),
      assert = require('assert')


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
let RULES = Grammars.W3C.getRules(grammar);
let parser = new Parser(RULES, {debug: false});
const target = 'statement_main'

const ArithmeticOperators = {
    "+": 'MathAdd',
    "-": 'MathSub',
    "/": 'MathDiv',
    "*": 'MathMul',
    "%": 'MathMod',
    "??": "Default"
}

const OperatorFn = {
    ">": "Gt",
    "<": "Lt",
    ">=": "Gte",
    "<=": "Lte",
    "==": "Eq",
    "=": "Eq",
    "!=": "Neq"
}

const LogicalOperators = {
    "&&": 'And',
    "AND": 'And',
    "and": 'And',
    "||": 'Or',
    "OR": 'Or',
    "or": 'Or',
}

const Epsilon = 0.01

class RuleParser {
    static toAst(txt){
        let ret
        //if(process.env.NODE_ENV === 'test') {
        //    parser.debug = true
        //}
        ret = parser.getAST(txt, target);
        
        if(ret){
            return ret.children[0]
        }
    }
    static _parseArgument(argument){
        assert(argument.type === 'argument')
        const child = argument.children[0]
        return RuleParser._buildExpressionGroup(child)
    }
    static _parseFcall(fcall){
        const fname = fcall.children[0]
        const ret = [fname.text]
        if(fcall.children.length != 1){
            const args = fcall.children[1]
            for(const a of args.children){
                ret.push(RuleParser._parseArgument(a))
            }
        }
        return ret
    }
    static _parseTimePeriod(tp){
        switch(tp.type){
            case 'time_period_const':
                return ["TimePeriodConst", tp.text]
            case 'between':
                return ["TimePeriodBetween", RuleParser.__parseValue(tp.children[0]?.children[0]), RuleParser.__parseValue(tp.children[0]?.children[1])]
        }
    }
    static __parseValue(child){
        const type = child.type
        switch(type){
            case 'string': {
                const str = child.text
                return str.slice(1, -1)
            }
            case 'number':
                return parseFloat(child.text)
            case 'number_tod': {
                const tokens = child.text.split(':')
                if (tokens.length !== 2) {
                    throw new Error(`Invalid time of day, ${child.text} should be ##:##`)
                }
                const hours = parseInt(tokens[0])
                const minutes = parseInt(tokens[1])
                const tod = hours * 100 + minutes
                const ret = { hours, minutes, tod }
                if (!isNaN(tod) && ret.hours >= 0 && ret.hours <= 24 && ret.minutes >= 0 && ret.minutes < 60) {
                    return ret
                }
                throw new Error(`Invalid time of day, ${child.text} -> [${tokens.join(', ')}] -> ${hours}h${minutes}m -> ${tod}`)
            }
            case 'number_time': {
                const nt = child
                const mult = parseFloat(nt.children[0].text)
                switch(nt.children[1].text){
                    case 'seconds':
                    case 'second':
                        return mult
                    case 'minutes':
                    case 'minute':
                    case 'mins':
                    case 'min':
                        return mult * 60
                    case 'hours':
                    case 'hour':
                        return mult * 60 * 60
                    case 'days':
                    case 'day':
                        return mult * 60 * 60 * 24
                    case 'weeks':
                    case 'week':
                        return mult * 60 * 60 * 24 * 7
                }
                throw new Error(`Invalid exponent ${nt.children[1].text}`)
            }
            case 'true':
                return true
            case 'false':
                return false
            case 'array': {
                const ret = []
                for(const c of child.children){
                    ret.push(RuleParser.__parseValue(c.children[0]))
                }
                return ret;
            }
            default:
                throw new Error(`Unknown value type ${type}`)
        }
    }
    static _parseValue(value){
        const child = value.children[0]
        
        const type = child.type
        switch(type){
            case 'time_period': {
                const tp = child.children[0]
                return RuleParser._parseTimePeriod(tp)
            }
            default:
                return ['Value', RuleParser.__parseValue(child)]
        }
    }
    static _parseSimpleResult(result){
        assert(result.children.length == 1)
        const child = result.children[0]
        const type = child.type
        switch(type){
            case 'fcall':
                return RuleParser._parseFcall(child)
            case 'value':
                return RuleParser._parseValue(child)
        }
        return null
    }
    static _parseArithmeticResult(result){
        assert(result.children.length == 3)
        const partA = this._parseSimpleResult(result.children[0])
        const operatorFn = ArithmeticOperators[result.children[1].text]
        const partB = this.__parseResult(result, 2)

        return [operatorFn, partA, partB]
    }

    static __parseResult(result, idx){
        const child = result.children[idx]
        const type = child.type
        switch(type){
            case 'simple_result':
                return RuleParser._parseSimpleResult(child)
            case 'arithmetic_result':
                return RuleParser._parseArithmeticResult(child)
        }
        
        throw new Error(`Unknown result node ${type}`)
    }
    static _parseResult(result){
        assert(result.children.length == 1)

        return RuleParser.__parseResult(result, 0)
    }
    static _parseStdExpression(expr){
        assert(expr.type === 'standard_expression')
        switch(expr.children.length){
            case 1:
                return RuleParser._parseResult(expr.children[0])
            case 2: {
                const rhs = expr.children[1]
                switch(rhs.type){
                    case 'between_tod':
                    case 'between_number':
                    case 'between':
                        return ['Between', RuleParser._parseResult(expr.children[0]), ['Value', RuleParser.__parseValue(rhs.children[0].children[0])], ['Value', RuleParser.__parseValue(rhs.children[0].children[1])]]
                    case 'basic_rhs':
                        return [OperatorFn[rhs.children[0].text], RuleParser._parseResult(expr.children[0]), RuleParser._parseResult(rhs.children[1])]
                    case 'eq_approx': {
                        const rhsValue = RuleParser._parseResult(rhs.children[1])
                        assert(rhsValue[0] === 'Value')
                        const ret = ['Between', RuleParser._parseResult(expr.children[0]), ['Value', rhsValue[1] - Epsilon], ['Value', rhsValue[1] + Epsilon]]
                        if(rhs.children[0].text === '!='){
                            return ['Not', ret]
                        }
                        return ret
                    }

                    default:
                        throw new Error(`unable to parse std expression, unknown rhs type ${rhs.type}`)
                }
            }
                
            default:
                throw new Error(`unable to parse std expression, unknown number of children ${expr.children.length}`)
        }
    }
    static buildLogical(members, fn){
        return [fn, ...members]
    }
    static _buildExpressionGroup(ast){
        let ret = []
        let currentLogical = null
        for(const expr of ast.children){
            if(expr.type == 'logical_operator') {
                const logicalOperator = expr.text.trim()
                const operatorFn = LogicalOperators[logicalOperator]
                assert(operatorFn, `Unknown logical operator ${logicalOperator}`)
                if(currentLogical === null || currentLogical !== operatorFn){
                    if(ret.length > 1){
                        ret = [RuleParser.buildLogical(ret, currentLogical)]
                    }
                    currentLogical = operatorFn
                }
            }else{
                ret.push(RuleParser._exprToIL(expr))
            }
        }
        if(ret.length == 0){
            throw new Error('invalid rule')
        }
        if(ret.length == 1){
            return ret[0]
        }
        return RuleParser.buildLogical(ret, currentLogical)
    }
    static _parseParenthesisExpression(expr){
        return RuleParser._buildExpressionGroup(expr.children[0])
    }
    static _exprToIL(expr){
        assert(expr.type === 'expression')
        assert(expr.children.length === 1)
        const eInner = expr.children[0]
        switch(eInner.type){
            case 'standard_expression':
                return RuleParser._parseStdExpression(eInner)
            case 'not_expression': {
                const child = eInner.children[0]
                let result
                switch(child.type){
                    case 'parenthesis_expression':
                        result = RuleParser._parseParenthesisExpression(child)
                        break;
                    default:
                        result = RuleParser._parseResult(child)
                }
                return ['Not', result]
            }
            case 'parenthesis_expression':
            return RuleParser._parseParenthesisExpression(eInner)
            default:
                throw new Error(`unknown type of expression ${eInner.type}`)
        }
    }
    static toIL(txt){
        const ast = RuleParser.toAst(txt)
        if(!ast) throw new Error(`failed to parse ${txt}`)
        return RuleParser._buildExpressionGroup(ast)
    }
}
module.exports = RuleParser
