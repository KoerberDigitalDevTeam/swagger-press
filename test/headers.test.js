'use strict'

const { expect } = require('chai')
const normalise = require('../lib/headers')

describe('Headers normalisation', () => {
  it('should normalise a string', () => {
    expect(normalise('  content-type  ')).to.equal('Content-Type')
    expect(normalise('  CONTENT-TYPE  ' )).to.equal('Content-Type')

    expect(normalise('  x-foo-bar  ')).to.equal('x-foo-bar')
    expect(normalise('  X-FOO-BAR  ')).to.equal('X-FOO-BAR')
  })

  it('should normalise an array', () => {
    expect(normalise([
      '  content-type  ',
      '  CONTENT-TYPE  ',
      '  x-foo-bar  ',
      '  X-FOO-BAR  ',
    ])).to.eql([
      'Content-Type',
      'Content-Type',
      'x-foo-bar',
      'X-FOO-BAR',
    ])
  })

  it('should normalise an object', () => {
    expect(normalise({
      '  content-type  ': 1, // note that the resulting object will
      '  CONTENT-TYPE  ': 2, // collapse thse two headers in one
      '  x-foo-bar  ': 3,
      '  X-FOO-BAR  ': 4,
    })).to.eql({
      'Content-Type': 2, // collapsed header
      'x-foo-bar': 3,
      'X-FOO-BAR': 4,
    })

    expect(normalise({ '  content-type  ': 1 })).to.eql({ 'Content-Type': 1 })
    expect(normalise({ '  CONTENT-TYPE  ': 1 })).to.eql({ 'Content-Type': 1 })
  })

  it('should normalise the value of all Access-Control-...-Headers headers', () => {
    expect(normalise({
      '  access-control-allow-headers  ': ' content-type, CONTENT-LENGTH, SeRvEr ,X-FOO-BAR ',
      '  ACCESS-CONTROL-EXPOSE-HEADERS  ': ' content-type, CONTENT-LENGTH, SeRvEr ,X-FOO-BAR ',
      '  Access-Control-Request-Headers  ': ' content-type, CONTENT-LENGTH, SeRvEr ,X-FOO-BAR ',
    })).to.eql({
      'Access-Control-Allow-Headers': 'Content-Type, Content-Length, Server, X-FOO-BAR',
      'Access-Control-Expose-Headers': 'Content-Type, Content-Length, Server, X-FOO-BAR',
      'Access-Control-Request-Headers': 'Content-Type, Content-Length, Server, X-FOO-BAR',
    })
  })

  it('should normalise the value of the Access-Control-Allow-Methods header', () => {
    expect(normalise({
      '  access-control-allow-methods  ': ' GET, post, OpTiOnS ,paTCH ',
    })).to.eql({
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PATCH',
    })
  })
})
