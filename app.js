const express = require("express");
const app = express()
const mongoose = require('mongoose');
const multer  = require('multer');
const path = require("path")
const methodOverride = require("method-override")
const fs = require("fs")
const port = process.env.PORT || 3000

mongoose.connect('mongodb://localhost:27017/images');

const imgSchema = new mongoose.Schema({
    imgUrl : String
});

const Picture = mongoose.model("Picture", imgSchema)

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(methodOverride('_method'))

app.get('/upload', (req, res) => {
  res.render('upload')
})

app.get("/", (req, res) => {
  Picture.find({})
    .then(images => {
      res.render("index", {images})
    })
})

// storage
const storage = multer.diskStorage({
  destination: './public/uploads/images/',
  filename: (req, file, cb) => {
          cb(null, file.originalname)
  }
  // destination: (req, file, cb) => {
  //   cb(null, './public/uploads/images')
  // },
  // filename: function (req, file, cb) {
  //   cb(null, file.originalname)
  // }
})

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb)
  }
})

function checkFileType(file, cb) {
  const fileType =/jpeg|jpg|png|gif/;
  const extName = fileType.test(path.extname(file.originalname).toLowerCase());

  if(extName) {
    cb(null, true);
  } else {
    cb(new Error("Images only"))
  }
}

app.post("/uploadSingle", upload.single("singleImage"), (req, res, next) => {
  const file = req.file;
  if(!file)  return console.log("Please select file");

  const url = file.path.replace("public", "");

  Picture.findOne({imgUrl : url})
    .then(img => {
      if(img) {
        console.log("Duplicate image");
        return res.redirect("/upload")
      }
      Picture.create({imgUrl : url})
        .then(() => {
          console.log("image sent to DB");
          res.redirect("/")
        })
    })
    .catch(err => console.log(err))
})

app.post("/uploadmultiple", upload.array('multipleImages', 12), (req, res, next) => {
  const files = req.files;
  if(!files) return console.log("Please select images");

  files.forEach(file => {
    const url = file.path.replace("public", "");
    Picture.findOne({imgUrl : url})
    .then(async img => {
      if(img) {
        return console.log("Duplicate image");
      }
      await Picture.create({imgUrl : url})
    })
    .catch(err => console.log(err))
  });
  res.redirect("/")
})

app.delete("/delete/:id", (req, res) => {
  const searchQuery = {_id: req.params.id};

  Picture.findOne(searchQuery)
    .then(img => {
      fs.unlink(`${__dirname}/public/${img.imgUrl}`, err => {
        if(err) return console.log(err);
        Picture.deleteOne(searchQuery)
          .then(() => {
            res.redirect("/")
          })
      });
    })
    .catch(err => console.log(err))
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})