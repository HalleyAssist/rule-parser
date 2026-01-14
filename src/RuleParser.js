const {Parser} = require('ebnf/dist/Parser.js'),
      assert = require('assert')

let ParserRules = require('./RuleParser.ebnf.js')
let ParserCache;

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
    "||": 'Or',
    "OR": 'Or',
}

const Epsilon = 0.01

class RuleParser {
    static toAst(txt){
        let ret

        if(!ParserCache){
            ParserCache = new Parser(ParserRules, {debug: false})
        }

        ret = ParserCache.getAST(txt, 'statement_main');
        
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
            case 'between_tod_only':
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
                if (!isNaN(tod) && ret.hours >= 0 && ret.hours < 24 && ret.minutes >= 0 && ret.minutes < 60) {
                    return ret
                }
                throw new Error(`Invalid time of day, ${child.text} -> [${tokens.join(', ')}] -> ${hours}h${minutes}m -> ${tod}`)
            }
            case 'number_time': {
                const nt = child
                const mult = parseFloat(nt.children[0].text)
                switch(nt.children[1].text.toUpperCase()){
                    case 'SECONDS':
                    case 'SECOND':
                        return mult
                    case 'MINUTES':
                    case 'MINUTE':
                    case 'MINS':
                    case 'MIN':
                        return mult * 60
                    case 'HOURS':
                    case 'HOUR':
                        return mult * 60 * 60
                    case 'DAYS':
                    case 'DAY':
                        return mult * 60 * 60 * 24
                    case 'WEEKS':
                    case 'WEEK':
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
                const operatorFn = LogicalOperators[logicalOperator.toUpperCase()]
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
