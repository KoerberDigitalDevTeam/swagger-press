'use strict'

const { expect } = require('chai')

describe('Headers', () => {
  let Headers
  before(() => Headers = require('../classes/headers'))

  describe('Construction', () => {
    it('should construct a Headers instance', () => {
      expect(Headers).to.be.a('function')
      expect(new Headers()).to.eql({})
    })

    it('should fail when header names are not a string', () => {
      expect(() => new Headers().set(1, 'foo'))
        .to.throw(TypeError, 'Header name must be of type string')
      expect(() => new Headers().set('\t', 'foo'))
        .to.throw(TypeError, 'Header name must be a non-empty string')
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

      expect(h['Content-Length']).to.be.undefined
    })

    it('should construct a Headers instance with an array', () => {
      let h = new Headers([
        { 'Content-Type': 'test1 ' },
        { ' content-type ': ' test2' },
        { 'X-Foo': [ 'hello', 'world', '  ' ] },
        { ' x-foo ': [ 'foo', 'bar', 'baz', null ] },
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

    it('should construct a Headers instance with an array of raw headers', () => {
      let h = new Headers([
        'Content-Type', 'test1',
        ' content-type ', 'test2',
        'X-Foo', 'hello',
        'x-foo', 'world',
      ])

      expect(h).to.eql({
        'Content-Type': 'test1',
        'X-Foo': 'hello',
      })

      expect(h.keys()).to.eql([ 'Content-Type', 'X-Foo' ])

      expect(h.values()).to.eql({
        'Content-Type': [ 'test1', 'test2' ],
        'X-Foo': [ 'hello', 'world' ],
      })
    })
  })

  /* ======================================================================== */

  describe('Setting', () => {
    it('should simply "set()" a header', () => {
      let h = new Headers().set('X-Foo', 'bar')
      expect(h).to.eql({ 'X-Foo': 'bar' })
    })

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
    it('should simply "add()" a header', () => {
      let h = new Headers().set('X-Foo', 'bar')
      expect(h).to.eql({ 'X-Foo': 'bar' })
    })

    it('should append header values "add()" method', () => {
      let h = new Headers({ 'X-Foo': 'bar' })

      expect(h).to.eql({ 'X-Foo': 'bar' })
      expect(h.values()).to.eql({ 'X-Foo': [ 'bar' ] })

      h.add('x-foo', 'baz')
      h.add('X-FOO', [ 'xyz', 'abc' ])
      h.add('X-None-1', 'hello 1' )
      h.add('X-None-2', [ 'hello 2', 'world' ])
      h.add('X-No-Value')

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

    it('should remove duplicates in the Access-Control-...-Headers headers', () => {
      let h = new Headers({
        '  access-control-allow-headers  ': 'content-type,CONTENT-TYPE,Content-Type',
        '  ACCESS-CONTROL-EXPOSE-HEADERS  ': [ 'content-type', 'CONTENT-TYPE', 'Content-Type' ],
        '  Access-Control-Request-Headers  ': [ 'content-type,,,CONTENT-TYPE', 'Content-Type' ],
      }).add('ACCESS-CONTROL-EXPOSE-HEADERS', 'Content-Type,,,content-type')
        .add('Access-Control-Request-Headers', 'Content-Type, content-type  ')
        .add('access-control-allow-headers', [ 'Content-Type', '  content-type ' ])

      expect(h.values()).to.eql({
        'Access-Control-Allow-Headers': [ 'Content-Type' ],
        'Access-Control-Expose-Headers': [ 'Content-Type' ],
        'Access-Control-Request-Headers': [ 'Content-Type' ],
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

    it('should emove duplicates in the Access-Control-Allow-Methods header', () => {
      let h = new Headers({ '  access-control-allow-methods  ': ' GET, post, ' })
        .add('Access-Control-Allow-Methods', ' GET ')
        .add('Access-Control-Allow-Methods', [ 'POST', ' GET' ])
        .add('Access-Control-Allow-Methods', [ '  post,,,, GET ' ])

      expect(h.values()).to.eql({
        'Access-Control-Allow-Methods': [ 'GET, POST' ],
      })
    })
  })

  /* ======================================================================== */

  describe('Serialization', () => {
    it('should properly serialize in JSON', () => {
      let body = JSON.stringify(new Headers({
        'Content-Type': 'application/binary',
        'content-length': 100,
        'ACCESS-CONTROL-ALLOW-HEADERS  ': [ 'content-type', 'CONTENT-LENGTH' ],
        'X-Foo': 'bar',
      }))

      expect(JSON.parse(body)).to.eql({
        'Content-Type': [ 'application/binary' ],
        'Content-Length': [ '100' ],
        'Access-Control-Allow-Headers': [ 'Content-Type, Content-Length' ],
        'X-Foo': [ 'bar' ],
      })
    })
  })
})
