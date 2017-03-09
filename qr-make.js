/// dependencies ///

var async = require('async');
var fs = require('fs');
var gm = require('gm')
var imgSize = require('image-size');
var parse = require('csv-parse');
var qr = require('qr-image');
var randomstring = require('randomstring');
var rimraf = require('rimraf');
var sizeOf = require('image-size');
var text2png = require('text2png');
var waitUntil = require('wait-until');


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
  encodingFilesPairs.sort(function(a,b) {return b[2].length - a[2].length;})
  console.log(encodingFilesPairs[0][1])

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
          if(!err) {console.log('creating temp imgs')}
          else {console.log(err)}
        })
      },

      // write text img to temp path
      function(gmQR,dimensions,pair,qrImgPath,cb) {
        // make image of qr code
        var qrText = text2png(pair[2],{textColor:'black', font: '12px Arial'})
        console.log(qrText)
        // img temp path
        var qrTextPath = './tmp/txt/' + pair[1] + '.' + imgType
        // write img to temp path
        fs.writeFileSync(qrTextPath, qrText)
        // if width of qrText image wider than qr Image, add line break
        if(sizeOf(qrTextPath).width > sizeOf(qrTextPath).width) {
          // make list of words in entry, split into almost equal halfs; combine
          var qrTextList = pair[2].split(" ")
          var lineLength = Math.floor(qrTextList.length / 2)
          var firstLine = lineLength.slice(0,lineLength).join(" ")
          var secondLine = qrTextList.slice(lineLength,
            qrTextList.length + 1).join(" ")
          // recombine
          var qrTextLineBreak = [firstLine,secondLine].join("\n")
          var qrText = text2png(pair[2],{textColor:'black', font: '12px Arial'})
          // write back out to file 
          fs.writeFileSync(qrTextPath, qrText)
        }
        // get text image dimensions to guide its placement
        // TODO: figure how to use these dimensions for todo in next function
        gm(qrText)
        .size(function(err,size) {
          textWidth = size.width;
          cb(null)
        })
      }
    ])
  });



  //composite qr and text image
  //function() {
    //get height and place to put text
  //  var heightQR = dimensions[0]+textWidth
  //  var placeText = dimensions[1]/2
    // TODO: use dimensions from previous functions to set location of img
    //path to final img
  //  var qrPath =  './qrImgs/' + pair[1] + '.' + imgType
    // composite txt and qr. -gravity south places txt at bottom of fin img.
  //  gm()
  //  .composite()
  //  .in("-gravity", "south")
  //  .in(qrTextPath)
  //  .in(qrImgPath)
  //  .write(qrPath, function(err) {
  //    if(!err) {console.log('QR generated!')}
  //    else {console.log(err)}
  //  })
  //}

  setTimeout(function(){

    //get lists of lists with text images and their widths (in pixels)
    var txtImgs = fs.readdirSync('./tmp/txt')
    var txtImgsWidth = [];

    for(i=0;i<txtImgs.length;i++) {
      txtImgsWidth.push([txtImgs[i],sizeOf('./tmp/txt/' + txtImgs[i]).width])
    }

    //sort txtImgsWidth by image width
    txtImgsWidth.sort(function(a,b) {return b[1]- a[1];})

    //make final qrs in one of two ways based on below condition
      //if width of text is larger than width of qr...
        //composite white img width = text width + some edge with text & qr imgs
      //if width of text is less than width of qr
        //composite only qr and text imgs

    for(i=0;i<txtImgsWidth.length;i++) {

      var imgString = txtImgsWidth[i][0];
      var txtWidth = txtImgsWidth[i][1];
      var txtWidthBack = parseInt(txtWidth) + 30;
      var heightBack = parseInt(sizeOf('./tmp/img/' + imgString).height)
      var txtImgPath = './tmp/txt/' + txtImgsWidth[i][0];
      var qrImgPath = './tmp/img/' + txtImgsWidth[i][0];
      var imgWidth = sizeOf('./tmp/img/' + txtImgsWidth[i][0]).width;
      var qrPath =  './qrImgs/' + txtImgsWidth[i][0];

      if(txtWidth <= imgWidth) {
        gm()
        .composite()
        .in("-gravity", "south")
        .in(txtImgPath)
        .in(qrImgPath)
        .write(qrPath, function(err) {
          if(!err) {console.log('QR generated');}
          else {console.log(err);}
        });
      } else {

        //generate path for background image
        var backgroundPath = './tmp/' + imgString.substring(0, imgString.length - 4) + "_back" + '.' + imgType;
        async.waterfall([
          function(cb) {
            //generate backgroun image, width of txtWidth, height of qr code img
            gm(txtWidthBack, heightBack, "#fff")
            .write(backgroundPath, function(err) {
              if(!err) {}
              else {console.log(err);}
            });
            cb(null,backgroundPath)
          },

          function(backgroundPath,cb) {
            //composite txt img, qr code img, and background img; write it to qrPath
            gm()
            .composite()
            .in("-gravity", "south")
            .in(qrImgPath)
            .in(backgroundPath)
            .stream(function(err,stdout,stderr){
              var imageFile = fs.createWriteStream(backgroundPath)
              stdout.pipe(imageFile)
              stdout.on('finish', function(){})
            })
            cb(null)
          },

          function(cb) {
            var qrCodeWidth = (sizeOf(qrImgPath).width)/2
            var qrTextWidthStart = ((txtWidthBack/2.1)-qrCodeWidth).toString()
            var qrTextHeightStart = heightBack.toString()
            gm()
              .in("-page","+" + qrTextWidthStart +  "+0")
              .in(qrImgPath)
              .in("-page", "+0"+"+" + qrTextHeightStart)
              .in(txtImgPath)
              .mosaic()
              .write(qrPath, function(err){
                if(!err) {console.log("QR generated")}
                else {console.log(err)}
              })
          }

        ], function (err, result) {
            console.log(result)
        })

          //gm()
        //    .composite()
          //  .in("-gravity", "north")
          //  .in(qrImgPath)
        //    .in(backgroundPath)
        //    .write(qrPath, function(err) {
        //      if(!err) {console.log("QR generated");}
      //        else {console.log(err);}
      //    });
      }

    }

    fs.writeFileSync('./tmp/note.txt', 'this folder holds temp images for final QR code.');
  },500);
};

exports.QrCoder = QrCoder;



//function(cb) {
  //composite txt img, qr code img, and background img; write it to qrPath
//  gm()
//  .composite()
//  .in("-gravity", "north")
//  .in(qrImgPath)
//  .in(qrPath)
//  .write(qrPath, function(err) {
//    if(!err) {console.log("QR generated");}
//    else {console.log(err);}
//  })
//}
