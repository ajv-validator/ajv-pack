'use strict';

var packValidate = require('./pack_validate');
var requireFromString = require('require-from-string');

module.exports = AjvPack;
AjvPack.prototype.validate = validate;
AjvPack.prototype.compile = compile;
AjvPack.prototype.addSchema = addSchema;
AjvPack.prototype.addKeyword = addKeyword;


function AjvPack(ajv) {
  this.ajv = ajv;
}


function validate(schema, data) {
  var v = this.compile(schema);
  var valid = v(data);
  this.errors = valid ? null : v.errors;
  return valid;
}


function compile(schema) {
  var v = this.ajv.compile(schema);
  var validateModule = packValidate(this.ajv, v);
  return requireFromString(validateModule);
}


function addSchema() {
  return this.ajv.addSchema.apply(this.ajv, arguments);
}


function addKeyword() {
  return this.ajv.addKeyword.apply(this.ajv, arguments);
}
