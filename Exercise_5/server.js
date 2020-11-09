'use strict';

var express = require('express');
var cors = require('cors');

// require and use "multer"...

const bodyparser = require('body-parser');

const multer = require('multer');

let upload = multer({dest: './uploads/'});

var app = express();

app.use(bodyparser.urlencoded({extended: true}));

app.use(cors());
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function (req, res) {
     res.sendFile(process.cwd() + '/views/index.html');
  });

app.get('/hello', function(req, res){
  res.json({greetings: "Hello, API"});
});

app.post('/api/fileanalyse', upload.single('upfile') , (req, res, next) => {
  return res.json({name: req.file.originalname, type: req.file.mimetype, size: req.file.size});
});

app.listen(process.env.PORT || 3000, function () {
  console.log('Node.js listening ...');
});
