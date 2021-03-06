'use strict'
const filetypes = require('./signatures.js')
const Transform = require('stream').Transform

const identify = exports.identify = function (buf) {
  for (let ft of filetypes) {
    signatures: for (let sig of ft.signatures) {
      for (let ii = 0; ii < sig.length; ii += 2) {
        const offset = sig[ii]
        const byteSeq = sig[ii+1]
        if (!byteSeq.equals(buf.slice(offset, offset + byteSeq.length))) {
          continue signatures
        }
      }
      return {
        mimeType: ft.mimeType || 'application/octet-stream',
        description: ft.description || '',
        extensions: ft.extensions || []
      }
    }
  }
  return {
    unknown: true,
    mimeType: 'application/octet-stream',
    description: 'Unknown',
    extensions: []
  }
}

exports.identifyStream = function (cb) {
  let finished = false
  let buf = []
  let bufSize = 0
  return new Transform({
    transform (chunk, _, done) {
      if (!finished) {
        buf.push(chunk)
        bufSize += chunk.length
        if (bufSize >= 35) {
          const type = identify(Buffer.concat(buf, bufSize))
          if (!type.unknown || bufSize >= 36870) {
            buf.length = 0
            bufSize = 0
            finished = true
            cb(type)
          }
        }
      }
      this.push(chunk)
      done()
    },
    flush (done) {
      if (!finished) cb(identify(Buffer.concat(buf, bufSize)))
      done()
    }
  })
}
