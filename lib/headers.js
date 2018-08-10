'use strict'

/*
 * Our collection of known headers from
 * https://en.wikipedia.org/wiki/List_of_HTTP_header_fields
 */
let headers = [
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
]

/*
 * Prepare a map keyed by the lower-case representation of the header, and
 * with the value as the normal (Camel-Case) name of the header
 */
let mappings = {}
for (let header of headers) {
  mappings[header.toLowerCase()] = header
}

/* Normalise the headers */
function normalise(what) {
  if (typeof what === 'string') {
    /* A string is normalised in its Camel-Case version or returned as-is */
    return mappings[what.toLowerCase().trim()] || what.trim()
  } else if (what) {
    if (Array.isArray(what)) {
      return what.map((name) => mappings[name.toLowerCase().trim()] || name.trim())
    } else if (typeof what === 'object') {
      let headers = {}
      for (let name of Object.keys(what)) {
        let normalised = mappings[name.toLowerCase().trim()] || name.trim()
        let value = what[name]

        /* MSIE is pedantic about those */
        if ((normalised == 'Access-Control-Allow-Headers') ||
            (normalised == 'Access-Control-Expose-Headers') ||
            (normalised == 'Access-Control-Request-Headers')) {
          value = normalise(value.split(',')).join(', ')
        }

        if (normalised == 'Access-Control-Allow-Methods') {
          value = value.split(',').map((method) => method.toUpperCase().trim()).join(', ')
        }

        headers[normalised] = value
      }
      return headers
    }
  }
  /* Anything else is returned unmodified */
  return what
}

/* Inject our list of (frozen) canonical header names */
normalise.mappings = Object.freeze(mappings)
normalise.headers = Object.freeze(headers)

/* Expose our frozen object */
module.exports = normalise
