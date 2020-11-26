//compile doT templates to js functions

var glob = require('glob')
  , fs = require('fs')
  , path = require('path')
  , doT = require('dot');

var beautify;
try {
  var beautify = require('js-beautify').js_beautify;
} catch (e) {
  beautify = null;
}

var defs = {};
var defFiles = glob.sync('../lib/dot/**/*.def', { cwd: __dirname });
defFiles.forEach(function (f) {
  var name = path.basename(f, '.def');
  defs[name] = fs.readFileSync(path.join(__dirname, f));
});

var files = glob.sync('../lib/dot/**/*.jst', { cwd: __dirname });

var dotjsPath = path.join(__dirname, '../lib/dotjs');
try { fs.mkdirSync(dotjsPath); } catch(e) {}

console.log('\nCompiling:');

var FUNCTION_NAME = /function\s+anonymous\s*\(it[^)]*\)\s*{/;


files.forEach(function (f) {
  var fileName = path.basename(f, '.jst');
  var targetPath = path.join(dotjsPath, fileName + '.js');
  var template = fs.readFileSync(path.join(__dirname, f));
  var code = doT.compile(template, defs)
                .toString()
                .replace(FUNCTION_NAME, 'function generate_' + fileName + '(it) {');
  code = "'use strict';\nmodule.exports = " + code + '\n';
  if (beautify) {
    code = beautify(code, { indent_size: 2 })
  };
  fs.writeFileSync(targetPath, code);
  console.log('compiled', fileName);
});
