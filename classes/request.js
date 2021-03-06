'use strict'

const iconv = require('iconv-lite')
const querystring = require('querystring')
const contentType = require('content-type')

const { splitPath } = require('@koerber-internal/swagger-paths')

const Headers = require('./headers')

/* ========================================================================== */

/* Convert a map into a map { key: [ val1, val2, val3 ]} */
function normaliseMap(map) {
  return Object.keys(map).reduce((mapped, key) => {
    let value = map[key]

    let result
    if (Array.isArray(value)) {
      result = value.reduce((array, val) => {
        if ((typeof val === 'string') && val) array.push(val)
        else if (val != null) array.push(val.toString())
        return array
      }, [])
    } else if (typeof value == 'string') {
      if (value) result = [ value ]
    } else if (value != null) {
      result = [ value.toString() ]
    }

    if (result && result.length) mapped[key] = result

    return mapped
  }, {})
}

/* Reduce a map { key: [ val1, val2 ]} into a map { key: val2 } */
function reduceMap(map) {
  return Object.keys(map).reduce((mapped, key) => {
    mapped[key] = map[key][0]
    return mapped
  }, {})
}

/* ========================================================================== */

function parseBody(body, header) {
  /* Figure out the mime type and (optional) charset */
  let { type, parameters } = contentType.parse(header)
  let { charset } = parameters

  /* Quick body parsing routines */
  switch (type) {
    case 'application/json':
      return JSON.parse(iconv.decode(body, charset || 'utf8'))

    case 'application/x-www-form-urlencoded':
      return querystring.parse(body.toString('ascii'), '&', '=', {
        decodeURIComponent: function(value) {
          let buffer = querystring.unescapeBuffer(value)
          return iconv.decode(buffer, charset || 'utf8')
        },
      })
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
    if (typeof method !== 'string') throw new TypeError('Method must be a string')
    method = method.trim().toUpperCase()
    if (! method) throw new TypeError('Method must be a non-empty string')

    /* Check and normalise path */
    let pathComponents = splitPath(path)
    path = '/' + pathComponents.join('/')

    /* Normalise header values in two maps */
    headers = new Headers(headers)

    /* Normalise query string parameter values in two maps */
    let queryString = null
    if (typeof query == 'string') {
      queryString = query
      query = querystring.parse(query)
    }

    let parameterValues = normaliseMap(query)
    let parameters = reduceMap(parameterValues)

    /* The body we get at construction must be a Buffer */
    if ((body != null) && (! Buffer.isBuffer(body))) throw new TypeError('Body must be a buffer')
    let parsed = (body == null) || (!('content-type' in headers))

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
