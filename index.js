'use strict';

var beautify = require('js-beautify').js_beautify;
var validatePack = require('./lib/dotjs/validate_pack');

module.exports = function (ajv, validate) {
  var code = validatePack({ ajv: ajv, validate: validate });
  return beautify(code, { indent_size: 2 });
}
