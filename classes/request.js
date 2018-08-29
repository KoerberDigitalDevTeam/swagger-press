'use strict'

const http = require('http')
const iconv = require('iconv-lite')
const querystring = require('querystring')
const contentType = require('content-type')

const Headers = require('./headers')

/* ========================================================================== */

/* Split a string path into its components, and re-encode each */
function splitPaths(path) {
  /* Remove duplicate, leading and trailing slashes */
  let canonical = path.replace(/\/\/+/g, '/')
                      .replace(/^\//, '')
                      .replace(/\/$/, '')

  /* The empty string (could be '///', or '/', or '' basically is root */
  if (! canonical) return []

  /* Split up the path components */
  let parts = canonical.split('/')

  /* Re-encode each path component */
  return parts.map((part) => encodeURIComponent(decodeURIComponent(part)))
}

/* Convert a map into a map { key: [ val1, val2, val3 ]} */
function normaliseMap(map = {}, toLower = false) {
  return Object.keys(map).reduce((mapped, key) => {
    let value = map[key]
    if (toLower) key = key.toLowerCase()
    key = key.trim()

    let result = null
    if (Array.isArray(value)) {
      result = value.reduce((array, val) => {
        if (typeof val == 'string') array.push(val)
        else if (val != null) array.push(val.toString())
        return array
      }, [])
    } else if (typeof value == 'string') {
      result = [ value ]
    } else if (value != null) {
      result = [ value.toString() ]
    }

    if (result != null) {
      if (mapped[key]) result = mapped[key].concat(result)
      mapped[key] = result
    }
    return mapped
  }, {})
}

/* Reduce a map { key: [ val1, val2 ]} into a map { key: val2 } */
function reduceMap(map = {}) {
  return Object.keys(map).reduce((mapped, key) => {
    let value = map[key]

    if (Array.isArray(value)) {
      value = value[0]
    }

    if (typeof value == 'string') {
      mapped[key] = value
    } else if (value != null) {
      mapped[key] = value.toString()
    }
    return mapped
  }, {})
}

/* ========================================================================== */

function parseBody(body, header) {
  /* Quick checks */
  if (body == null) return null
  if (header == null) return body
  if (! Buffer.isBuffer(body)) return body

  /* Figure out the mime type and (optional) charset */
  let { type, parameters } = contentType.parse(header)
  let { charset } = parameters

  /* Quick body parsing routines */
  switch (type) {
    case 'application/json':
      return JSON.parse(iconv.decode(body, charset || 'utf8'))
      break
    case 'application/x-www-form-urlencoded':
      return querystring.parse(body.toString('ascii'), '&', '=', {
        decodeURIComponent: function(value) {
          let buffer = querystring.unescapeBuffer(value)
          return iconv.decode(buffer, charset || 'utf8')
        },
      })
      break
  }

  /* No matched type, but either a text type, or charset available */
  if (type.startsWith('text/')) return iconv.decode(body, charset || 'utf8')
  if (charset) return iconv.decode(body, charset)

  /* Really nothing we can do, abandon all hope */
  return body
}

/* ========================================================================== */

class Request {
  constructor(options) {
    let { method, path, query = {}, headers = {}, body = null } = options

    /* Check and normalise method */
    if (typeof method !== 'string') throw new Error('Method must be a string')

    method = method.toUpperCase()
    if (http.METHODS.indexOf(method) < 0) {
      console.warn(`WARNING: HTTP method "${method}" unknown`)
    }

    /* Check and normalise path */
    if (typeof path !== 'string') throw new Error('Path must be a string ')
    let pathComponents = splitPaths(path)
    path = '/' + pathComponents.join('/')

    /* Normalise header values in two maps */
    headers = new Headers(headers)

    /* Normalise query string parameter values in two maps */
    let queryString = null
    if (typeof query == 'string') {
      queryString = query
      query = querystring.parse(query)
    }

    let parameterValues = normaliseMap(query, false)
    let parameters = reduceMap(parameterValues)

    /* The body we get at construction must be a Buffer */
    if ((body != null) && (! Buffer.isBuffer(body))) throw new Error('Body must be a buffer')
    let parsed = (body == null)

    /* Instrument our object's own properties */
    Object.defineProperties(this, {
      method: { enumerable: true, value: method },

      path: { enumerable: true, value: path },
      pathComponents: { enumerable: true, value: Object.freeze(pathComponents) },

      headers: { enumerable: true, value: headers },

      parameters: { enumerable: true, value: Object.freeze(parameters) },
      parameterValues: { enumerable: true, value: Object.freeze(parameterValues) },
      query: { enumerable: true, value: queryString },

      body: {
        enumerable: true,
        get: function() {
          if (parsed) return body
          body = parseBody(body, headers['content-type'])
          parsed = true
          return body
        },
      },
    })
  }
}

module.exports = Request
