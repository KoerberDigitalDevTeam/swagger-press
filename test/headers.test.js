'use strict'

const { expect } = require('chai')
const Headers = require('../classes/headers')

describe('Headers class', () => {
  describe('Construction', () => {
    it('should construct a Headers instance', () => {
      expect(Headers).to.be.a('function')
      expect(new Headers()).to.eql({})
    })

    it('should construct a Headers instance with an object', () => {
      let h = new Headers({
        'Content-Type': 'test1',
        ' content-type ': 'test2',
        'X-Foo': [ 'hello', 'world' ],
        ' x-foo ': [ 'foo', 'bar', 'baz' ],
      })

      expect(h).to.eql({
        'Content-Type': 'test1',
        'X-Foo': 'hello',
      })

      expect(h.keys()).to.eql([ 'Content-Type', 'X-Foo' ])

      expect(h.values()).to.eql({
        'Content-Type': [ 'test1', 'test2' ],
        'X-Foo': [ 'hello', 'world', 'foo', 'bar', 'baz' ],
      })
    })

    it('should construct a Headers instance with an array', () => {
      let h = new Headers([
        { 'Content-Type': 'test1' },
        { ' content-type ': 'test2' },
        { 'X-Foo': [ 'hello', 'world' ] },
        { ' x-foo ': [ 'foo', 'bar', 'baz' ] },
      ])

      expect(h).to.eql({
        'Content-Type': 'test1',
        'X-Foo': 'hello',
      })

      expect(h.keys()).to.eql([ 'Content-Type', 'X-Foo' ])

      expect(h.values()).to.eql({
        'Content-Type': [ 'test1', 'test2' ],
        'X-Foo': [ 'hello', 'world', 'foo', 'bar', 'baz' ],
      })
    })
  })

  /* ======================================================================== */

  describe('Setting', () => {
    it('should override headers with the "set()" method', () => {
      let h = new Headers({ 'X-Foo': 'bar' })

      expect(h).to.eql({ 'X-Foo': 'bar' })
      expect(h.values()).to.eql({ 'X-Foo': [ 'bar' ] })

      h.set('x-foo', [ 'baz', 'xyz' ])

      expect(h).to.eql({ 'X-Foo': 'baz' })
      expect(h.values()).to.eql({ 'X-Foo': [ 'baz', 'xyz' ] })
    })

    it('should override headers with a setter', () => {
      let h = new Headers({ 'X-Foo': 'bar' })

      expect(h).to.eql({ 'X-Foo': 'bar' })
      expect(h.values()).to.eql({ 'X-Foo': [ 'bar' ] })

      h['x-foo'] = [ 'baz', 'xyz' ]

      expect(h).to.eql({ 'X-Foo': 'baz' })
      expect(h.values()).to.eql({ 'X-Foo': [ 'baz', 'xyz' ] })
    })
  })

  /* ======================================================================== */

  describe('Deletion', () => {
    it('should delete headers with the "set()" method', () => {
      let h = new Headers({ 'X-Foo': 'bar' })

      expect(h).to.eql({ 'X-Foo': 'bar' })
      expect(h.values()).to.eql({ 'X-Foo': [ 'bar' ] })

      h.set('x-foo')

      expect(h).to.eql({})
      expect(h.values()).to.eql({})
    })

    it('should delete headers with a setter', () => {
      let h = new Headers({ 'X-Foo': 'bar' })

      expect(h).to.eql({ 'X-Foo': 'bar' })
      expect(h.values()).to.eql({ 'X-Foo': [ 'bar' ] })

      h['x-foo'] = null

      expect(h).to.eql({})
      expect(h.values()).to.eql({})
    })

    it('should delete headers with the "del()" method', () => {
      let h = new Headers({ 'X-Foo': 'bar' })

      expect(h).to.eql({ 'X-Foo': 'bar' })
      expect(h.values()).to.eql({ 'X-Foo': [ 'bar' ] })

      h.del('x-foo')

      expect(h).to.eql({})
      expect(h.values()).to.eql({})
    })

    it('should delete headers with the delete keyword', () => {
      let h = new Headers({ 'X-Foo': 'bar' })

      expect(h).to.eql({ 'X-Foo': 'bar' })
      expect(h.values()).to.eql({ 'X-Foo': [ 'bar' ] })

      delete h['x-foo']

      expect(h).to.eql({})
      expect(h.values()).to.eql({})
    })
  })

  /* ======================================================================== */

  describe('Appending', () => {
    it('should append header values "add()" method', () => {
      let h = new Headers({ 'X-Foo': 'bar' })

      expect(h).to.eql({ 'X-Foo': 'bar' })
      expect(h.values()).to.eql({ 'X-Foo': [ 'bar' ] })

      h.add('x-foo', 'baz')
      h.add('X-FOO', [ 'xyz', 'abc' ])
      h.add('X-None-1', 'hello 1' )
      h.add('X-None-2', [ 'hello 2', 'world' ])

      expect(h).to.eql({
        'X-Foo': 'bar',
        'X-None-1': 'hello 1',
        'X-None-2': 'hello 2',
      })

      expect(h.values()).to.eql({
        'X-Foo': [ 'bar', 'baz', 'xyz', 'abc' ],
        'X-None-1': [ 'hello 1' ],
        'X-None-2': [ 'hello 2', 'world' ],
      })
    })
  })

  /* ======================================================================== */

  describe('Normalization', () => {
    it('should normalise the value of all Access-Control-...-Headers headers', () => {
      expect(new Headers({
        '  access-control-allow-headers  ': ' content-type, CONTENT-LENGTH, SeRvEr ,X-FOO-BAR ',
        '  ACCESS-CONTROL-EXPOSE-HEADERS  ': [ 'content-type', 'CONTENT-LENGTH', 'SeRvEr', 'X-FOO-BAR' ],
        '  Access-Control-Request-Headers  ': [ 'content-type,,,CONTENT-LENGTH', 'SeRvEr ,X-FOO-BAR' ],
      }).values()).to.eql({
        'Access-Control-Allow-Headers': [ 'Content-Type, Content-Length, Server, X-FOO-BAR' ],
        'Access-Control-Expose-Headers': [ 'Content-Type, Content-Length, Server, X-FOO-BAR' ],
        'Access-Control-Request-Headers': [ 'Content-Type, Content-Length, Server, X-FOO-BAR' ],
      })
    })

    it('should normalise the value of all Access-Control-...-Headers headers when "add()" is used', () => {
      let h = new Headers({
        '  access-control-allow-headers  ': ' content-type, CONTENT-LENGTH, SeRvEr ,X-FOO-BAR ',
        '  ACCESS-CONTROL-EXPOSE-HEADERS  ': [ 'content-type', 'CONTENT-LENGTH', 'SeRvEr', 'X-FOO-BAR' ],
        '  Access-Control-Request-Headers  ': [ 'content-type,,,CONTENT-LENGTH', 'SeRvEr ,X-FOO-BAR' ],
      }).add('ACCESS-CONTROL-EXPOSE-HEADERS', 'Content-Transfer-Encoding,,,X-Minion')
        .add('Access-Control-Request-Headers', 'Content-Transfer-Encoding, X-Minion  ')
        .add('access-control-allow-headers', [ 'Content-Transfer-Encoding', '  X-Minion ' ])

      expect(h.values()).to.eql({
        'Access-Control-Allow-Headers': [ 'Content-Type, Content-Length, Server, X-FOO-BAR, Content-Transfer-Encoding, X-Minion' ],
        'Access-Control-Expose-Headers': [ 'Content-Type, Content-Length, Server, X-FOO-BAR, Content-Transfer-Encoding, X-Minion' ],
        'Access-Control-Request-Headers': [ 'Content-Type, Content-Length, Server, X-FOO-BAR, Content-Transfer-Encoding, X-Minion' ],
      })
    })

    it('should normalise the value of the Access-Control-Allow-Methods header', () => {
      expect(new Headers({
        '  access-control-allow-methods  ': ' GET, post, OpTiOnS ,paTCH ',
      }).values()).to.eql({
        'Access-Control-Allow-Methods': [ 'GET, POST, OPTIONS, PATCH' ],
      })

      expect(new Headers({
        '  access-control-allow-methods  ': [ 'GET', 'post', 'OpTiOnS', 'paTCH' ],
      }).values()).to.eql({
        'Access-Control-Allow-Methods': [ 'GET, POST, OPTIONS, PATCH' ],
      })

      expect(new Headers({
        '  access-control-allow-methods  ': [ 'GET,,,post', '  OpTiOnS , , , paTCH ' ],
      }).values()).to.eql({
        'Access-Control-Allow-Methods': [ 'GET, POST, OPTIONS, PATCH' ],
      })
    })

    it('should normalise the value of the Access-Control-Allow-Methods header when "add()" is used', () => {
      let h = new Headers({ '  access-control-allow-methods  ': ' GET, post, ' })
        .add('Access-Control-Allow-Methods', ' OpTiOnS ')
        .add('Access-Control-Allow-Methods', [ 'put', ' patch' ])
        .add('Access-Control-Allow-Methods', [ '  lock,,,, UNLOCK ' ])

      expect(h.values()).to.eql({
        'Access-Control-Allow-Methods': [ 'GET, POST, OPTIONS, PUT, PATCH, LOCK, UNLOCK' ],
      })
    })
  })
})
