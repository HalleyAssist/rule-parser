const fs = require('fs')

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

let replacements = {}
const ParserRules = require('../src/RuleParser.ebnf.js')
RegExp.prototype.toJSON = function(){
    // generate a random string:
    const randomString = makeid(256)
    replacements[randomString] = this
    return randomString
}

let rules = JSON.stringify(ParserRules)
for(const key in replacements){
    rules = rules.replace(`"${key}"`, replacements[key].toString())
}

fs.writeFileSync('src/RuleParser.production.ebnf.js', "module.exports="+rules)

const ruleParserJs = fs.readFileSync('src/RuleParser.js', 'utf8')
const ruleParserJsFixed = ruleParserJs.replace("require('./RuleParser.ebnf.js')", 'require(\'./RuleParser.production.ebnf.js\')')

fs.writeFileSync('src/RuleParser.production.js', ruleParserJsFixed)