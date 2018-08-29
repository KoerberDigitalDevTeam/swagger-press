'use strict'

const { STATUS_CODES } = require('http')
const Headers = require('./headers')

const emptyBuffer = new Buffer(0)
const instanceData = new WeakMap()

class Response {
  constructor(statusOrBody, body) {
    // Our initial state
    instanceData.set(this, { headers: new Headers() })

    if (typeof statusOrBody !== 'number') {
      body = statusOrBody
      statusOrBody = null
    }

    if (statusOrBody) this.status(statusOrBody)
    if (body) this.body(body)
  }

  status(statusCode, statusMessage) {
    if (! statusCode) return this

    let data = instanceData.get(this)

    data.statusCode = parseInt(statusCode) || 200
    data.statusMessage = statusMessage || STATUS_CODES[data.statusCode] || 'Unknown'

    if ((data.statusCode < 100) || (data.statusCode > 599)) {
      throw new TypeError(`Unknown HTTP status code ${statusCode}`)
    }

    return this
  }

  set(name, value) {
    instanceData.get(this).headers.set(name, value)
    return this
  }

  add(name, value) {
    instanceData.get(this).headers.add(name, value)
    return this
  }

  body(body) {
    let data = instanceData.get(this), type, buffer

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
    data.body = buffer
    data.type = type

    return this
  }

  build() {
    let { statusCode, statusMessage, type, headers, body = emptyBuffer } = instanceData.get(this)

    /* Status is 200 if we have content, 204 if we don't */
    statusCode = statusCode || ( body.length ? 200 : 204 )
    statusMessage = statusMessage || STATUS_CODES[statusCode] || 'Unknown'

    /* Inject the "content-type" and "content-length" headers */
    if (type) {
      if (! headers['content-type']) headers['content-type'] = [ type ]
      headers['content-length'] = [ body.length ]
    }

    return { statusCode, statusMessage, headers: headers.values(), body }
  }
}

module.exports = Response
