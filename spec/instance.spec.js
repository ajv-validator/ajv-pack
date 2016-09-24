'use strict';

var Ajv = require('ajv');
var AjvPack = require('..').instance;
var assert = require('assert');

describe('AjvPack instance', function() {
  var wrappedAjv;

  beforeEach(function() {
    wrappedAjv = new AjvPack(new Ajv({sourceCode: true}));
  });

  it('should compile schemas', function() {
    var schema = { type: 'string' };
    var validate = wrappedAjv.compile(schema);
    assert.strictEqual(validate('foo'), true);
    assert.strictEqual(validate(1), false);
  });

  it('should validate data', function() {
    var schema = { type: 'string' };
    assert.strictEqual(wrappedAjv.validate(schema, 'foo'), true);
    assert.strictEqual(wrappedAjv.validate(schema, 1), false);
  });

  it('should support addSchema', function() {
    var strSchema = { id: 'str', type: 'string' };
    wrappedAjv.addSchema(strSchema);
    var schema = { $ref: 'str' };
    assert.strictEqual(wrappedAjv.validate(schema, 'foo'), true);
    assert.strictEqual(wrappedAjv.validate(schema, 1), false);
  });
});
