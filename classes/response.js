'use strict'

const statusCodes = require('../lib/statusCodes')
const Headers = require('./headers')

const emptyBuffer = new Buffer(0)

class Response {
  constructor(statusOrBody, body) {
    let data = { headers: new Headers() }
    Object.defineProperty(this, '__data', { writable: false, value: data })

    if (typeof statusOrBody !== 'number') {
      body = statusOrBody
      statusOrBody = null
    }

    if (statusOrBody) this.status(statusOrBody)
    if (body) this.body(body)
  }

  status(statusCode, statusMessage) {
    if (! statusCode) return this

    let status = statusCodes(statusCode)

    this.__data.statusCode = status.statusCode
    this.__data.statusMessage = statusMessage || status.statusMessage

    return this
  }

  set(name, value) {
    this.__data.headers.set(name, value)
    return this
  }

  add(name, value) {
    this.__data.headers.add(name, value)
    return this
  }

  body(body) {
    let type, buffer

    if (body) {
      if (Buffer.isBuffer(body)) {
        type = 'application/binary'
        buffer = body
      } else if (typeof body === 'object') {
        type = 'application/json; charset=UTF-8'
        buffer = new Buffer(JSON.stringify(body), 'utf8')
      } else {
        type = 'text/plain; charset=UTF-8'
        buffer = new Buffer(body.toString(), 'utf8')
      }
    } else {
      type = null
      buffer = emptyBuffer
    }

    /* Remember buffer and type */
    this.__data.body = buffer
    this.__data.type = type

    return this
  }

  build() {
    let { statusCode, statusMessage, type, headers, body = emptyBuffer } = this.__data

    /* Status is 200 if we have content, 204 if we don't */
    statusCode = statusCode || ( body.length ? 200 : 204 )
    statusMessage = statusMessage || statusCodes(statusCode).statusMessage

    /* Inject the "content-type" and "content-length" headers */
    if (type) {
      if (! headers['content-type']) headers['content-type'] = [ type ]
      headers['content-length'] = [ body.length ]
    }

    return { statusCode, statusMessage, headers: headers.values(), body }
  }

  get headers() {
    return this.__data.headers
  }
}

module.exports = Response
