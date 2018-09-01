'use strict'

const log = require('errorlog')({ category: 'http' })
const accessLog = require('errorlog')()

const Request = require('./request')
const Response = require('./response')
const HttpError = require('./httperror')

const http = require('http')
const zlib = require('zlib')
const bytes = require('bytes')
const ms = require('ms')

const version = ((p) => `${p.name}/${p.version.split('.', 1)[0]}`)(require('../package.json'))

/* Read the request, optionally inflating/gunzipping it */
function read(req, limit) {
  return new Promise((resolve, reject) => {
    let length = parseInt(req.headers['content-length']) || Number.MAX_VALUE
    if ((length != Number.MAX_VALUE) && (length > limit)) {
      req.pause()
      return reject(new HttpError(413, `Content-Length Too Large`))
    }

    let encoding = (req.headers['content-encoding'] || 'identity').toLowerCase()
    let buffers = [], stream = req, bytes = 0

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
        req.pause()
        reject(new HttpError(415, `Unsupported Content-Encoding "${encoding}"`))
        return
    }

    stream.on('data', (buffer) => {
      buffers.push(buffer)
      bytes += buffer.length

      /* istanbul ignore next: having troubles playing with content-length */
      if (bytes > length) {
        /* The request goes beyond content-length */
        req.pause()
        reject(new HttpError(413, `Reading beyond Content-Length`))
      } else if (bytes > limit) {
        /* The request is way too big... */
        req.pause()
        reject(new HttpError(413, `Body size limit reached`))
      }
    })

    /* istanbul ignore next: how can we simulate a socket error? */
    stream.on('error', (error) => reject(error))
    stream.on('end', () => {
      resolve(Buffer.concat(buffers))
    })
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
function adapt(handler, limit, timeout) {
  return async function adapter(req, res) {
    /* HTTP requests logging */
    let now = Date.now()
    let addr = req.socket.remoteAddress
    res.on('finish', () => {
      let sec = (Date.now() - now) / 1000
      accessLog(`${addr} "${req.method} ${req.url} HTTP/${req.httpVersion}" ${res.statusCode} ${sec}s`)
    })

    /* Kill the request, abort the response */
    let written = false
    let timer = setTimeout(() => {
      req.pause()
      log.error(`Killing request ${req.method} ${req.url} after ${timeout}ms`)
      write(res, new Response().status(504, 'Server Pimeout'))
      written = true
    }, timeout)

    /* First of all, read the body */
    let body
    try {
      body = await read(req, limit)
    } catch (error) {
      /* istanbul ignore else: it should really never happen */
      if (error instanceof HttpError) {
        delete error.stack // those are internal errors, no stacks
      } else {
        log.error(`Error reading body of ${req.method} ${req.url}`, error)
      }

      /* istanbul ignore else */
      if (! written) write(res, HttpError.toResponse(error))
      clearTimeout(timer)
      return
    }

    /* Simple parsing of request */
    try {
      let { method, url, rawHeaders: headers } = req
      let [ path, query ] = url.split(/\?(.*)/)

      let request = new Request({ method, path, query, headers, body })
      let response = new Response(404)
      let result = await handler(request, response)

      /* istanbul ignore else */
      if (! written) write(res, result || response)
    } catch (error) {
      log.error(`Error processing ${req.method} ${req.url}`, error)
      /* istanbul ignore else */
      if (! written) write(res, HttpError.toResponse(error))
    } finally {
      clearTimeout(timer)
    }
  }
}

/* ========================================================================== */

/* Our Server class returned by "create(...)" */
class Server {
  constructor(service, host, port = 0) {
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

    /* Request size limit and timeout */
    let limit = bytes(process.env.REQUEST_MAX_LENGTH) || 2097152 // default 2MB
    let timeout = ms('' + process.env.REQUEST_TIMEOUT) || 30000 // default 30 sec

    /* Create server and remember it */
    let server = http.createServer(adapt(service, limit, timeout))
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
        /* istanbul ignore if */
        if (error) return reject(error)
        resolve(this)
      })
    })
  }

  get host() {
    let address = this.server.address()
    return address ? address.address : null
  }

  get port() {
    let address = this.server.address()
    return address ? address.port : null
  }

  stop() {
    log.info(`Closing server at http://${this.host}:${this.port}/`)
    return new Promise((resolve, reject) => {
      this.server.close((error) => {
        /* istanbul ignore if */
        if (error) return reject(error)
        resolve(this)
      })
    })
  }
}

module.exports = Server
