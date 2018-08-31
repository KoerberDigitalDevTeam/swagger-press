'use strict'

const { expect } = require('chai')

describe('HTTP Response', () => {
  let Response
  before(() => Response = require('../classes/response'))

  it('should create an empty response', () => {
    let response = new Response().build()

    let body = response.body
    delete response.body

    expect(response).to.eql({
      statusCode: 204,
      statusMessage: 'No Content',
      headers: {},
    })

    expect(body).to.be.instanceof(Buffer)
    expect(body.length).to.equal(0)
  })

  it('should not modify the response with empty calls', () => {
    let response1 = new Response()

    let response2 = response1.status()
    expect(response1).to.equal(response2)

    let response3 = response2.body()
    expect(response2).to.equal(response3)

    let response = response2.build()

    let body = response.body
    delete response.body

    expect(response).to.eql({
      statusCode: 204,
      statusMessage: 'No Content',
      headers: {},
    })

    expect(body).to.be.instanceof(Buffer)
    expect(body.length).to.equal(0)
  })


  it('should create a response with a string', () => {
    let response = new Response('hello, world').build()

    let body = response.body
    delete response.body

    expect(response).to.eql({
      statusCode: 200,
      statusMessage: 'OK',
      headers: {
        'Content-Type': [ 'text/plain; charset=UTF-8' ],
        'Content-Length': [ '12' ],
      },
    })

    expect(body).to.be.instanceof(Buffer)
    expect(body.length).to.eql(12)
    expect(body.toString('utf8')).to.equal('hello, world')
  })


  it('should create a response with a buffer', () => {
    let buffer = new Buffer(10).fill(0x29)
    let response = new Response(buffer).build()

    let body = response.body
    delete response.body

    expect(response).to.eql({
      statusCode: 200,
      statusMessage: 'OK',
      headers: {
        'Content-Type': [ 'application/binary' ],
        'Content-Length': [ '10' ],
      },
    })

    expect(body).to.be.instanceof(Buffer)
    expect(body.length).to.eql(10)
    expect(body.compare(buffer)).to.equal(0)
  })

  it('should create a response with an object', () => {
    let response = new Response({ hello: 'world' }).build()

    let body = response.body
    delete response.body

    expect(response).to.eql({
      statusCode: 200,
      statusMessage: 'OK',
      headers: {
        'Content-Type': [ 'application/json; charset=UTF-8' ],
        'Content-Length': [ '17' ],
      },
    })

    expect(body).to.be.instanceof(Buffer)
    expect(body.length).to.eql(17)
    expect(body.toString('utf8')).to.equal('{"hello":"world"}')
  })

  it('should create a response with an array', () => {
    let response = new Response([ 1, 2, 3, 'stella' ]).build()

    let body = response.body
    delete response.body

    expect(response).to.eql({
      statusCode: 200,
      statusMessage: 'OK',
      headers: {
        'Content-Type': [ 'application/json; charset=UTF-8' ],
        'Content-Length': [ '16' ],
      },
    })

    expect(body).to.be.instanceof(Buffer)
    expect(body.length).to.eql(16)
    expect(body.toString('utf8')).to.equal('[1,2,3,"stella"]')
  })

  it('should create a response with a simple status', () => {
    let response = new Response(100).build()

    let body = response.body
    delete response.body

    expect(response).to.eql({
      statusCode: 100,
      statusMessage: 'Continue',
      headers: {},
    })

    expect(body).to.be.instanceof(Buffer)
    expect(body.length).to.equal(0)
  })

  it('should create a response with a status and body', () => {
    let response = new Response(404, 'Go away!!!').build()

    let body = response.body
    delete response.body

    expect(response).to.eql({
      statusCode: 404,
      statusMessage: 'Not Found',
      headers: {
        'Content-Type': [ 'text/plain; charset=UTF-8' ],
        'Content-Length': [ '10' ],
      },
    })

    expect(body).to.be.instanceof(Buffer)
    expect(body.length).to.eql(10)
    expect(body.toString('utf8')).to.equal('Go away!!!')
  })

  it('should create a response with a body', () => {
    let response = new Response('Hello, world!').build()

    let body = response.body
    delete response.body

    expect(response).to.eql({
      statusCode: 200,
      statusMessage: 'OK',
      headers: {
        'Content-Type': [ 'text/plain; charset=UTF-8' ],
        'Content-Length': [ '13' ],
      },
    })

    expect(body).to.be.instanceof(Buffer)
    expect(body.length).to.eql(13)
    expect(body.toString('utf8')).to.equal('Hello, world!')
  })

  it('should create a response with a non-latin body', () => {
    let response = new Response('Hello, 東京!').build()

    let body = response.body
    delete response.body

    expect(response).to.eql({
      statusCode: 200,
      statusMessage: 'OK',
      headers: {
        'Content-Type': [ 'text/plain; charset=UTF-8' ],
        'Content-Length': [ '14' ],
      },
    })

    expect(body).to.be.instanceof(Buffer)
    expect(body.length).to.eql(14)
    expect(body.toString('utf8')).to.equal('Hello, 東京!')
    expect(body.toString('utf8').length).to.eql(10)
  })

  it('should create a response with a body and force the content type', () => {
    let response = new Response('<html></html>')
      .set('content-type', 'text/html')
      .build()

    let body = response.body
    delete response.body

    expect(response).to.eql({
      statusCode: 200,
      statusMessage: 'OK',
      headers: {
        'Content-Type': [ 'text/html' ],
        'Content-Length': [ '13' ],
      },
    })

    expect(body).to.be.instanceof(Buffer)
    expect(body.length).to.eql(13)
    expect(body.toString('utf8')).to.equal('<html></html>')
    expect(body.toString('utf8').length).to.eql(13)
  })


  it('should set and add header values', () => {
    let responseBuilder = new Response(302, 'Go somewhere else...')
      .set('X-My-Header', [ 'this is the value' ])
      .add('Location', 'http://www.example.com/')
      .add('Location', 'http://www.example.org/')

    expect(responseBuilder.headers.values()).to.eql({
      'X-My-Header': [ 'this is the value' ],
      'Location': [ 'http://www.example.com/', 'http://www.example.org/' ],
    })

    let response = responseBuilder.build()

    let body = response.body
    delete response.body

    expect(response).to.eql({
      statusCode: 302,
      statusMessage: 'Found',
      headers: {
        'X-My-Header': [ 'this is the value' ],
        'Location': [ 'http://www.example.com/', 'http://www.example.org/' ],
        'Content-Type': [ 'text/plain; charset=UTF-8' ],
        'Content-Length': [ '20' ],
      },
    })

    expect(body).to.be.instanceof(Buffer)
    expect(body.length).to.eql(20)
    expect(body.toString('utf8')).to.equal('Go somewhere else...')
  })
})
