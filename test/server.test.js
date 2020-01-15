'use strict'

const { expect } = require('chai')
const { randomBytes } = require('crypto')

const request = require('request-promise-native')
const http = require('http')
const zlib = require('zlib')

const options = { resolveWithFullResponse: true }

/* eslint no-invalid-this: "off" */
describe('HTTP Server', () => {
  let Server, Response, port = null

  before(() => {
    Server = require('../classes/server')
    Response = require('../classes/response')
  })

  describe('Construction', () => {
    it('should construct and close an anonymous server', async () => {
      /* Construct the server */
      let s = await new Server(() => new Response()).start()

      /* Basic checks */
      expect(s).to.be.an('object')
      expect(s.host).to.equal('127.0.0.1')
      expect(s.port).to.be.a('number')
      expect(s.stop).to.be.a('function')
      expect(s.server).to.be.instanceof(http.Server)

      /* Remember this, when we close() it will be -1 */
      let serverPort = s.port

      /* Test connectivity and close server */
      try {
        let r = await request.get(`http://127.0.0.1:${s.port}/`, options)
        expect(r.statusCode).to.equal(204)
      } finally {
        await s.stop()
      }

      /* Check the server was closed */
      let error = null
      try {
        await request.get(`http://127.0.0.1:${s.port}/`, options)
      } catch (e) {
        error = e
      }

      expect(error).to.be.instanceof(Error)
      expect(error.message).to.match(/ECONNREFUSED/)

      /* All good */
      port = serverPort
    })

    it('should construct a server with host and port (1)', async function() {
      if (! port) return this.skip()

      let s = await new Server(() => new Response(), '0.0.0.0', port).start()

      try {
        expect(s.host).to.equal('0.0.0.0')
        expect(s.port).to.equal(port)
      } finally {
        await s.stop()
      }
    })

    it('should construct a server with host and port (2)', async function() {
      if (! port) return this.skip()

      let s = await new Server(() => new Response(), null, port.toString()).start()

      try {
        expect(s.host).to.equal('127.0.0.1')
        expect(s.port).to.equal(port)
      } finally {
        await s.stop()
      }
    })


    it('should construct a server with host and port (3)', async function() {
      if (! port) return this.skip()

      let s = await new Server(() => new Response(), { host: null, port: port }).start()

      try {
        expect(s.host).to.equal('127.0.0.1')
        expect(s.port).to.equal(port)
      } finally {
        await s.stop()
      }
    })

    it('should construct a server with host and port (4)', async function() {
      if (! port) return this.skip()

      let s = await new Server(() => new Response(), { port: port.toString() }).start()

      try {
        expect(s.host).to.equal('127.0.0.1')
        expect(s.port).to.equal(port)
      } finally {
        await s.stop()
      }
    })

    it('should not construct a server without a valid service handler', () => {
      expect(() => new Server('foo')).to.throw(TypeError, 'Service must be a function')
    })

    it('should not return a host or port for an unstarted server', () => {
      let server = new Server(() => new Response())
      expect(server.host).to.be.null
      expect(server.port).to.be.null
    })
  })

  /* ======================================================================== */

  describe('Basic responses', () => {
    it('should respond with a proper Response', async () => {
      let s = await new Server((req) => new Response(201, 'I am done')).start()

      try {
        let r = await request.get(`http://127.0.0.1:${s.port}/`, options)
        expect(r.statusCode).to.equal(201)
        expect(r.statusMessage).to.equal('Created')
        expect(r.body).to.equal('I am done')
        expect(r.headers.server).to.match(/^\@koerber-internal\/swagger-press\/[0-9]+$/)
      } finally {
        await s.stop()
      }
    })

    it('should correctly handle resolved promises', async function() {
      this.slow(300)

      let s = await new Server((req) => new Promise((resolve, reject) => {
        setTimeout(() => resolve(new Response(201, 'I am done')), 100)
      })).start()

      try {
        let r = await request.get(`http://127.0.0.1:${s.port}/`, options)
        expect(r.statusCode).to.equal(201)
        expect(r.statusMessage).to.equal('Created')
        expect(r.body).to.equal('I am done')
        expect(r.headers.server).to.match(/^\@koerber-internal\/swagger-press\/[0-9]+$/)
      } finally {
        await s.stop()
      }
    })

    it('should correctly handle rejected promises', async function() {
      this.slow(300)

      let s = await new Server((req) => new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error('Stuff happens')), 100)
      })).start()

      let error
      try {
        await request.get(`http://127.0.0.1:${s.port}/`, options)
      } catch (e) {
        error = e
      } finally {
        await s.stop()
      }

      expect(error).to.be.instanceof(Error)
      expect(error.response).to.be.an('object')
      expect(error.response.statusCode).to.equal(500)
      expect(error.response.statusMessage).to.equal('Internal Server Error')
      expect(error.response.headers['content-type']).to.equal('application/json; charset=UTF-8')

      let body = JSON.parse(error.response.body)

      expect(body.statusCode).to.equal(500)
      expect(body.statusMessage).to.equal('Internal Server Error')
      expect(body.message).to.equal('Stuff happens')
      expect(body.stack).to.be.an('array')
      expect(body.stack[0]).to.equal('Error: Stuff happens')
    })


    it('should have present a Response and allow it to be modified', async () => {
      let s = await new Server((req, res) => {
        res.status(201)
           .body('I am done')
           .set('Server', 'WhateverServer/0')
      }).start()

      try {
        let r = await request.get(`http://127.0.0.1:${s.port}/`, options)
        expect(r.statusCode).to.equal(201)
        expect(r.statusMessage).to.equal('Created')
        expect(r.body).to.equal('I am done')
        expect(r.headers.server).to.equal('WhateverServer/0')
      } finally {
        await s.stop()
      }
    })

    it('should respond with 404 by default', async () => {
      let s = await new Server((req) => null).start()

      let error
      try {
        await request.get(`http://127.0.0.1:${s.port}/`, options)
      } catch (e) {
        error = e
      } finally {
        await s.stop()
      }

      expect(error).to.be.instanceof(Error)
      expect(error.response).to.be.an('object')
      expect(error.response.statusCode).to.equal(404)
      expect(error.response.statusMessage).to.equal('Not Found')
      expect(error.response.body).to.equal('')
    })

    it('should respond with a proper Response', async () => {
      let s = await new Server((req) => 'this is so wrong').start()

      let error
      try {
        await request.get(`http://127.0.0.1:${s.port}/`, options)
      } catch (e) {
        error = e
      } finally {
        await s.stop()
      }

      expect(error).to.be.instanceof(Error)
      expect(error.response).to.be.an('object')
      expect(error.response.statusCode).to.equal(500)
      expect(error.response.statusMessage).to.equal('Internal Server Error')
      expect(error.response.headers['content-type']).to.equal('application/json; charset=UTF-8')

      let body = JSON.parse(error.response.body)

      expect(body.statusCode).to.equal(500)
      expect(body.statusMessage).to.equal('Internal Server Error')
      expect(body.message).to.equal('Response is not of type Response')
      expect(body.stack).to.be.an('array')
      expect(body.stack[0]).to.equal('TypeError: Response is not of type Response')
    })
  })

  /* ======================================================================== */

  describe('Body parsing', () => {
    let buffer = randomBytes(1048576), server

    before(async () => server = await new Server((request) => {
      expect(request.body).to.be.instanceof(Buffer)
      expect(buffer.equals(request.body), 'Wrong buffer').to.be.true
      return new Response()
    }, '127.0.0.1', 9999).start())

    after(async () => server && await server.stop())

    it('should always have a body (1)', async () => {
      let s = await new Server((req) => {
        expect(req.body).to.be.instanceof(Buffer)
        expect(req.body.length).to.equal(0)
        return new Response()
      }).start()

      try {
        let r = await request.get(`http://127.0.0.1:${s.port}/`, options)
        expect(r.statusCode).to.equal(204)
      } finally {
        await s.stop()
      }
    })

    it('should always have a body (2)', async () => {
      let s = await new Server((req) => {
        expect(req.body).to.be.instanceof(Buffer)
        expect(req.body.length).to.equal(0)
        return new Response()
      }).start()

      try {
        let r = await request.post({
          uri: `http://127.0.0.1:${s.port}/`,
          headers: {
            'conent-type': 'application/binary',
            'x-test-header': [ 'first', 'second' ],
          },
          body: '',
          resolveWithFullResponse: true,
        })
        expect(r.statusCode).to.equal(204)
      } finally {
        await s.stop()
      }
    })

    it('should make sure the handler works', async () => {
      let error
      try {
        await request.post({
          uri: `http://127.0.0.1:${server.port}/`,
          headers: {
            'conent-type': 'application/binary',
            'x-test-header': [ 'first', 'second' ],
          },
          body: new Buffer(100),
          resolveWithFullResponse: true,
        })
      } catch (e) {
        error = e
      }

      expect(error).to.be.instanceof(Error)
      expect(error.response).to.be.an('object')
      expect(error.response.statusCode).to.equal(500)
      expect(error.response.statusMessage).to.equal('Internal Server Error')
      expect(error.response.headers['content-type']).to.equal('application/json; charset=UTF-8')

      let body = JSON.parse(error.response.body)

      expect(body.statusCode).to.equal(500)
      expect(body.statusMessage).to.equal('Internal Server Error')
      expect(body.message).to.equal('Wrong buffer: expected false to be true')
      expect(body.stack).to.be.an('array')
      expect(body.stack[0]).to.equal('AssertionError: Wrong buffer: expected false to be true')
    })

    it('should process a request with a body', async () => {
      let r = await request.post({
        uri: `http://127.0.0.1:${server.port}/`,
        headers: {
          'conent-type': 'application/binary',
          'x-test-header': [ 'first', 'second' ],
        },
        body: buffer,
        resolveWithFullResponse: true,
      })
      expect(r.statusCode).to.equal(204)
    })

    it('should process a request with a deflated body', async function() {
      this.slow(200)

      let r = await request.post({
        uri: `http://127.0.0.1:${server.port}/`,
        headers: {
          'content-type': 'application/binary',
          'content-encoding': 'deflate',
        },
        body: zlib.deflateSync(buffer),
        resolveWithFullResponse: true,
      })
      expect(r.statusCode).to.equal(204)
    })

    it('should process a request with a gzipped body', async function() {
      this.slow(200)

      let r = await request.post({
        uri: `http://127.0.0.1:${server.port}/`,
        headers: {
          'content-type': 'application/binary',
          'content-encoding': 'gzip',
        },
        body: zlib.gzipSync(buffer),
        resolveWithFullResponse: true,
      })
      expect(r.statusCode).to.equal(204)
    })

    it('should process a request with a x-gzipped body', async function() {
      this.slow(200)

      let r = await request.post({
        uri: `http://127.0.0.1:${server.port}/`,
        headers: {
          'content-type': 'application/binary',
          'content-encoding': 'x-gzip',
        },
        body: zlib.gzipSync(buffer),
        resolveWithFullResponse: true,
      })
      expect(r.statusCode).to.equal(204)
    })

    it('should not process a request with the wrong content encoding', async () => {
      let error
      try {
        await request.post({
          uri: `http://127.0.0.1:${server.port}/`,
          headers: {
            'content-type': 'application/binary',
            'content-encoding': 'foo',
          },
          body: new Buffer(1024),
          resolveWithFullResponse: true,
        })
      } catch (e) {
        error = e
      } finally {
        delete process.env.REQUEST_MAX_LENGTH
      }

      expect(error).to.be.instanceof(Error)
      expect(error.response).to.be.an('object')
      expect(error.response.statusCode).to.equal(415)
      expect(error.response.statusMessage).to.equal('Unsupported Media Type')
      expect(error.response.headers['content-type']).to.equal('application/json; charset=UTF-8')
      expect(JSON.parse(error.response.body)).to.eql({
        statusCode: 415,
        statusMessage: 'Unsupported Media Type',
        message: 'Unsupported Content-Encoding "foo"',
      })
    })

    it('should abort processing beyond the limit of REQUEST_MAX_LENGTH', async function() {
      process.env.REQUEST_MAX_LENGTH = '512kb' // big enough

      let s = await new Server((req) => new Response(201, 'I am done')).start()

      try {
        let r = await request.post({
          uri: `http://127.0.0.1:${s.port}/`,
          headers: { 'content-type': 'application/binary' },
          resolveWithFullResponse: true,
          body: new Buffer(524288),
        })
        expect(r.statusCode).to.equal(201)
        expect(r.statusMessage).to.equal('Created')
        expect(r.body).to.equal('I am done')
      } catch (e) {
        delete process.env.REQUEST_MAX_LENGTH
        s.stop()
        throw e
      }

      let error
      try {
        await request.post({
          uri: `http://127.0.0.1:${s.port}/`,
          headers: { 'content-type': 'application/binary' },
          resolveWithFullResponse: true,
          body: new Buffer(524289),
        })
      } catch (e) {
        error = e
      } finally {
        delete process.env.REQUEST_MAX_LENGTH
        s.stop()
      }

      expect(error).to.be.instanceof(Error)

      if (! error.response) {
        // Sometimes the request gets killed before being processed...
        if (/EPIPE/.test(error.message)) return this.skip()
        throw error
      }

      expect(error.response).to.be.an('object')
      expect(error.response.statusCode).to.equal(413)
      expect(error.response.statusMessage).to.equal('Payload Too Large')
      expect(error.response.headers['content-type']).to.equal('application/json; charset=UTF-8')
      expect(JSON.parse(error.response.body)).to.eql({
        statusCode: 413,
        statusMessage: 'Payload Too Large',
        message: 'Content-Length Too Large',
      })
    })

    it('should abort processing after REQUEST_TIMEOUT', async function() {
      this.slow(250)

      process.env.REQUEST_TIMEOUT = '100ms' // big enough
      let s = await new Server((req) => new Promise(()=>{})).start()

      let error
      try {
        await request.get(`http://127.0.0.1:${s.port}/`)
      } catch (e) {
        error = e
      } finally {
        delete process.env.REQUEST_TIMEOUT
        s.stop()
      }

      expect(error).to.be.instanceof(Error)
      expect(error.response).to.be.an('object')
      expect(error.response.statusCode).to.equal(504)
      expect(error.response.statusMessage).to.equal('Server Timeout')
    })
  })
})
