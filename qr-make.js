/// dependencies ///

var async = require('async')
var fs = require('fs');
var parse = require('csv-parse');
var qr = require('qr-image');
var randomstring = require('randomstring')

//var Canvas = require('canvas'), Image = Canvas.Image, qrCode = require('jsqrcode')(Canvas)

// qrCoder object. Handles making and writing qr codes
function QrCoder() {};

// qrCoder Methods //

// makeSingleQr //
// desc: takes singe encoding and fileName and makes a qr code of type imgType //

//TODO: for now, I'll hardcode the imgTypes. but once to express, this needs be chosen by user

// makeQr //
// desc: takes csv of qr encodings and fileNames and makes qr code of type imgType //

QrCoder.prototype.makeQr = function(callback) {

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
      } else {
        var fileName = line[1]
      }
      // grab file name from csv when there
      // push this to encodingFilePairs list
      encodingFilePairs.push([qrImg,fileName])
      callback();
    });
  });

  // write records with the csvParser!
  fs.createReadStream(encodingCSV).pipe(csvParser)

  setTimeout(function(){
    callback(null,encodingFilePairs,imgType);
  },500);

}

// writeQRcode //
// desc: write QR codes to file //

QrCoder.prototype.writeQR = function(encodingFilePairs,imgType,callback) {

  // hardcoded for testing
  var filePath = './qrs/'
  console.log(encodingFilePairs)
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

exports.QrCoder = QrCoder;
