'use strict';

var Ajv = require('ajv');
var ajvKeywords = require('ajv-keywords');
var pack = require('..');
var requireFromString = require('require-from-string');
var assert = require('assert');
var co = require('co');


describe('module for a single validation function', function() {
  var ajv;

  beforeEach(function() {
    ajv = new Ajv({sourceCode: true});
  });

  it('should validate data', function() {
    var schema = { type: 'string' };
    var packedValidate = packCompile(schema);

    assert.strictEqual(packedValidate('foo'), true);
    assert.strictEqual(packedValidate(1), false);
  });

  it('should support pattern keyword', function() {
    var schema = { type: 'string', pattern: '^[a-z]+$' };
    var packedValidate = packCompile(schema);

    assert.strictEqual(packedValidate('foo'), true);
    assert.strictEqual(packedValidate('foo1'), false);
    assert.strictEqual(packedValidate(''), false);
  });

  it('should support default keyword when defaults are shared', function() {
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
    var packedValidate = packCompile(schema);

    var data = {};
    assert.strictEqual(packedValidate(data), true);
    assert.deepStrictEqual(data, { foo: { bar: 1 } });
  });

  it('should support referenced not inlined schemas', function() {
    ajv = new Ajv({sourceCode: true, inlineRefs: false});
    ajv.addSchema({ id: 'str', type: 'string' });
    var schema = { $ref: 'str' };
    var packedValidate = packCompile(schema);

    assert.strictEqual(packedValidate('foo'), true);
    assert.strictEqual(packedValidate(1), false);
  });

  it('should support referenced schemas with verbose output', function() {
    ajv = new Ajv({sourceCode: true, verbose: true});
    ajv.addSchema({ id: 'str', type: 'string' });
    var schema = { $ref: 'str' };
    var packedValidate = packCompile(schema);

    assert.strictEqual(packedValidate('foo'), true);
    assert.strictEqual(packedValidate(1), false);
  });

  it('should support referenced subschemas in referenced schemas', function() {
    var schema = {
      type: 'object',
      properties: {
        foo: { $ref: '#/definitions/foo' }
      },
      definitions: {
        foo: { type: 'number' }
      }
    };
    ajv = new Ajv({sourceCode: true, inlineRefs: false});
    var packedValidate = packCompile(schema);

    assert.strictEqual(packedValidate({foo: 1}), true);
    assert.strictEqual(packedValidate({foo: '1'}), false);
  });

  it('should support referenced subschemas in referenced schemas', function() {
    var schema = {
      $ref: '#/definitions/obj',
      definitions: {
        obj: {
          properties: {
            foo: { $ref: '#/definitions/foo' },
            bar: { $ref: '#/definitions/bar' },
          },
          additionalProperties: { $ref: '#/definitions/baz' }
        },
        foo: { type: 'number' },
        bar: { $ref: '#/definitions/foo' },
        baz: { $ref: '#/definitions/bar' }
      }
    };
    ajv = new Ajv({sourceCode: true, inlineRefs: false});
    var packedValidate = packCompile(schema);

    assert.strictEqual(packedValidate({foo: 1, bar: 2}), true);
    assert.strictEqual(packedValidate({foo: 1, bar: '2'}), false);
    assert.strictEqual(packedValidate({foo: '1', bar: 2}), false);
    assert.strictEqual(packedValidate({foo: '1', bar: '2'}), false);
    assert.strictEqual(packedValidate({foo: 1, bar: 2, baz: 3}), true);
    assert.strictEqual(packedValidate({foo: 1, bar: 2, baz: '3'}), false);
  });

  it('should support enums in inlined referenced schemas', function() {
    ajv.addSchema({ id: 'enum', type: 'string', enum: ['foo', 'bar'] });
    var packedValidate = packCompile({ $ref: 'enum' });

    assert.strictEqual(packedValidate('foo'), true);
    assert.strictEqual(packedValidate('baz'), false);
  });

  it('should support schema compostion', function() {
    ajv = new Ajv({sourceCode: true, inlineRefs: false});
    ajv.addSchema({ id: 'country', enum: ['GBR', 'USA'] });

    var schema = {
      definitions: {
        foo: {
          properties: {
            foo: { $ref: 'country' }
          }
        },
        bar: {
          properties: {
            bar: { type: 'string' }
          }
        }
      },
      allOf: [
        {
          properties: {
            baz: { type: 'string' },
          }
        },
        {
          oneOf: [
            { '$ref': '#/definitions/foo' },
            { '$ref': '#/definitions/bar' }

            // Changing the order fixes it
            // { '$ref': '#/definitions/bar' },
            // { '$ref': '#/definitions/foo' }
          ]
        }
      ]
    };

    var packedValidate = packCompile(schema);
    console.log(packedValidate);
    const result = packedValidate({baz: 'bob', foo: 'USA'});
    assert.strictEqual(result, true);
  });

  it('should support format keyword', function() {
    var schema = { type: 'string', format: 'date' };
    var packedValidate = packCompile(schema);

    assert.strictEqual(packedValidate('2016-09-25'), true);
    assert.strictEqual(packedValidate('2016-09-33'), true); // fast formats
    assert.strictEqual(packedValidate('25/09/2016'), false);
  });

  it('should support format keyword, "full" validation', function() {
    ajv = new Ajv({sourceCode: true, format: 'full'});
    var schema = { type: 'string', format: 'date' };
    var packedValidate = packCompile(schema);

    assert.strictEqual(packedValidate('2016-09-25'), true);
    assert.strictEqual(packedValidate('2016-09-33'), false); // full formats
    assert.strictEqual(packedValidate('25/09/2016'), false);
  });

  it('should support uniqueItems keyword', function() {
    var schema = {
      type: 'array',
      items: { type: 'number' },
      uniqueItems: true
    };
    var packedValidate = packCompile(schema);

    assert.strictEqual(packedValidate([1,2,3,4]), true);
    assert.strictEqual(packedValidate([1,2,2,4]), false);
  });

  it('should support minLength/maxLength keyword', function() {
    var schema = {
      type: 'string',
      minLength: 2,
      maxLength: 3
    };
    var packedValidate = packCompile(schema);

    assert.strictEqual(packedValidate('f'), false);
    assert.strictEqual(packedValidate('fo'), true);
    assert.strictEqual(packedValidate('foo'), true);
    assert.strictEqual(packedValidate('fool'), false);
  });

  it('should support async schemas', function() {
    ajv = new Ajv({sourceCode: true, async: '*'});
    var schema = {
      $async: true,
      type: 'number'
    };

    var packedValidate = packCompile(schema);

    return Promise.all([
      co(packedValidate(1)),
      invalid(co(packedValidate('foo')))
    ]);

    function invalid(p) {
      return p.then(function (/* valid */) {
        throw new Error('SHOULD_BE_INVALID');
      })
      .catch(function (err) {
        if (err.message == 'SHOULD_BE_INVALID') throw err;
        return err;
      });
    }
  });

  it('should support custom inline keywords', function() {
    ajvKeywords(ajv, 'typeof');
    var schema = { typeof: 'function' };
    var packedValidate = packCompile(schema);
    assert.strictEqual(packedValidate(function(){}), true);
    assert.strictEqual(packedValidate(1), false);
  });

  it('should support custom macro keywords', function() {
    ajvKeywords(ajv, 'range');
    var schema = { type: 'number', range: [2, 4] };
    var packedValidate = packCompile(schema);
    assert.strictEqual(packedValidate(1), false);
    assert.strictEqual(packedValidate(1.99), false);
    assert.strictEqual(packedValidate(2), true);
    assert.strictEqual(packedValidate(2.5), true);
    assert.strictEqual(packedValidate(3), true);
    assert.strictEqual(packedValidate(4), true);
    assert.strictEqual(packedValidate(4.01), false);
  });

  it.skip('should support meta-schema', function() {
    var validate = ajv.getSchema('http://json-schema.org/draft-04/schema#');
    var validateModule = pack(ajv, validate);
    var packedValidate = requireFromString(validateModule);
    assert.strictEqual(packedValidate({ type: 'string' }), true);
  });


  function packCompile(schema) {
    var validate = ajv.compile(schema);
    var validateModule = pack(ajv, validate);
    return requireFromString(validateModule);
  }
});
