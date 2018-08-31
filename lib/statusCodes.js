'use strict'

const { STATUS_CODES } = require('http')

module.exports = function statusCodes(status) {
  let statusCode = typeof status === 'number' ? status : parseInt(status)
  if (isNaN(statusCode)) throw new TypeError(`Invalid status code ${status}`)
  if ((statusCode < 100) || (statusCode > 599)) {
    throw new TypeError(`Unknown HTTP status code ${statusCode}`)
  }

  let statusMessage = STATUS_CODES[statusCode] || 'Unknown'

  return { statusCode, statusMessage }
}
