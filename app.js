// code: make-a-qr-code.js
// coder: Max Grossman
// purpose: Make a qr code w/o using the broswer!

// dependencies //
var qr = require('./qr-make.js')

// test qr-make modules
QrTest = new qr.QrCoder();
QrTest.ingestEncoding('this','png', QrCoder.callback);
