'use strict';

var beautify;
try {
  beautify = require('js-beautify').js_beautify;
} catch (e) {
  beautify = null;
}
var gen_single = require('./dotjs/gen_single');
var gen_validate = require('./dotjs/gen_validate');
var util = require('./util');

module.exports = function (ajv, validate) {
  var code = gen_single({
    ajv: ajv,
    validate: validate,
    util: util,
    gen_validate: gen_validate
  });
  return beautify ? beautify(code, { indent_size: 2 }) : code;
};
