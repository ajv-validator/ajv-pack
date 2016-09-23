'use strict';

var Ajv = require('ajv');
var pack = require('..');
var requireFromString = require('require-from-string');
var assert = require('assert');


describe('module for a single validation function', function() {
  var ajv;

  beforeEach(function() {
    ajv = new Ajv;
  });

  it('should validate data', function() {
    var schema = { type: 'string' };
    var validate = ajv.compile(schema);
    var validateModule = pack(ajv, validate);
    var packedValidate = requireFromString(validateModule);

    assert.strictEqual(packedValidate('foo'), true);
    assert.strictEqual(packedValidate(1), false);
  });
});
