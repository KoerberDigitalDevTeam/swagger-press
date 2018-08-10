'use strict'

require('dotenv').config()

const http = require('http')
const errorlog = require('errorlog')

const log = errorlog()

const server = http.createServer((req, res, next) => {
  console.log('METHOD', req.method)
  console.log('URL', req.url)
  console.log('HEADERS', req.headers)
  console.log('NEXT', next)

  res.setHeader('Set-Cookie', [ 'type=ninja', 'language=javascript' ])

  // let oldSetHeader = res.setHeader;
  // res.setHeader = function setHeader(name, value) {
  //   console.log('SETTING', name, value)
  // }

  // console.log('RESPONSE', res.getHeaderNames())

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end('{}')
})

module.exports = new Promise((resolve, reject) => {
  /* Server initialisation parameters */
  let host = process.env.HOST || '127.0.0.1'
  let port = parseInt(process.env.PORT) || 0

  /* Start listening on our host:port */
  server.listen(port, host, (error) => {
    if (error) return reject(error)

    let address = server.address()
    let host = address.address
    let port = address.port

    console.log(`Server listening at http://${host}:${port}/`)

    resolve({
      url: `http://${host}:${port}`,
      close: function close() {
        log.info(`Closing server at http://${host}:${port}/`)
        return new Promise((resolve, reject) => {
          server.close((error) => {
            if (error) return reject(error)
            resolve()
          })
        })
      },
    })
  })
})
