'use strict'

const { STATUS_CODES } = require('http')
const Response = require('./response')

class HttpError extends Error {
  constructor(statusCode = 500, message) {
    /* Normalize the status */
    statusCode = parseInt(statusCode) || 500
    if ((statusCode < 100) || (statusCode > 599)) {
      throw new TypeError(`Unknown HTTP status code ${statusCode}`)
    }

    /* Get the status code message */
    let statusMessage = STATUS_CODES[statusCode] || 'Unknown'

    /* Construct the error */
    super(message)
    this.name = `${statusCode} ${statusMessage}`

    /* Remember the status, message, ... */
    this.statusCode = statusCode
    this.statusMessage = statusMessage
  }
}

HttpError.toResponse = function toResponse(throwable) {
  let statusCode, statusMessage, message, stack
  if (throwable instanceof HttpError) {
    ({ statusCode, statusMessage, message, stack } = throwable)
  } else if (throwable instanceof Error) {
    ({ message, stack } = throwable)
    statusCode = 500
    statusMessage = STATUS_CODES[500]
  } else {
    statusCode = 500
    statusMessage = STATUS_CODES[500]
    message = throwable
  }

  let body = { statusCode, statusMessage }
  if (message) body.message = message
  if (stack) body.stack = stack

  return new Response(statusCode, body)
}

Object.keys(STATUS_CODES).forEach((key) => {
  let status = parseInt(key)

  /* Translate status messages into method names */
  let name = STATUS_CODES[key]
    /* Zap any character besides 'A-Za-z0-9-' */
    .replace(/[^a-zA-Z0-9 -]/g, '')
    /* Split by space ['Not', 'Found'] or dash ['Multi', 'Status'] */
    .split(/[ -]/g)
    /* First word lowercase, all other capitalise, then combine */
    .map((name, index) => index == 0 ? name.toLowerCase() :
      name.substr(0, 1).toUpperCase() + name.substr(1).toLowerCase()
    ).join('')

  /* Inject the creator function */
  HttpError[name] = (details) => new HttpError(status, details)
})

module.exports = HttpError
