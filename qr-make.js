// dependencies //

var fs = require('fs');
var qr = require('qr-image');
//var Canvas = require('canvas') , Image = Canvas.Image, qrCode = require('jsqrcode')(Canvas)

// qrCoder object. Handles making and writing qr codes
function QrCoder() {};

// qrCoder Methods //

// ingestEncoding //
// desc: takes encoding and makes a qr code of type imgType //

//TODO: for now, I'll hardcode the imgTypes. but once to express, this needs be chosen by user

QrCoder.prototype.ingestEncoding = function(callback) {

  var encoding = 'hingadingadergin'
  imgType = 'png'

  // imgType needs be a string
  if(typeof imgType !== "string") {
    callback( new Error("imgType must only be a string") );
    return;
  }

  // imgType also need be one of the following
  if(!(["png","svg","eps","pdf"].indexOf(imgType)>=0)) {
    callback( new Error("imgType must only be of the following formats:" + "\n" + "png, svg, eps, or pdf") );
    return;
  }

  // coerce non string enconding to string
  encoding = encoding.toString()

  // make qr code
  var qrImg = qr.image(encoding,{type:imgType});

  setTimeout(function(){
    callback(null,qrImg);
  },500);

};

// writeQRcode //
// desc: write QR code to file //
QrCoder.prototype.writeQRcode = function(qrImg,callback) {

  console.log(qrImg)

  // check to make sure filepath exists. I recognize the crudeness here, just working
  // to get it working, and will have a dialogue/all that jazz when this moves to
  // building the app...


  // hardcoded for testing
  var filePath = './qrs/'
  var fileName = 'test.png'

  if(!(fs.existsSync(filePath))) {
    callback( new Error ("file path does not exist"))
  }

  // file to write
  var qrFile = filePath + fileName

  // write qr to file
  //fs.writeFileSync(qrFile,qrImg)
  qrImg.pipe(fs.createWriteStream(qrFile));


  setTimeout(function(){
    callback(null,'file saved!');
  },500);

}

exports.QrCoder = QrCoder;
