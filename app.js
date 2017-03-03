// code: make-a-qr-code.js
// coder: Max Grossman
// purpose: Make a qr code w/o using the broswer!

// dependencies //
var qr = require('./qr-make.js')
var async = require('async')

// test qr-make modules
QrTest = new qr.QrCoder();


async.waterfall([
  QrTest.makeMultiQr
], function (err, result) {
  console.log(result)
})
