/// dependencies ///

var async = require('async')
var fs = require('fs');
var gm = require('gm')
var imgSize = require('image-size');
var parse = require('csv-parse');
var qr = require('qr-image');
var randomstring = require('randomstring')
var rimraf = require('rimraf')
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
      // when the fileName column is blank, give it a random string
      if( line[1] === '') {
        var fileName = line[0]
        // when the specialText column is blank too, give it a random string
        if( line[2] === '') {
          var specialText = line[0]
        } else {
          // when specialText column isn't blank, set specialText to it
          var specialText = line[2]
        }
      } else {
        // when the fileName column isn't blank, set fileName too it
        var fileName = line[1]
        // when fileName is not blank but specialText is, give it random string
        if( line[2] === '') {
          var specialText = line[0]
        } else {
          // when special text is not blank, set it to its column
          var specialText = line[2]
        }
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

//QrCoder.prototype.writeQR = function(encodingFilePairs,imgType,callback) {

  // hardcoded for testing
  //var filePath = './qrs/'
  // make sure filepath exists
  //if(!(fs.existsSync(filePath))) {
  //  callback( new Error ("file path does not exist"))
  //}

  // write qr codes to file
//  for(i=0;i<encodingFilePairs.length;i++){
//    var qrImg = encodingFilePairs[i][0]
//    var qrFile = filePath + encodingFilePairs[i][1] + '.' + imgType
//    qrImg.pipe(fs.createWriteStream(qrFile));
//  }

//  setTimeout(function(){
//    callback(null,'file saved!');
//  },500);

// }

// combineQR //
// desc: combine QR code image with background canvas and text //

QrCoder.prototype.combineQR = function(encodingFilesPairs,imgType,callback) {

  if(!(encodingFilesPairs)) {
    callback( new Error ("Missing QR codes!"))
  }

  // order encodingFilesPairs based on length of string
  //encodingFilesPairs.sort(function(a,b) {return b[2].length - a[2].length;})

  //temp folder for text images and regular images
  fs.mkdirSync('./tmp')
  fs.mkdirSync('./tmp/txt')
  fs.mkdirSync('./tmp/img')

  //folder to save final images
  fs.mkdirSync('./qrImgs')

  // iterate over encodingFilesPairs, running process to combine images in parallel
  async.forEachLimit(encodingFilesPairs,encodingFilesPairs.length, function(pair,callback) {

    async.waterfall([
      // write gm image to tmp folder, get width and heigth
      function(cb){
        // path to grab qr image from
        var qrImgPath = './tmp/img/' + pair[1] + '.' + imgType
        var gmQR = pair[0];
        // get dimensions, write to temp path
        gm(gmQR).size(function(err, size) {
          dimensions = [size.height,size.width];
          cb(null,gmQR,dimensions,pair,qrImgPath);
        })
        .write(qrImgPath, function(err) {
          if(!err) {console.log('yo')}
          else {console.log(err)}
        })
      },

      // write text img to temp path
      function(gmQR,dimensions,pair,qrImgPath,cb) {
        var qrText = pair[2]
        // make image of qr code
        var qrText = text2png(qrText,{textColor:'black', font: '12px Arial'})
        // img temp path
        var qrTextPath = './tmp/txt/' + pair[1] + '.' + imgType
        // write img to temp path
        fs.writeFileSync('./tmp/txt/' + pair[1] + '.' + imgType, qrText)
        // get text image dimensions to guide its placement
        // TODO: figure how to use these dimensions for todo in next function
        gm(qrText)
        .size(function(err,size) {
          textWidth = size.width;
          cb(null,textWidth,gmQR,dimensions,qrText,qrTextPath,qrImgPath, pair)
        })
      },

      //composite qr and text image
      function(textWidth,gmQR,dimensions,qrText,qrTextPath,qrImgPath, pair) {
        // get height and place to put text
        //var heightQR = dimensions[0]+textWidth
        //var placeText = dimensions[1]/2
        // TODO: use dimensions from previous functions to set location of img
        // path to final img
        var qrPath =  './qrImgs/' + pair[1] + '.' + imgType
        // composite txt and qr. -gravity south places txt at bottom of fin img.
        gm()
        .composite()
        .in("-gravity", "south")
        .in(qrTextPath)
        .in(qrImgPath)
        .write(qrPath, function(err) {
          if(!err) {console.log('yo')}
          else {console.log(err)}
        })
      }
    ])
  });

  setTimeout(function(){
    fs.writeFileSync('./tmp/note.txt', 'this folder holds temp images for final QR code.');
  },500);
};

exports.QrCoder = QrCoder;
