'use strict';

var Ajv = require('ajv');
var pack = require('..');
var requireFromString = require('require-from-string');
var assert = require('assert');


describe('module for a single validation function', function() {
  var ajv;

  beforeEach(function() {
    ajv = new Ajv({sourceCode: true});
  });

  it('should validate data', function() {
    var schema = { type: 'string' };
    var validate = ajv.compile(schema);
    var validateModule = pack(ajv, validate);
    var packedValidate = requireFromString(validateModule);

    assert.strictEqual(packedValidate('foo'), true);
    assert.strictEqual(packedValidate(1), false);
  });

  it('should support schemas with pattern keyword', function() {
    var schema = { type: 'string', pattern: '^[a-z]+$' };
    var validate = ajv.compile(schema);
    var validateModule = pack(ajv, validate);
    var packedValidate = requireFromString(validateModule);

    assert.strictEqual(packedValidate('foo'), true);
    assert.strictEqual(packedValidate('foo1'), false);
    assert.strictEqual(packedValidate(''), false);
  });

  it('should support schemas with default keyword when defaults are shared', function() {
    ajv = new Ajv({sourceCode: true, useDefaults: 'shared'});
    var schema = {
      type: 'object',
      properties: {
        foo: {
          default: { bar: 1 }
        }
      },
      required: ['foo']
    };
    var validate = ajv.compile(schema);
    var validateModule = pack(ajv, validate);
    var packedValidate = requireFromString(validateModule);

    var data = {};
    assert.strictEqual(packedValidate(data), true);
    assert.deepStrictEqual(data, { foo: { bar: 1 } });
  });
});
