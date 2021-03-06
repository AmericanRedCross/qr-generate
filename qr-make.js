// dependencies //

var async = require('async')
var fs = require('fs')
var gm = require('gm')
// var imgSize = require('image-size')
var parse = require('csv-parse')
var qr = require('qr-image')
// var randomstring = require('randomstring')
// var rimraf = require('rimraf')
var sizeOf = require('image-size')
var text2png = require('text2png')
// var waitUntil = require('wait-until')

// var Canvas = require('canvas'), Image = Canvas.Image, qrCode = require('jsqrcode')(Canvas)

// qrCoder object. Handles making and writing qr codes
function QrCoder () {};

// qrCoder Methods //

// TODO: for now, I'll hardcode the imgTypes. but once to express, this needs be chosen by user

// makeQr //
// desc: takes csv of qr encodings and fileNames and makes qr code of type imgType //

QrCoder.prototype.makeQR = function (callback) {
  // again, some hardcoding. will change soon
  var encodingCSV = 'qr.csv'
  var imgType = 'png'

  // imgType needs be a string
  if (encodingCSV.substr(-4) !== '.csv') {
    callback(new Error('CSV format file needed to execute this function!'))
    return
  }

  // list holding encoding/file pairs
  var encodingFilePairs = []

  // create csv parser. note, headings are ignored
  var csvParser = parse({ delimiter: ',', from:2}, function(err, csvData) {
    // for each csv row, do the following...
    async.eachSeries(csvData, function (line, callback) {
      // get qr code encoding
      encoding = line[0]
      // generate qr code image from encoding
      var qrImg = qr.image(encoding, {type: imgType })
      // if only encoding provided, generate random file name
      // TODO: allow users to provide filenames if not there?
      // when the fileName column is blank, give it same as encoding
      if(line[1] === '') {
        var fileName = line[0]
        // when the specialText column is blank too, give the encoding
        if(line[2] === '') {
          var specialText = line[0]
        } else {
          // when specialText column isn't blank, set specialText to it
          var specialText = line[2]
        }
      } else {
        // when the fileName column isn't blank, set fileName too it
        var fileName = line[1]
        // when fileName is not blank but specialText is, give it encoding
        if(line[2] === '') {
          var specialText = line[0]
        } else {
          // when special text is not blank, set it to its column
          var specialText = line[2]
        }
      }
      // push qrImg, fileName, and specialText to encoding
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

// combineQR //
// desc: combine QR code image with background canvas and text //

QrCoder.prototype.combineQR = function(encodingFilesPairs,imgType,callback) {

  // make sure qr codes were provided
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
        // get img dimensions, write img to temp path
        gm(gmQR).size(function(err, size) {
          dimensions = [size.height,size.width];
          cb(null,gmQR,dimensions,pair,qrImgPath);
        }).write(qrImgPath, function(err) {
          if(!err) {console.log('creating temp img')}
          else {console.log(err)}
        })
      },
      // write text img to temp path
      function(gmQR,dimensions,pair,qrImgPath,cb) {
        // make qr code text an image
        var qrText = text2png(pair[2],{textColor:'black', font: '12px Arial'})
        // img temp path
        var qrTextPath = './tmp/txt/' + pair[1] + '.' + imgType
        // write img to temp path
        fs.writeFileSync(qrTextPath, qrText)
        // if width of qrText image wider than qr Image, add line break
        if(sizeOf(qrTextPath).width > sizeOf(qrImgPath).width) {
          console.log('Text is larger than img!!!')
          // make list of words in entry, split into almost equal halves
          // try to split into halves on space first.
          var qrTextList = pair[2].split(" ")
          // when no splace in text, split into halves on amost middle text.
          if(qrTextList.length === 1) {
            console.log(qrTextList[0].length)
            firstLine =  qrTextList[0].substr(
              0,
              Math.floor(qrTextList[0].length / 2)
            ) + "-"
            secondLine = qrTextList[0].substr(
              Math.floor(qrTextList[0].length / 2)+1,
              qrTextList[0].length
            )
            var qrTextLineBreak = [firstLine,secondLine].join("\n")

          } else {
            var lineLength = Math.floor(qrTextList.length / 2)
            var firstLine = qrTextList.slice(0,lineLength).join(" ")
            var secondLine = qrTextList.slice(
              lineLength,qrTextList.length + 1).join(" ")
            // recombine
            var qrTextLineBreak = [firstLine,secondLine].join("\n")
          }
          // make img of text with line break
          var qrText = text2png(qrTextLineBreak,{textColor:'black', font: '12px Arial'})
          // write back out to file
          fs.writeFileSync(qrTextPath, qrText)
        }
        cb(null)
      }
    ])
  });

  // once final image components are generated above, combine them for final QR
  setTimeout(function(){

    // get lists of lists with text images and their widths (in pixels)
    var txtImgs = fs.readdirSync('./tmp/txt')
    // make temp dir to save intermediate qrs for those with only 1 line of text
    fs.mkdirSync('./tmp/qrs')

    // list to hold each img's text image, and if with 2 lines, a period
    // to indicate it needs be combined accordingly

    var txtImgsWidth = [];

    // if text image hieght greater than 12, thus having 2 lines, give '.'
    // else, do nothing
    for(i=0;i<txtImgs.length;i++) {
      console.log(sizeOf('./tmp/txt/' + txtImgs[i]).height)
      if(sizeOf('./tmp/txt/' + txtImgs[i]).height > 12) {
        txtImgsWidth.push([txtImgs[i],"."])
      } else {
        txtImgsWidth.push([txtImgs[i]])
      }
    }

    async.waterfall([
      // greate backdrop img
      function(cb) {
        gm(250,250,"#fff")
        .write("./tmp/baseImg.png", function(err) {
          if(!err){console.log("background drawn")}
          else {console.log(err)}
        })
        cb()
      },

      function(cb){
        async.forEachLimit(txtImgsWidth,txtImgsWidth.length, function(pair,callback) {
          // image text path
          var qrTextPath = './tmp/txt/' + pair[0];
          // qr image path
          var qrImgPath = './tmp/img/' + pair[0];
          // qrTmp image path
          var qrTmp = './tmp/qrs/'+pair[0]
          console.log(qrTmp)
          // path to final image
          var qrPath =  './qrImgs/' + pair[0];
          // path to base img
          var baseImg = './tmp/baseImg.png'
          // starting place for qrImg being drawn
          var xStart = (250-parseInt(sizeOf(
            './tmp/img/' + pair[0]).width))/2
          var yStart = (250-parseInt(sizeOf(
            './tmp/img/' + pair[0]).height))/2
          var yStartQR = parseInt(sizeOf(
            './tmp/img/' + pair[0]).height) + 20

          if(pair[1]) {
              gm()
              .in("-page", "+0+0")
              .in(baseImg)
              .in("-page","+" + xStart + "+" + yStart)
              .in(qrImgPath)
              .in("-page","+" + (xStart*2) + "+" + yStartQR)
              .in(qrTextPath)
              .mosaic()
              .write(qrPath, function(err){
                if(!err) {console.log("QR generated")}
                else {console.log(err)}
              })

          } else {
            console.log('there')
            async.series([
              function(cb) {
                gm()
                .composite()
                .in("-gravity", "south")
                .in(qrTextPath)
                .in(qrImgPath)
                .write(qrTmp, function(err) {
                if(!err) {
                  console.log('QR generated')
                  cb()
                ;}
                  else {console.log(err);}
                });
              },
              function(cb) {
                gm(qrTmp)
                .gravity("Center")
                .extent(250, 250)
                .write(qrPath, function(err) {
                if(!err) {console.log('QR generated');}
                  else {console.log(err);}
                });
              }])
          }
        })
        }
      ])
    // make final qrs in one of two ways based on below condition:
      // if width of text is less than width of qr
        // composite only qr and text imgs
      // if width of text is larger than width of qr...
        // composite white img width = text width + some edge with text & qr imgs

    fs.writeFileSync('./tmp/note.txt', 'this folder holds temp images for final QR code.');
  },500);
};

exports.QrCoder = QrCoder;
