'use strict'

/* ========================================================================== *
 * STATIC DATA                                                                *
 * ========================================================================== */

/*
 * Our collection of known headers from
 * https://en.wikipedia.org/wiki/List_of_HTTP_header_fields
 */
const headers = Object.freeze([
  'A-IM',
  'Accept',
  'Accept-Charset',
  'Accept-Datetime',
  'Accept-Encoding',
  'Accept-Language',
  'Accept-Patch',
  'Accept-Ranges',
  'Access-Control-Allow-Credentials',
  'Access-Control-Allow-Headers',
  'Access-Control-Allow-Methods',
  'Access-Control-Allow-Origin',
  'Access-Control-Expose-Headers',
  'Access-Control-Max-Age',
  'Access-Control-Request-Headers',
  'Access-Control-Request-Method',
  'Age',
  'Allow',
  'Alt-Svc',
  'Authorization',
  'Cache-Control',
  'Connection',
  'Content-Disposition',
  'Content-Encoding',
  'Content-Language',
  'Content-Length',
  'Content-Location',
  'Content-MD5',
  'Content-Range',
  'Content-Security-Policy',
  'Content-Type',
  'Cookie',
  'DNT',
  'Date',
  'Delta-Base',
  'ETag',
  'Expect',
  'Expires',
  'Forwarded',
  'From',
  'Front-End-Https',
  'Host',
  'IM',
  'If-Match',
  'If-Modified-Since',
  'If-None-Match',
  'If-Range',
  'If-Unmodified-Since',
  'Last-Modified',
  'Link',
  'Location',
  'Max-Forwards',
  'Origin',
  'P3P',
  'Pragma',
  'Proxy-Authenticate',
  'Proxy-Authorization',
  'Proxy-Connection',
  'Public-Key-Pins',
  'Range',
  'Referer',
  'Refresh',
  'Retry-After',
  'Save-Data',
  'Server',
  'Set-Cookie',
  'Status',
  'Strict-Transport-Security',
  'TE',
  'Timing-Allow-Origin',
  'Tk',
  'Trailer',
  'Transfer-Encoding',
  'Upgrade',
  'Upgrade-Insecure-Requests',
  'User-Agent',
  'Vary',
  'Via',
  'WWW-Authenticate',
  'Warning',
  'X-ATT-DeviceId',
  'X-Content-Duration',
  'X-Content-Security-Policy',
  'X-Content-Type-Options',
  'X-Correlation-ID',
  'X-Csrf-Token',
  'X-Forwarded-For',
  'X-Forwarded-Host',
  'X-Forwarded-Proto',
  'X-Frame-Options',
  'X-Http-Method-Override',
  'X-Powered-By',
  'X-Request-ID',
  'X-Requested-With',
  'X-UA-Compatible',
  'X-UIDH',
  'X-Wap-Profile',
  'X-WebKit-CSP',
  'X-XSS-Protection',
])

/*
 * Prepare a map keyed by the lower-case representation of the header, and
 * with the value as the normal (Camel-Case) name of the header
 */
const mappings = Object.freeze(headers.reduce((map, name) => {
  map[name.toLowerCase()] = name
  return map
}, {}))

/*
 * Normalise an array of comma-separated values into an array
 */
function processCommas(values, callback = ((x) => x)) {
  return [ values.join(',')
                 .replace(/\s/g, '') // get rid of spaces
                 .replace(/,+/g, ',') // replace multiple commas
                 .split(',') // split the string by commas
                 .map((h) => callback(h)) // normalise the header
                 .filter((h) => h) // only non-null non-empty values
                 .filter((h, i, a) => a.indexOf(h) == i) // dedupe
                 .join(', ') ] // re-combine in a comma separated string
}

/*
 * Normalise a header name into its canonical representation, with a "key"
 * being the lower-cased version of the name, and the "name" being it's
 * (possibly normalised) Camel-Case version
 */
function normalise(header, value) {
  /* Triple check header name type and length */
  if (typeof header !== 'string') {
    throw new TypeError('Header name must be of type string')
  }

  /* Normalise header key and name */
  let key = header.toLowerCase().trim()
  let name = mappings[key] || header.trim()

  if ((!key) || (!name)) {
    throw new TypeError('Header name must be a non-empty string')
  }

  /* Shortctut when no value is given */
  if (value == null) return { key, name, values: [] }

  /* Normalise a header value to an array */
  let values = (Array.isArray(value) ? value : [ value ])
    .reduce((array, value) => {
      if (value != null) value = value.toString().trim()
      if (value) array.push(value)
      return array
    }, [])

  /* Normalise Access-Control-...-(Headers|Methods) values */
  if (/^access-control-(allow|expose|request)-headers$/.test(key)) {
    values = processCommas(values, (component) => normalise(component).name)
  } else if (key == 'access-control-allow-methods') {
    values = processCommas(values, (component) => component.trim().toUpperCase())
  }

  /* Return our nomalised version */
  return { key, name, values }
}

/* ========================================================================== *
 * HEADERS STRUCTURE                                                          *
 * ========================================================================== */

class Headers {
  constructor(object) {
    Object.defineProperty(this, '__data', { writable: false, value: {} })

    /* From array [ { 'content-type': 'foo' }, { 'x-header': [ 'bar', 'baz' ] } ] */
    if (Array.isArray(object)) {
      /* Raw headers */
      if (typeof object[0] === 'string') {
        for (let i = 0; i < object.length; i += 2) {
          this.add(object[i], object[i + 1])
        }
      } else {
        object.forEach((entry) => {
          for (let key in entry) this.add(key, entry[key])
        })
      }

    /* From object { 'content-type': 'foo', 'x-header': [ 'bar', 'baz' ] } */
    } else if (object && (typeof object === 'object')) {
      for (let key in object) this.add(key, object[key])
    }
  }

  keys() {
    return Object.keys(this.__data).map((key) => this.__data[key].name)
  }

  values() {
    let result = {}
    for (let key of Object.keys(this.__data)) {
      let entry = this.__data[key]
      result[entry.name] = entry.values
    }
    return result
  }

  add(header, value) {
    /* Normalise header name and value */
    let { key, name, values } = normalise(header, value)

    /* No header values to add, bail out */
    if (values.length == 0) return this

    /* Add (to existing) data */
    let entry = this.__data[key]
    if (! entry) {
      this.__data[key] = { name, values }
    } else if (/^access-control-(allow|expose|request)-headers$/.test(key) ||
               (key == 'access-control-allow-methods')) {
      /* Remove duplicate entries */
      entry.values = processCommas(entry.values.concat(values)) // .join(',').replace(/\s+/g, '').split(',')
    } else {
     entry.values = entry.values.concat(values)
    }

    /* Chaining */
    return this
  }

  set(header, value) {
    /* Normalise header name and value */
    let { key, name, values } = normalise(header, value)

    /* No header values means delete */
    if (values.length == 0) {
      delete this.__data[key]
      return this
    }

    /* If we have a previous definition, copy the name */
    name = (this.__data[key] && this.__data[key].name) || name
    this.__data[key] = { name, values }

    /* Chaining */
    return this
  }

  del(header) {
    let { key } = normalise(header)
    delete this.__data[key]
    return this
  }

  get(header) {
    let { key } = normalise(header)

    let entry = this.__data[key]
    if (! entry) return undefined
    return entry.values
  }

  toJSON() {
    return this.values()
  }
}

/* istanbul ignore next | This is only proxy machinery */
module.exports = function HeadersProxy(object) {
  return new Proxy(new Headers(object), {
    get: (target, property) => {
      /* Declared properties and symbols */
      if (property in target) return target[property]
      if (typeof property !== 'string') return target[property]

      /* Return the first value for the header */
      return (target.get(property) || [])[0]
    },

    set: (target, property, value) => {
      /* Declared properties and symbols */
      if (property in target) return target[property] = value
      if (typeof property !== 'string') return target[property] = value

      /* Set the header value */
      target.set(property, value)
      return true
    },

    has: (target, property) => {
      /* Declared properties and symbols */
      if (property in target) return true
      if (typeof property !== 'string') property in target

      /* Check if we have the property */
      return target.get(property) != null
    },

    ownKeys: (target) => {
      return Reflect.ownKeys(target).concat(target.keys())
    },

    getOwnPropertyDescriptor(target, property) {
      let descriptor = Object.getOwnPropertyDescriptor(target, property)
      if (descriptor) return descriptor

      let value = target.get(property)
      if (value == null) return undefined
      return { configurable: true, enumerable: true, value }
    },

    deleteProperty: (target, property) => {
      /* Declared properties and symbols */
      if (property in target) return delete target[property]
      if (typeof property !== 'string') return delete target[property]

      /* Delete the header value */
      target.del(property)
      return true
    },
  })
}
