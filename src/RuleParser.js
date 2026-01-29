const {Parser} = require('ebnf/dist/Parser.js'),
      {ParsingError} = require('ebnf'),
      assert = require('assert')

let ParserRules = require('./RuleParser.ebnf.js')
let ParserCache;

const { ErrorAnalyzer } = require('./errors/ErrorAnalyzer');

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

// Map abbreviations to canonical uppercase full form
const DOW_MAP = {
    'MON': 'MONDAY',
    'TUE': 'TUESDAY',
    'WED': 'WEDNESDAY',
    'THU': 'THURSDAY',
    'THUR': 'THURSDAY',
    'FRI': 'FRIDAY',
    'SAT': 'SATURDAY',
    'SUN': 'SUNDAY',
};

// Valid full day names
const VALID_DAYS = new Set(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']);

const normalizeDow = (text) => {
    const upper = text.toUpperCase();
    // Check if it's an abbreviation first
    if (upper in DOW_MAP) {
        return DOW_MAP[upper];
    }
    // Otherwise, check if it's a valid full name
    if (VALID_DAYS.has(upper)) {
        return upper;
    }
    throw new Error(`Invalid day of week: ${text}`);
};

const Epsilon = 0.01

class RuleParser {
    static toAst(txt){
        let ret

        if(!ParserCache){
            ParserCache = new Parser(ParserRules, {debug: false})
        }

        try {
            ret = ParserCache.getAST(txt.trim(), 'statement_main');
        } catch (e) {
            // If ebnf throws ParsingError, convert it to RuleParseError with helpful error code
            if (e instanceof ParsingError) {
                throw ErrorAnalyzer.analyzeParseFailure(txt, e);
            }
            throw e;
        }
        
        if(ret){
            return ret.children[0]
        }
        
        // If parsing failed without throwing (shouldn't happen with new ebnf), throw error
        throw ErrorAnalyzer.analyzeParseFailure(txt);
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
        // dow_range can have 1 or 2 children (single day or range)
        if (dowRange.children.length === 1) {
            // Single day: ON MONDAY - return just the day string
            return { start: normalizeDow(dowRange.children[0].text), end: normalizeDow(dowRange.children[0].text) };
        } else if (dowRange.children.length === 2) {
            // Range: ON MONDAY TO FRIDAY - return both start and end days
            return { start: normalizeDow(dowRange.children[0].text), end: normalizeDow(dowRange.children[1].text) };
        } else {
            throw new Error(`Invalid dow_range with ${dowRange.children.length} children`);
        }
    }
    static _addDowToTods(startTod, endTod, dowRange) {
        if (dowRange && dowRange.type === 'dow_range') {
            const dow = RuleParser._parseDowRange(dowRange)
            startTod.dow = dow.start
            endTod.dow = dow.end
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
                // time_period_ago_between has: number_time (WS+ number_time)* WS+ AGO WS+ between_tod_only
                // We need to extract all number_time children and sum them up, then return TimePeriodBetweenAgo
                let totalSeconds = 0
                let betweenTodOnly = null
                
                // Find all number_time children and the between_tod_only child
                for (let i = 0; i < tp.children.length; i++) {
                    if (tp.children[i].type === 'number_time') {
                        totalSeconds += RuleParser.__parseValue(tp.children[i])
                    } else if (tp.children[i].type === 'between_tod_only') {
                        betweenTodOnly = tp.children[i]
                    }
                }
                
                // This should always be present based on the grammar, but check defensively
                if (!betweenTodOnly) {
                    throw new Error('time_period_ago_between requires between_tod_only child')
                }
                
                const betweenTod = betweenTodOnly.children[0]
                let startTod = RuleParser.__parseValue(betweenTod.children[0])
                let endTod = RuleParser.__parseValue(betweenTod.children[1])
                
                // Check if there's a dow_range at betweenTod.children[2]
                // Note: startTod and endTod should always be objects from number_tod parsing
                if (betweenTod.children.length > 2) {
                    RuleParser._addDowToTods(startTod, endTod, betweenTod.children[2])
                }
                
                return ["TimePeriodBetweenAgo", totalSeconds, startTod, endTod]
            }
            case 'between_tod_only': {
                // between_tod_only has children[0] = between_tod node
                const betweenTod = tp.children[0]
                let startTod = RuleParser.__parseValue(betweenTod.children[0])
                let endTod = RuleParser.__parseValue(betweenTod.children[1])
                
                // Check if there's a dow_range at betweenTod.children[2]
                if (betweenTod.children.length > 2) {
                    if(typeof startTod === 'number') startTod = {seconds: startTod, dow: null}
                    if(typeof endTod === 'number') endTod = {seconds: endTod, dow: null}
                    RuleParser._addDowToTods(startTod, endTod, betweenTod.children[2])
                }
                
                return ["TimePeriodBetween", startTod, endTod]
            }
            case 'between_time_only': {
                // between_time_only has children[0] = between_number_time node
                const betweenNumberTime = tp.children[0]
                const startValue = RuleParser.__parseValue(betweenNumberTime.children[0])
                const endValue = RuleParser.__parseValue(betweenNumberTime.children[1])
                
                // Check if there's a dow_range at betweenNumberTime.children[2]
                // If DOW filters are provided, append them as additional parameters
                if (betweenNumberTime.children.length > 2 && betweenNumberTime.children[2].type === 'dow_range') {
                    const dow = RuleParser._parseDowRange(betweenNumberTime.children[2])
                    if (dow.start === dow.end) {
                        // Single day: ["TimePeriodBetween", start, end, "MONDAY"]
                        return ["TimePeriodBetween", startValue, endValue, dow.start]
                    } else {
                        // Range: ["TimePeriodBetween", start, end, "MONDAY", "FRIDAY"]
                        return ["TimePeriodBetween", startValue, endValue, dow.start, dow.end]
                    }
                }
                
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
    static _isConstantValue(expr){
        // Check if an expression is a constant value
        return Array.isArray(expr) && expr.length === 2 && expr[0] === 'Value' && typeof expr[1] === 'number'
    }
    
    static _evaluateConstantArithmetic(operator, leftValue, rightValue){
        // Evaluate constant arithmetic operations at parse time
        switch(operator){
            case 'MathAdd':
                return leftValue + rightValue
            case 'MathSub':
                return leftValue - rightValue
            case 'MathMul':
                return leftValue * rightValue
            case 'MathDiv':
                return leftValue / rightValue
            case 'MathMod':
                return leftValue % rightValue
            default:
                return null
        }
    }
    
    static _parseArithmeticResult(result){
        assert(result.children.length == 3)
        const partA = RuleParser._parseArithmeticOperand(result.children[0])
        const operatorFn = ArithmeticOperators[result.children[1].text]
        const partB = RuleParser.__parseArithmeticResult(result, 2)

        // Compile out constant expressions
        if (RuleParser._isConstantValue(partA) && RuleParser._isConstantValue(partB)) {
            const result = RuleParser._evaluateConstantArithmetic(operatorFn, partA[1], partB[1])
            if (result !== null) {
                return ['Value', result]
            }
        }

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
        try {
            const ast = RuleParser.toAst(txt)
            if(!ast) throw new Error(`failed to parse ${txt}`)
            return RuleParser._buildExpressionGroup(ast)
        } catch (e) {
            // If it's already a RuleParseError, just re-throw it
            if (e.name === 'RuleParseError') {
                throw e;
            }
            
            // Check if it's a validation error we can map to a specific code
            if (e.message && e.message.includes('Invalid time of day')) {
                // Extract the invalid time from the error message
                const match = e.message.match(/Invalid time of day[,:]?\s*([0-9:]+)/);
                const badTod = match ? match[1] : 'invalid';
                const { ParsingError } = require('ebnf');
                const { RuleParseError } = require('./errors/RuleParseError');
                
                // Calculate position (simplified - at end of input)
                const lines = txt.trim().split('\n');
                const position = {
                    line: lines.length,
                    column: lines[lines.length - 1].length + 1,
                    offset: txt.trim().length
                };
                
                throw new RuleParseError(
                    "BAD_TOD",
                    `Invalid time of day: ${badTod}`,
                    "Time of day must be in HH:MM format with hours 0-23 and minutes 0-59, e.g. 08:30, 14:00, 23:59.",
                    position,
                    badTod,
                    ["HH:MM"],
                    txt.trim().substring(Math.max(0, txt.trim().length - 50))
                );
            }
            
            // Check if it's a day of week error
            if (e.message && e.message.includes('Invalid day of week')) {
                const match = e.message.match(/Invalid day of week[,:]?\s*(\w+)/);
                const badDow = match ? match[1] : 'invalid';
                const { RuleParseError } = require('./errors/RuleParseError');
                
                const lines = txt.trim().split('\n');
                const position = {
                    line: lines.length,
                    column: lines[lines.length - 1].length + 1,
                    offset: txt.trim().length
                };
                
                throw new RuleParseError(
                    "BAD_DOW",
                    `Invalid day of week: ${badDow}`,
                    "Valid days are: MONDAY/MON, TUESDAY/TUE, WEDNESDAY/WED, THURSDAY/THU, FRIDAY/FRI, SATURDAY/SAT, SUNDAY/SUN.",
                    position,
                    badDow,
                    ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"],
                    txt.trim().substring(Math.max(0, txt.trim().length - 50))
                );
            }
            
            // For other errors, re-throw
            throw e;
        }
    }
}
module.exports = RuleParser
module.exports.ParsingError = require('ebnf').ParsingError
module.exports.RuleParseError = require('./errors/RuleParseError').RuleParseError
