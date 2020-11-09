const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose');
//mongoose.Promise = global.Promise;

mongoose.connect("YOUR DB URL HERE", { useNewUrlParser: true, useUnifiedTopology: true });

const User = mongoose.model('User', {username: String});

const Exercise = mongoose.model('Exercise', {
  description: String,
  duration: Number,
  date: Date,
  userId: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
});

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/exercise/new-user', (req, res, next) => {
  //console.log(req.body.username);
  if(req.body.username){
    const user = new User({ username: req.body.username });
    //console.log('here');
    //console.log(user);
    user.save()
    .then((saved) => {
      //console.log('here');
      return res.json({username: saved.username, _id: saved._id});
    })
    .catch((err) => {
      console.log(err);
    });
  }else{
    return res.status(404).send("Username not set");
  }
  
});

app.get('/api/exercise/users', (req, res, next) => {
  
  User.find({}).select("username _id")
  .exec()
  .then((users) => {
    if(users){
      res.json(users);
    }else{
      return res.json({"message":"EMPTY"});
    }
  })
  .catch((err) => {
    console.log(err);
  });
});

app.post('/api/exercise/add', (req, res, next) => {

  const userId = req.body.userId;

  let curUser = null;

  User.findById(userId)
  .then((user) => {
    if(user){

      curUser = user;

      let dateVal = new Date();

      if(req.body.date){
        dateVal = new Date(req.body.date);
      }

      const exercise = new Exercise({
        description: req.body.description,
        duration: req.body.duration,
        date: dateVal,
        userId: userId,
      });

      //return res.json(user);
      return exercise.save();
    }else{
      return res.json({"message":"EMPTY"});
    }
  })
  .then((exercise) => {
    return res.json({ 
        _id: curUser._id, 
        username: curUser.username,
        date: exercise.date.toDateString(),
        duration: exercise.duration,
        description: exercise.description,
    });
  })
  .catch((err) => {
    return res.json(err);
  });
});

app.get('/api/exercise/log', (req, res, next) => {
  let userId = req.query.userId;

  let limit = req.query.limit;

  //console.log([fromLimit, toLimit])

  console.log(req.query);

  if(userId){

    User.findById(userId)
    .then((user) => {

      if(req.query.from && req.query.to){

        let fromLimit = new Date(req.query.from);
        let toLimit = new Date(req.query.to);

        
        //console.log([req.query, fromLimit, toLimit]);
        
        Exercise.find({
          userId: userId,
          date: {
            $gte: fromLimit,
            $lte: toLimit,
          }
        })
        .then((exercises) => {

          /*console.log({
            "_id": user._id,
            "username": user.username,
            "count": exercises.length,
            "log": exercises
          });*/

          /*let exercisesM = exercises.foreach((exercise) => {
            console.log(exercise);
            return {'description': exercise.description, 'duration': exercise.duration, 'date': exercise.date, };
          });*/

          let exercisesM = exercises.map(({description, duration, date}) => {
            
            return {description, duration, 'date':date.toDateString()};
          });


          //console.log(["this", exercisesM]);
          /*console.log({
            "_id": user._id,
            "username": user.username,
            "count": exercises.length,
            "log": exercisesM,
          });*/

          //console.log(req.query);

          return res.json({
            "_id": user._id,
            "username": user.username,
            "count": exercises.length,
            "log": exercisesM,
          });

        
        })
        .catch((err) => {
          return res.json(err);
        });
        


      }else if(limit){

        //console.log(limit);
        //DO ANYONE KEEP THOSE EXERCISES UPDATED AND CONCISE ???
        Exercise.find({userId: userId})
        .limit(parseInt(limit))
        .exec((err, exercises) => {

          if(err){
            throw err;
          }
          console.log(["exercises", exercises]);

          return res.json({
            "_id": user._id,
            "username": user.username,
            "count": exercises.length,
            "log": exercises
          });

        
        });
        /*.catch((err) => {
          return res.json(err);
        });*/



      }else{

        Exercise.find({userId: userId})
        .then((exercises) => {


          return res.json({
            "_id": user._id,
            "username": user.username,
            "count": exercises.length,
            "log": exercises
          });

        
        })
        .catch((err) => {
          return res.json(err);
        });

      }

    })
    .catch((err) => {
      return res.json(err);
    });

  }else{
    return res.json('User ID not set');
  }

  //return res.json(req.query);
});


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
