'use strict'

const { expect } = require('chai')

describe('HTTP Errors', () => {
  let HttpError, Response
  before(() => {
    HttpError = require('../classes/httperror')
    Response = require('../classes/response')
  })

  it('should be an Error', () => {
    expect(HttpError).to.be.a('function')

    let e = new HttpError()
    expect(e).to.be.instanceof(Error)

    expect(e.statusCode).to.equal(500)
    expect(e.statusMessage).to.equal('Internal Server Error')

    expect(e.toString()).to.equal('500 Internal Server Error')
    expect(e.message).to.equal('')
    expect(e.stack).to.match(/^500 Internal Server Error\n/m)
  })

  it('should construct with a valid status code', () => {
    let e = new HttpError(200)

    expect(e.statusCode).to.equal(200)
    expect(e.statusMessage).to.equal('OK')

    expect(e.toString()).to.equal('200 OK')
    expect(e.message).to.equal('')
    expect(e.stack).to.match(/^200 OK\n/m)
  })

  it('should construct with an unknown status code', () => {
    let e = new HttpError(123)

    expect(e.statusCode).to.equal(123)
    expect(e.statusMessage).to.equal('Unknown')

    expect(e.toString()).to.equal('123 Unknown')
    expect(e.message).to.equal('')
    expect(e.stack).to.match(/^123 Unknown\n/m)
  })

  it('should construct with a simple message', () => {
    let e = new HttpError('Wait, what?')

    expect(e.statusCode).to.equal(500)
    expect(e.statusMessage).to.equal('Internal Server Error')

    expect(e.toString()).to.equal('500 Internal Server Error: Wait, what?')
    expect(e.message).to.equal('Wait, what?')
    expect(e.stack).to.match(/^500 Internal Server Error: Wait, what\?\n/m)
  })


  it('should not construct with an invalid status code', () => {
    expect(() => new HttpError(999)).to.throw(TypeError, 'Unknown HTTP status code 999')
    expect(() => new HttpError(true)).to.throw(TypeError, 'Invalid status code true')
    expect(() => new HttpError({a:1})).to.throw(TypeError, 'Invalid status code [object Object]')
  })

  it('should construct with a detail message', () => {
    let e = new HttpError(404, 'I haven\'t found what you\'re looking for')

    expect(e.statusCode).to.equal(404)
    expect(e.statusMessage).to.equal('Not Found')

    expect(e.toString()).to.equal('404 Not Found: I haven\'t found what you\'re looking for')
    expect(e.message).to.equal('I haven\'t found what you\'re looking for')
    expect(e.stack).to.match(/^404 Not Found: I haven\'t found what you\'re looking for\n/m)
  })

  it('should convert an HttpError into a Response', () => {
    let response = HttpError.toResponse(new HttpError(404, 'No way!'))

    expect(response).to.be.instanceof(Response)

    let built = response.build()
    let body = built.body
    let headers = built.headers
    delete built.body
    delete built.headers

    expect(built).to.eql({
      statusCode: 404,
      statusMessage: 'Not Found',
    })

    expect(Object.keys(headers)).to.eql([ 'Content-Type', 'Content-Length' ])
    expect(headers['Content-Type']).to.eql([ 'application/json; charset=UTF-8' ])
    expect(parseInt(headers['Content-Length'][0])).to.be.greaterThan(500)

    let parsed = JSON.parse(body.toString('utf8'))
    let stack = parsed.stack
    delete parsed.stack

    expect(parsed).to.eql({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'No way!',
    })

    expect(stack).to.be.an('array')
    expect(stack[0]).to.equal('404 Not Found: No way!')
  })

  it('should convert an HttpError without message into a Response', () => {
    let response = HttpError.toResponse(new HttpError(404))

    expect(response).to.be.instanceof(Response)

    let built = response.build()
    let body = built.body
    let headers = built.headers
    delete built.body
    delete built.headers

    expect(built).to.eql({
      statusCode: 404,
      statusMessage: 'Not Found',
    })

    expect(Object.keys(headers)).to.eql([ 'Content-Type', 'Content-Length' ])
    expect(headers['Content-Type']).to.eql([ 'application/json; charset=UTF-8' ])
    expect(parseInt(headers['Content-Length'][0])).to.be.greaterThan(500)

    let parsed = JSON.parse(body.toString('utf8'))
    let stack = parsed.stack
    delete parsed.stack

    expect(parsed).to.eql({
      statusCode: 404,
      statusMessage: 'Not Found',
    })

    expect(stack).to.be.an('array')
    expect(stack[0]).to.equal('404 Not Found')
  })

  it('should convert an Error into a Response', () => {
    let response = HttpError.toResponse(new TypeError('Hello, world!'))

    expect(response).to.be.instanceof(Response)

    let built = response.build()
    let body = built.body
    let headers = built.headers
    delete built.body
    delete built.headers

    expect(built).to.eql({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })

    expect(Object.keys(headers)).to.eql([ 'Content-Type', 'Content-Length' ])
    expect(headers['Content-Type']).to.eql([ 'application/json; charset=UTF-8' ])
    expect(parseInt(headers['Content-Length'][0])).to.be.greaterThan(500)

    let parsed = JSON.parse(body.toString('utf8'))
    let stack = parsed.stack
    delete parsed.stack

    expect(parsed).to.eql({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Hello, world!',
    })

    expect(stack).to.be.an('array')
    expect(stack[0]).to.equal('TypeError: Hello, world!')
  })

  it('should convert something into a Response', () => {
    let response = HttpError.toResponse('Why did I throw a string?')

    expect(response).to.be.instanceof(Response)

    let built = response.build()
    let body = built.body
    let headers = built.headers
    delete built.body
    delete built.headers

    expect(built).to.eql({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })

    expect(Object.keys(headers)).to.eql([ 'Content-Type', 'Content-Length' ])
    expect(headers['Content-Type']).to.eql([ 'application/json; charset=UTF-8' ])
    expect(parseInt(headers['Content-Length'][0])).to.be.greaterThan(50)

    let parsed = JSON.parse(body.toString('utf8'))

    expect(parsed).to.eql({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Why did I throw a string?',
    })
  })

  it('should not convert a Response', () => {
    let response1 = new Response()
    let response2 = HttpError.toResponse(response1)

    expect(response1).to.equal(response2)
  })

  /* Constructor functions */
  const functions = {
    continue: 100,
    switchingProtocols: 101,
    processing: 102,
    ok: 200,
    created: 201,
    accepted: 202,
    nonAuthoritativeInformation: 203,
    noContent: 204,
    resetContent: 205,
    partialContent: 206,
    multiStatus: 207,
    alreadyReported: 208,
    imUsed: 226,
    multipleChoices: 300,
    movedPermanently: 301,
    found: 302,
    seeOther: 303,
    notModified: 304,
    useProxy: 305,
    temporaryRedirect: 307,
    permanentRedirect: 308,
    badRequest: 400,
    unauthorized: 401,
    paymentRequired: 402,
    forbidden: 403,
    notFound: 404,
    methodNotAllowed: 405,
    notAcceptable: 406,
    proxyAuthenticationRequired: 407,
    requestTimeout: 408,
    conflict: 409,
    gone: 410,
    lengthRequired: 411,
    preconditionFailed: 412,
    payloadTooLarge: 413,
    uriTooLong: 414,
    unsupportedMediaType: 415,
    rangeNotSatisfiable: 416,
    expectationFailed: 417,
    imATeapot: 418,
    misdirectedRequest: 421,
    unprocessableEntity: 422,
    locked: 423,
    failedDependency: 424,
    unorderedCollection: 425,
    upgradeRequired: 426,
    preconditionRequired: 428,
    tooManyRequests: 429,
    requestHeaderFieldsTooLarge: 431,
    unavailableForLegalReasons: 451,
    internalServerError: 500,
    notImplemented: 501,
    badGateway: 502,
    serviceUnavailable: 503,
    gatewayTimeout: 504,
    httpVersionNotSupported: 505,
    variantAlsoNegotiates: 506,
    insufficientStorage: 507,
    loopDetected: 508,
    bandwidthLimitExceeded: 509,
    notExtended: 510,
    networkAuthenticationRequired: 511,
  }

  it('should have all the required static construction functions', () => {
    for (let name in functions) {
      if (name in functions) {
        let status = functions[name]
        expect(HttpError[name], name).to.be.a('function')
        let e = HttpError[name]()
        expect(e, name).to.be.instanceof(HttpError)
        expect(e.statusCode, name).to.be.equal(status)
      }
    }
  })

  it('should properly create an HttpError with a constructor function', () => {
    let error = HttpError.notFound('Go away')

    expect(error.statusCode).to.equal(404)
    expect(error.statusMessage).to.equal('Not Found')
    expect(error.message).to.equal('Go away')
    expect(error.stack).to.match(/^404 Not Found: Go away\n/m)
  })
})
