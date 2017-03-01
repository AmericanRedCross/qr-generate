// dependencies //
//var fs = require('fs');
var qr = require('qr-image');
//var Canvas = require('canvas') , Image = Canvas.Image, qrCode = require('jsqrcode')(Canvas)

// qrCoder object. Handles making and writing qr codes
function QrCoder() {};

// qrCoder Methods //

// ingestEncoding //
// desc: takes encoding and makes a qr code of type imgType //

//TODO: for now, I'll hardcode the imgTypes. but once to express, this needs be chosen by user

QrCoder.prototype.ingestEncoding = function(encoding,imgType,callback) {

  //imgType needs be a string
  if(typeof imgType !== "string") {
    callback( new Error("imgType must only be a string") );
    return;
  }

  //imgType also need be one of the following
  if(!(["png","svg","eps","pdf"].indexOf(imgType)>=0)) {
    callback( new Error("imgType must only be of the following formats:" + "\n" + "png, svg, eps, or pdf") );
    return;
  }

  //coerce non string enconding to string
  encoding = encoding.toString()

  // make qr code
  var qrImg = qr.image(encoding,{type:imgType});

  setTimeout(function(){
    callback(null,qrImg);
  },500);

};

function callback(err,qrImg) {
    if(err) {
      console.log(err);
      return;
    }
    console.log(qrImg);
}


//qrImg.pipe(fs.createWriteStream('i_love_qr.png'));

exports.QrCoder = QrCoder;
exports.callback = callback;
