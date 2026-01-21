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
    static _parseDowRange(dowRange) {
        const dow = []
        
        // dow_range can have 1 or 2 children (single day or range)
        if (dowRange.children.length === 1) {
            // Single day: ON MONDAY
            dow.push(dowRange.children[0].text.toLowerCase())
        } else if (dowRange.children.length === 2) {
            // Range: ON MONDAY TO WEDNESDAY
            dow.push(dowRange.children[0].text.toLowerCase())
            dow.push(dowRange.children[1].text.toLowerCase())
        } else {
            throw new Error(`Invalid dow_range with ${dowRange.children.length} children`)
        }
        
        return dow
    }
    static _addDowToTods(startTod, endTod, dowRange) {
        if (dowRange && dowRange.type === 'dow_range') {
            const dow = RuleParser._parseDowRange(dowRange)
            startTod.dow = dow
            endTod.dow = dow
        }
    }
    static _parseTimePeriod(tp){
        switch(tp.type){
            case 'time_period_const':
                // Check if this is a time_period_ago (has children)
                if (tp.children && tp.children.length > 0 && tp.children[0].type === 'time_period_ago') {
                    const timePeriodAgo = tp.children[0]
                    // Extract all number_time children and sum them up
                    let totalSeconds = 0
                    const components = []
                    for (const child of timePeriodAgo.children) {
                        if (child.type === 'number_time') {
                            const number = parseFloat(child.children[0].text)
                            const unit = child.children[1].text.toUpperCase()
                            components.push([number, unit])
                            // Parse the value to get seconds
                            totalSeconds += RuleParser.__parseValue(child)
                        }
                    }
                    // If there's only one component, use its number and unit
                    // Otherwise, use the total in seconds and "SECONDS" as the unit
                    if (components.length === 1) {
                        return ["TimePeriodConstAgo", components[0][0], components[0][1]]
                    } else {
                        return ["TimePeriodConstAgo", totalSeconds, "SECONDS"]
                    }
                }
                return ["TimePeriodConst", tp.text]
            case 'time_period_ago_between': {
                // time_period_ago_between has children[0] = number_time, children[1] = between_tod_only
                const betweenTodOnly = tp.children[1]
                const betweenTod = betweenTodOnly.children[0]
                const startTod = RuleParser.__parseValue(betweenTod.children[0])
                const endTod = RuleParser.__parseValue(betweenTod.children[1])
                
                // Check if there's a dow_range at betweenTod.children[2]
                if (betweenTod.children.length > 2) {
                    RuleParser._addDowToTods(startTod, endTod, betweenTod.children[2])
                }
                
                return ["TimePeriodBetween", startTod, endTod]
            }
            case 'between_tod_only': {
                // between_tod_only has children[0] = between_tod node
                const betweenTod = tp.children[0]
                const startTod = RuleParser.__parseValue(betweenTod.children[0])
                const endTod = RuleParser.__parseValue(betweenTod.children[1])
                
                // Check if there's a dow_range at betweenTod.children[2]
                if (betweenTod.children.length > 2) {
                    RuleParser._addDowToTods(startTod, endTod, betweenTod.children[2])
                }
                
                return ["TimePeriodBetween", startTod, endTod]
            }
            case 'between_time_only': {
                // between_number_only has children[0] = between_number node
                const betweenNumber = tp.children[0]
                const startValue = RuleParser.__parseValue(betweenNumber.children[0])
                const endValue = RuleParser.__parseValue(betweenNumber.children[1])
                
                return ["TimePeriodBetween", startValue, endValue]
            }
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
    static _parseArithmeticOperand(operand){
        assert(operand.children.length == 1)
        const child = operand.children[0]
        const type = child.type
        switch(type){
            case 'fcall':
                return RuleParser._parseFcall(child)
            case 'number':
                return ['Value', parseFloat(child.text)]
            case 'number_time':
                return ['Value', RuleParser.__parseValue(child)]
        }
        throw new Error(`Unknown arithmetic operand type ${type}`)
    }
    static _parseArithmeticResult(result){
        assert(result.children.length == 3)
        const partA = RuleParser._parseArithmeticOperand(result.children[0])
        const operatorFn = ArithmeticOperators[result.children[1].text]
        const partB = RuleParser.__parseArithmeticResult(result, 2)

        return [operatorFn, partA, partB]
    }

    static __parseArithmeticResult(result, idx){
        const child = result.children[idx]
        const type = child.type
        switch(type){
            case 'arithmetic_operand':
                return RuleParser._parseArithmeticOperand(child)
            case 'arithmetic_result':
                return RuleParser._parseArithmeticResult(child)
        }
        
        throw new Error(`Unknown arithmetic result node ${type}`)
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
                    case 'between_tod': {
                        // Direct between_tod (without wrapping between node)
                        // between_tod has: children[0] = first tod, children[1] = second tod, children[2] = optional dow_range
                        const startTod = RuleParser.__parseValue(rhs.children[0])
                        const endTod = RuleParser.__parseValue(rhs.children[1])
                        
                        // Check if there's a dow_range (children[2])
                        if (rhs.children.length > 2) {
                            RuleParser._addDowToTods(startTod, endTod, rhs.children[2])
                        }
                        
                        return ['Between', RuleParser._parseResult(expr.children[0]), ['Value', startTod], ['Value', endTod]]
                    }
                    case 'between': {
                        // between wraps either between_number or between_tod
                        const betweenChild = rhs.children[0]
                        if (betweenChild.type === 'between_tod') {
                            // between_tod has: children[0] = first tod, children[1] = second tod, children[2] = optional dow_range
                            const startTod = RuleParser.__parseValue(betweenChild.children[0])
                            const endTod = RuleParser.__parseValue(betweenChild.children[1])
                            
                            // Check if there's a dow_range (children[2])
                            if (betweenChild.children.length > 2) {
                                RuleParser._addDowToTods(startTod, endTod, betweenChild.children[2])
                            }
                            
                            return ['Between', RuleParser._parseResult(expr.children[0]), ['Value', startTod], ['Value', endTod]]
                        } else {
                            // between_number - no dow support
                            return ['Between', RuleParser._parseResult(expr.children[0]), ['Value', RuleParser.__parseValue(betweenChild.children[0])], ['Value', RuleParser.__parseValue(betweenChild.children[1])]]
                        }
                    }
                    case 'between_number':
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
