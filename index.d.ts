import { Ajv, ValidateFunction } from 'ajv'

interface AjvPack {
  /**
   * validate data against the schema
   * @this Ajv
   * @param {Object} schema JSON-schema
   * @param {Any} data data to validate
   * @return {Boolean} validation result
   */
  validate(schema: object, data: any): boolean

  /**
   * compile the schema and require the module
   * @this Ajv
   * @param {Object} schema JSON-schema
   * @return {Function} validation function
   */
  compile(schema: object): ValidateFunction

  /**
   * add schema to the instance
   * @this Ajv
   * @return {Any} result from ajv instance
   */
  addSchema: Ajv['addSchema']

  /**
   * add custom keyword to the instance
   * @this Ajv
   * @return {Any} result from ajv instance
   */
  addKeyword: Ajv['addKeyword']
}

interface PackValidate {
  (ajv: Ajv, validate: ValidateFunction): string
  instance(ajv: Ajv): AjvPack
}

declare const pack: PackValidate

export = pack
