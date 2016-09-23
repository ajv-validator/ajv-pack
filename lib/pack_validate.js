'use strict';

var beautify = require('js-beautify').js_beautify;
var genValidate = require('./dotjs/gen_validate');

module.exports = function (ajv, validate) {
  var code = genValidate({ ajv: ajv, validate: validate });
  return beautify(code, { indent_size: 2 });
}
