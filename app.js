// code: make-a-qr-code.js
// coder: Max Grossman
// purpose: Make a qr code w/o using the broswer!

// dependencies //
var QrMaker = require('./QrMaker.js')

QrTest = new QrMaker.QrCoder();
QrTest.ingestEncoding('this','png', QrCoder.callback);
