'use strict'

const { STATUS_CODES } = require('http')

const statusCodes = require('../lib/statusCodes')
const Response = require('./response')

class HttpError extends Error {
  constructor(status = 500, message) {
    /* Normalize the status */
    if (typeof status === 'string') {
      message = status
      status = 500
    }

    /* Get status code and message */
    let { statusCode, statusMessage } = statusCodes(status)

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
  if (throwable instanceof Response) {
    return throwable
  } else if (throwable instanceof HttpError) {
    ({ statusCode, statusMessage, message, stack } = throwable)
  } else if (throwable instanceof Error) {
    ({ message, stack } = throwable);
    ({ statusCode, statusMessage } = statusCodes(500))
  } else {
    ({ statusCode, statusMessage } = statusCodes(500))
    message = throwable
  }

  let body = { statusCode, statusMessage }
  if (message) body.message = message
  if (stack) body.stack = stack.split('\n').map((line) => line.trim())

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
  HttpError[name] = (message) => new HttpError(status, message)
})

module.exports = HttpError
