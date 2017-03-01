// code: make-a-qr-code.js
// coder: Max Grossman
// purpose: Make a qr code w/o using the broswer!

// dependencies //
var qr-make = require('./qr-make.js')

// test qr-make modules
QrTest = new qr-make.QrCoder();
QrTest.ingestEncoding('this','png', QrCoder.callback);
