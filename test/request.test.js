'use strict'

const { expect } = require('chai')
const Request = require('../lib/request')

describe('HTTP Request', () => {
  it('should construct a minimal request', () => {
    let request = new Request({
      method: 'get',
      path: '/',
    })

    expect(request).to.eql({
      method: 'GET',
      path: '/',
      pathComponents: [],
      headers: {},
      headerValues: {},
      parameters: {},
      parameterValues: {},
      query: null,
      body: null,
    })
  })

  it('should construct a more complex request with a query string', () => {
    let request = new Request({
      method: 'get',
      path: '///f%2fo///b&r///b^z///',
      query: 'FIRST=string&Second=1&Second=TWO&Second=3&second=four&third=true&fourth=0&SiXtH=1&SiXtH=TWO&SiXtH=3',
      headers: {
        'FIRST': 'string',
        'Second': [ 1, 'TWO', 3 ],
        'second': 'four',
        'third': true,
        'fourth': 0,
        'FIFTH': null,
        'SiXtH': [ '1', 'TWO', 3 ],
      },
    })

    expect(request).to.eql({
      method: 'GET',
      path: '/f%2Fo/b%26r/b%5Ez',
      pathComponents: [ 'f%2Fo', 'b%26r', 'b%5Ez' ],
      headers: {
        'first': 'string',
        'second': '1',
        'third': 'true',
        'fourth': '0',
        'sixth': '1',
      },
      headerValues: {
        'first': [ 'string' ],
        'second': [ '1', 'TWO', '3', 'four' ],
        'third': [ 'true' ],
        'fourth': [ '0' ],
        'sixth': [ '1', 'TWO', '3' ],
      },
      parameters: {
        'FIRST': 'string',
        'Second': '1',
        'second': 'four',
        'third': 'true',
        'fourth': '0',
        'SiXtH': '1',
      },
      parameterValues: {
        'FIRST': [ 'string' ],
        'Second': [ '1', 'TWO', '3' ],
        'second': [ 'four' ],
        'third': [ 'true' ],
        'fourth': [ '0' ],
        'SiXtH': [ '1', 'TWO', '3' ],
      },
      query: 'FIRST=string&Second=1&Second=TWO&Second=3&second=four&third=true&fourth=0&SiXtH=1&SiXtH=TWO&SiXtH=3',

      body: null,
    })
  })

  it('should construct a more complex request with a query map', () => {
    let request = new Request({
      method: 'get',
      path: '///f%2fo///b&r///b^z///',
      query: {
        'FIRST': 'string',
        'Second': [ 1, 'TWO', 3 ],
        'second': 'four',
        'third': true,
        'fourth': 0,
        'FIFTH': null,
        'SiXtH': [ '1', 'TWO', 3 ],
      },
      headers: {
        'FIRST': 'string',
        'Second': [ 1, 'TWO', 3 ],
        'second': 'four',
        'third': true,
        'fourth': 0,
        'FIFTH': null,
        'SiXtH': [ '1', 'TWO', 3 ],
      },
    })

    expect(request).to.eql({
      method: 'GET',
      path: '/f%2Fo/b%26r/b%5Ez',
      pathComponents: [ 'f%2Fo', 'b%26r', 'b%5Ez' ],
      headers: {
        'first': 'string',
        'second': '1',
        'third': 'true',
        'fourth': '0',
        'sixth': '1',
      },
      headerValues: {
        'first': [ 'string' ],
        'second': [ '1', 'TWO', '3', 'four' ],
        'third': [ 'true' ],
        'fourth': [ '0' ],
        'sixth': [ '1', 'TWO', '3' ],
      },
      parameters: {
        'FIRST': 'string',
        'Second': '1',
        'second': 'four',
        'third': 'true',
        'fourth': '0',
        'SiXtH': '1',
      },
      parameterValues: {
        'FIRST': [ 'string' ],
        'Second': [ '1', 'TWO', '3' ],
        'second': [ 'four' ],
        'third': [ 'true' ],
        'fourth': [ '0' ],
        'SiXtH': [ '1', 'TWO', '3' ],
      },
      query: null,
      body: null,
    })
  })

  /* ======================================================================== */

  it('should construct a request with an application/json body', () => {
    let request = new Request({
      method: 'get',
      path: '/test',
      headers: { 'content-type': 'application/json' },
      body: new Buffer('{"a":"東京"}', 'utf8'),
    })

    expect(request.body).to.eql({ a: '東京' })
  })

  it('should construct a request with an application/json body in utf8', () => {
    let request = new Request({
      method: 'get',
      path: '/test',
      headers: { 'content-type': 'application/json;charset=utf8' },
      body: new Buffer('{"a":"東京"}', 'utf8'),
    })

    expect(request.body).to.eql({ a: '東京' })
  })

  it('should construct a request with an application/json body in shift-jis', () => {
    let request = new Request({
      method: 'get',
      path: '/test',
      headers: { 'content-type': 'application/json;charset=shift-jis' },
      body: new Buffer('7b2261223a22938c8b9e227d', 'hex'),
    })

    expect(request.body).to.eql({ a: '東京' })
  })

  /* ======================================================================== */

  it('should construct a request with an application/x-www-form-urlencoded body', () => {
    let request = new Request({
      method: 'get',
      path: '/test',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new Buffer('a=%e6%9d%b1%e4%ba%ac'),
    })

    expect(request.body).to.eql({ a: '東京' })
  })

  it('should construct a request with an application/x-www-form-urlencoded body in utf8', () => {
    let request = new Request({
      method: 'get',
      path: '/test',
      headers: { 'content-type': 'application/x-www-form-urlencoded;charset=utf8' },
      body: new Buffer('a=%e6%9d%b1%e4%ba%ac'),
    })

    expect(request.body).to.eql({ a: '東京' })
  })

  it('should construct a request with an application/x-www-form-urlencoded body in shift-jis', () => {
    let request = new Request({
      method: 'get',
      path: '/test',
      headers: { 'content-type': 'application/x-www-form-urlencoded;charset=shift-jis' },
      body: new Buffer('a=%93%8c%8b%9e', 'ascii'),
    })

    expect(request.body).to.eql({ a: '東京' })
  })

  /* ======================================================================== */

  it('should construct a request with a text/... body', () => {
    let request = new Request({
      method: 'get',
      path: '/test',
      headers: { 'content-type': 'text/something' },
      body: new Buffer('e69db1e4baac', 'hex'),
    })

    expect(request.body).to.eql('東京')
  })

  it('should construct a request with a text/... body in utf8', () => {
    let request = new Request({
      method: 'get',
      path: '/test',
      headers: { 'content-type': 'text/something;charset=utf8' },
      body: new Buffer('e69db1e4baac', 'hex'),
    })

    expect(request.body).to.eql('東京')
  })

  it('should construct a request with a text/... body in shift-jis', () => {
    let request = new Request({
      method: 'get',
      path: '/test',
      headers: { 'content-type': 'text/something;charset=shift-jis' },
      body: new Buffer('938c8b9e', 'hex'),
    })

    expect(request.body).to.eql('東京')
  })

  /* ======================================================================== */

  it('should construct a request with an application/binary body', () => {
    let request = new Request({
      method: 'get',
      path: '/test',
      headers: { 'content-type': 'application/binary' },
      body: new Buffer('e69db1e4baac', 'hex'),
    })

    /* This is an unsupported content type with no charset, return buffer */
    expect(request.body).to.be.instanceOf(Buffer)
    expect(request.body.toString('hex')).to.equal('e69db1e4baac')
  })

  it('should construct a request with an application/binary body in utf8', () => {
    let request = new Request({
      method: 'get',
      path: '/test',
      headers: { 'content-type': 'application/binary;charset=utf8' },
      body: new Buffer('e69db1e4baac', 'hex'),
    })

    expect(request.body).to.eql('東京')
  })

  it('should construct a request with an application/binary body in shift-jis', () => {
    let request = new Request({
      method: 'get',
      path: '/test',
      headers: { 'content-type': 'application/binary;charset=shift-jis' },
      body: new Buffer('938c8b9e', 'hex'),
    })

    expect(request.body).to.eql('東京')
  })
})

