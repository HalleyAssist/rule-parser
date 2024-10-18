const fs = require('fs')

const ParserRules = require('../src/RuleParser.ebnf.js')
const rules = JSON.stringify(ParserRules)

fs.writeFileSync('src/RuleParser.ebnf.json', rules)

const ruleParserJs = fs.readFileSync('src/RuleParser.js', 'utf8')
const ruleParserJsFixed = ruleParserJs.replace("require('./RuleParser.ebnf.js')", 'require(\'./RuleParser.ebnf.json\')')

fs.writeFileSync('src/RuleParser.production.js', ruleParserJsFixed)