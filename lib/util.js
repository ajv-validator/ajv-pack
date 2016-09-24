'use strict';

module.exports = {
  escapeQuotes: escapeQuotes
};

var SINGLE_QUOTE = /'|\\/g;
function escapeQuotes(str) {
  return str.replace(SINGLE_QUOTE, '\\$&')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\f/g, '\\f')
            .replace(/\t/g, '\\t');
}
