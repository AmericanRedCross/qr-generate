// code: make-a-qr-code.js
// coder: Max Grossman
// purpose: Make a qr code w/o using the broswer!

// dependencies //

var async = require('async')
var qr = require('./qr-make.js')

// test qr-make modules
QrTest = new qr.QrCoder();


async.waterfall([
  QrTest.makeQr
], function (err, result) {
  console.log(result)
})
