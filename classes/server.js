'use strict'

const log = require('errorlog')({ category: 'http' })
const accessLog = require('errorlog')()

const Request = require('./request')
const Response = require('./response')
const HttpError = require('./httperror')

const http = require('http')
const zlib = require('zlib')

const version = ((p) => `${p.name}/${p.version}`)(require('../package.json'))

/* Read the request, optionally inflating/gunzipping it */
function read(req) {
  // TODO: limit length of request body
  return new Promise((resolve, reject) => {
    let encoding = (req.headers['content-encoding'] || 'identity').toLowerCase()
    let buffers = [], stream = req

    switch (encoding) {
      case 'identity':
        break

      case 'deflate':
        log.trace(`Deflating body for ${req.method} ${req.url}`)
        stream = zlib.createInflate()
        req.pipe(stream)
        break

      case 'x-gzip':
      case 'gzip':
        log.trace(`Gunzipping body for ${req.method} ${req.url}`)
        stream = zlib.createGunzip()
        req.pipe(stream)
        break

      default:
        throw HttpError.unsupportedMediaType(`Unsupported Content-Encoding "${encoding}"`)
    }

    stream.on('data', buffers.push.bind(buffers))
    stream.on('error', (error) => reject(new Error(error)))
    stream.on('aborted', (error) => reject(new Error('Request Aborted')))
    stream.on('end', () => resolve(Buffer.concat(buffers)))
  })
}

/* Write our Response to a Node.JS res(ponse) */
function write(res, response) {
  if (response instanceof Response) {
    if (! response.headers.server) response.headers.server = version
    let { statusCode, statusMessage, headers, body } = response.build()
    res.writeHead(statusCode, statusMessage, headers)
    res.end(body)
  } else {
    throw new TypeError('Response is not of type Response')
  }
}

/* Adapt our request handler as a HTTP middleware */
function adapt(handler) {
  // TODO: ensure timeout of X secs (req.abort...)
  return async function adapter(req, res) {
    /* HTTP requests logging */
    let now = Date.now()
    let addr = req.socket.remoteAddress
    res.on('finish', () => {
      let sec = (Date.now() - now) / 1000
      accessLog(`${addr} "${req.method} ${req.url} HTTP/${req.httpVersion}" ${res.statusCode} ${sec}s`)
    })

    /* Simple parsing of request */
    try {
      let { method, url, rawHeaders } = req
      let body = await read(req)

      let path, query, pos = url.indexOf('?')
      if (pos < 0) {
        path = url
        query = ''
      } else {
        path = url.substr(0, pos)
        query = url.substr(pos + 1)
      }

      let request = new Request({ method, path, query, headers: rawHeaders, body })
      let response = new Response(404)
      let result = handler(request, response)

      write(res, result || response)
    } catch (error) {
      log.error(`Error processing ${req.method} ${req.url}`, error)
      write(res, HttpError.toResponse(error))
    }
  }
}

/* ========================================================================== */

/* Our Server class returned by "create(...)" */
class Server {
  constructor(service, host = '127.0.0.1', port = 0) {
    if (typeof service !== 'function') throw new TypeError('Service must be a function')

    /* In case we were created with { host: ..., port: 1234 } */
    if ((host != null) && (typeof host === 'object')) {
      let object = host
      host = object.host
      port = object.port
    }

    /* Normalise host and port */
    host = host || process.env.HOST || '127.0.0.1'
    port = parseInt(port || process.env.PORT || 0)

    /* Create server and remember it */
    let server = http.createServer(adapt(service))
    Object.defineProperties(this, {
      server: { enumerable: true, configurable: false, value: server },
      __host: { enumerable: false, configurable: false, value: host },
      __port: { enumerable: false, configurable: false, value: port },
    })
  }

  start() {
    return new Promise((resolve, reject) => {
      this.server.listen(this.__port, this.__host, (error) => {
        log.info(`Server listening at http://${this.host}:${this.port}/`)
        if (error) return reject(error)
        resolve(this)
      })
    })
  }

  get host() {
    let address = this.server.address()
    return address ? address.address : '[null]'
  }

  get port() {
    let address = this.server.address()
    return address ? address.port : -1
  }

  stop() {
    log.info(`Closing server at http://${this.host}:${this.port}/`)
    return new Promise((resolve, reject) => {
      this.server.close((error) => {
        if (error) return reject(error)
        resolve(this)
      })
    })
  }
}

module.exports = Server
