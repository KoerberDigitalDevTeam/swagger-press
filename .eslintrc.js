'use strict'

module.exports = {
  'extends': 'google',
  'parserOptions': {
     'ecmaVersion': 2017,
  },
  'rules': {
    'max-len': 'off',
    'object-curly-spacing': [ 'error', 'always' ],
    'one-var': [ 'off' ],
    'array-bracket-spacing': [ 'error', 'always' ],
    'require-jsdoc': 'off',
    'semi': [ 'error', 'never' ],
    'strict': [ 'error', 'global' ],
  },
}
