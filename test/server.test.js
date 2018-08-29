'use strict'

const { expect } = require('chai')

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

  it('should process a request with a body', async () => {
    /* Construct the server */
    let s = await new Server(() => new Response()).start()

    /* Test connectivity */
    let r = await request.post({
      uri: `http://127.0.0.1:${s.port}/foo?a=b&a=c`,
      headers: {
        'conent-type': 'application/binary',
        'x-test-header': [ 'first', 'second' ],
      },
      body: new Buffer(1048576),
      resolveWithFullResponse: true,
    })
    expect(r.statusCode).to.equal(204)

    /* Close the server */
    await s.stop()
  })

  it('should process a request with a gzipped body', async () => {
    /* Construct the server */
    let s = await new Server(() => new Response()).start()

    /* Test connectivity */
    let r = await request.post({
      uri: `http://127.0.0.1:${s.port}/foo?a=b&a=c`,
      headers: {
        'content-type': 'application/binary',
        'content-encoding': 'gzip',
      },
      body: zlib.gzipSync(new Buffer(1048576)),
      resolveWithFullResponse: true,
    })
    expect(r.statusCode).to.equal(204)

    /* Close the server */
    await s.stop()
  })

  it('should not process a request with the wrong content encoding', async () => {
    /* Construct the server */
    let s = await new Server(() => new Response()).start()

    /* Test connectivity */
    let error
    try {
      await request.post({
        uri: `http://127.0.0.1:${s.port}/foo?a=b&a=c`,
        headers: {
          'content-type': 'application/binary',
          'content-encoding': 'foo',
        },
        resolveWithFullResponse: true,
      })
    } catch (e) {
      error = e
    }

    try {
      expect(error.response).to.be.an('object')
      expect(error.response.statusCode).to.equal(415)
      expect(error.response.statusMessage).to.equal('Unsupported Media Type')
      let body = JSON.parse(error.response.body)

      expect(body.statusCode).to.equal(415)
      expect(body.statusMessage).to.equal('Unsupported Media Type')
      expect(body.message).to.equal('Unsupported Content-Encoding "foo"')
      expect(body.stack).to.be.an('array')
      expect(body.stack[0]).to.equal('415 Unsupported Media Type: Unsupported Content-Encoding "foo"')
    } finally {
      await s.stop()
    }
  })
})
