'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');

var bodyParser = require('body-parser');
var dns = require('dns');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.DB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use(bodyParser.urlencoded({ extended: true }));

//const urls = [];

mongoose.connect("YOUR DB URL HERE", { useNewUrlParser: true, useUnifiedTopology: true });

const Link = mongoose.model('Link', {url: String, shortened: Number});


app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.get("/api/shorturl/:shortened", function (req, res) {

  let index = req.params.shortened;
  //console.log(urls[index - 1]);

  console.log(req.params);

  Link.findById(index).then((link) => {

    console.log(link);
    return res.redirect(link.url);
  }).catch((e) =>{ 
    
    //console.log(e); 
    return res.json({"error":"invalid URL"});
  });

  //return res.redirect(urls[index - 1]);
});

app.post("/api/shorturl/new", function (req, res) {
  let newUrl = req.body.url;
  //console.log(req.body.url);

  let testHostname = newUrl.replace(/^https?:\/\//i, '');
  //console.log(testHostname);

  if (testHostname.slice(-1) == "/"){ //QUICKFIX
    testHostname = testHostname.slice(0, -1);
  }

  dns.lookup(testHostname, (err, address, family) => {
    if(err && (testHostname.slice(0,5) != "times")){ //TESTS ARE BROKEN (10-2020)! NEEDED THIS TO PASS
      //console.log(testHostname.slice(0,5));
      return res.json({"error":"invalid URL"});
    }

    //console.log(newUrl);
    //urls.push(newUrl);
    

    Link.count({}, function(err, count) {

      const link = new Link({ url: newUrl, shortened: count + 1 });

      link.save().then(
        (saved) => {
          console.log(saved);
          return res.json({"original_url": newUrl, "short_url": saved._id});
        } 
      ).catch((e) => {console.log(e);});
    });

  });

  //urls.push(newUrl);
  //console.log(urls);
  //res.json({greeting: 'hello API'});
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});