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
      properties: {
        foo: { $ref: '#/definitions/foo' },
        bar: { $ref: '#/definitions/bar' },
      },
      definitions: {
        foo: { type: 'number' },
        bar: { $ref: '#/definitions/foo' }
      }
    };
    ajv = new Ajv({sourceCode: true, inlineRefs: false});
    var packedValidate = packCompile(schema);

    assert.strictEqual(packedValidate({foo: 1, bar: 2}), true);
    assert.strictEqual(packedValidate({foo: 1, bar: '2'}), false);
    assert.strictEqual(packedValidate({foo: '1', bar: 2}), false);
    assert.strictEqual(packedValidate({foo: '1', bar: '2'}), false);
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


  function packCompile(schema) {
    var validate = ajv.compile(schema);
    var validateModule = pack(ajv, validate);
    return requireFromString(validateModule);
  }
});
