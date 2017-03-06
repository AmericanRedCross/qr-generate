/// dependencies ///

var async = require('async')
var fs = require('fs');
var gm = require('gm')
var imgSize = require('image-size');
var parse = require('csv-parse');
var qr = require('qr-image');
var randomstring = require('randomstring')
var text2png = require('text2png')

//var Canvas = require('canvas'), Image = Canvas.Image, qrCode = require('jsqrcode')(Canvas)

// qrCoder object. Handles making and writing qr codes
function QrCoder() {};

// qrCoder Methods //

//TODO: for now, I'll hardcode the imgTypes. but once to express, this needs be chosen by user

// makeQr //
// desc: takes csv of qr encodings and fileNames and makes qr code of type imgType //

QrCoder.prototype.makeQR = function(callback) {

  // again, some hardcoding. will change soon
  var encodingCSV = 'qr.csv'
  var imgType = 'png'

  // imgType needs be a string
  if(encodingCSV.substr(-4) !== ".csv") {
    callback( new Error("CSV format file needed to execute this function!") );
    return;
  }

  // list holding encoding/file pairs
  var encodingFilePairs = [];

  // create csv parser. note, headings are ignored
  var csvParser = parse({delimiter:",",from:2}, function(err, csvData){
    // for each csv row, do the following...
    async.eachSeries(csvData, function(line, callback) {
      // get qr code encoding
      encoding = line[0]
      // generate qr code image from encoding
      var qrImg = qr.image(encoding,{type:imgType});
      // if only encoding provided, generate random file name
      // TODO: allow users to provide filenames if not there?
      if( line[1] === '' ) {
        var fileName = randomstring.generate(5)
        var specialText = randomstring.generate(5)
      } else {
        var fileName = line[1]
        var specialText = line[2]
      }
      // grab file name from csv when there
      // push this to encodingFilePairs list
      encodingFilePairs.push([qrImg,fileName,specialText])
      callback();
    });
  });

  // write records with the csvParser!
  fs.createReadStream(encodingCSV).pipe(csvParser)

  setTimeout(function(){
    callback(null,encodingFilePairs,imgType);
  },500);

}

// writeQR //
// desc: write QR codes to file //

QrCoder.prototype.writeQR = function(encodingFilePairs,imgType,callback) {

  // hardcoded for testing
  var filePath = './qrs/'
  // make sure filepath exists
  if(!(fs.existsSync(filePath))) {
    callback( new Error ("file path does not exist"))
  }

  // write qr codes to file
  for(i=0;i<encodingFilePairs.length;i++){
    var qrImg = encodingFilePairs[i][0]
    var qrFile = filePath + encodingFilePairs[i][1] + '.' + imgType
    qrImg.pipe(fs.createWriteStream(qrFile));
  }

  setTimeout(function(){
    callback(null,'file saved!');
  },500);

}

// combineQR //
// desc: combine QR code image with background canvas and text //

QrCoder.prototype.combineQR = function(encodingFilesPairs,callback) {

  if(!(encodingFilesPairs)) {
    callback( new Error ("Missing QR codes!"))
  }

  // order encodingFilesPairs based on length of string
  encodingFilesPairs.sort(function(a,b) {return b[2].length - a[2].length;})



  async.waterfall([
    // render gm image, get width and heigth
    function(cb){
      var gmQR = gm(encodingFilesPairs[0][0])
      gmQR.size(function(err, size) {
        dimensions = [size.height,size.width];
        cb(null,gmQR,dimensions);
      })
    },

    // generate image that:
    //  - is of height gmQR's heigth + height of largest text within 145px width and width gmQR's width
    //  - includes QR code and special text
    function(gmQR,dimensions,cb) {
      // make image of qr code text
      var qrText = text2png(encodingFilesPairs[0][2],{textColor:'black', font: '12px Arial'})
      var qrText = gm(qrText)
    }

  ])

  setTimeout(function(){},500);

};

exports.QrCoder = QrCoder;
