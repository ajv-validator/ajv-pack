'use strict';

var beautify = require('js-beautify').js_beautify;
var genValidate = require('./dotjs/gen_validate');
var util = require('./util');

module.exports = function (ajv, validate) {
  var code = genValidate({
    ajv: ajv,
    validate: validate,
    util: util
  });
  return beautify(code, { indent_size: 2 });
}
