const gulp = require('gulp');
const fs = require('fs');
const path = require('path');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');

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

// Task to build production files (replaces bin/package.js)
gulp.task('build-production', function(done) {
    let replacements = {}
    const ParserRules = require('./src/RuleParser.ebnf.js')
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
    
    console.log('Production build complete');
    done();
});

// Task to build browser version with browserify and deassertify
gulp.task('build-browser', function() {
    return browserify({
        entries: path.resolve(__dirname, 'index.js'),
        standalone: 'RuleParser'
    })
    .transform('deassertify')
    .bundle()
    .pipe(source('rule-parser.browser.js'))
    .pipe(buffer())
    .pipe(gulp.dest('./dist'));
});

// Default task to build both
gulp.task('build', gulp.series('build-production', 'build-browser'));

// Export default
gulp.task('default', gulp.task('build'));
