const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function middleware(req, res, next){
  var string = req.method + " " + req.path + " - " + req.ip;
  console.log(string);
  next();
});

var list_size;
let exercise_list;
var obj_exercise_log = [];

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});



mongoose.connect(process.env.URI, { useNewUrlParser: true, useUnifiedTopology: true });

const users = new mongoose.Schema(
  {
  username: {
    type: String,
    required: true,
  },
  count: Number,
  log: [{
    description: {
      type: String
    },
    duration: {
    type: Number
    },
    date: {
      type: String
    }
  }]

});

let user_db = new mongoose.model('User', users);

app.post("/api/users/", function(req, res, next){
  console.log("in post /api/users");
  
  let user_name = req.body.username;
  console.log(user_name);

  user_db.create({username:user_name}, function(err, data){
    if(err){
      console.log(err);
    }
    else{
      res.json(data);
    }
  })
});

app.get("/api/users", function(req,res){
  user_db.find()                   // find all users
         .skip()                // skip the first 100 items
         .limit()                // limit to 10 items
         .sort({username: 1})      // sort ascending by firstName
         .select({username: true}) // select firstName only
         .exec()                   // execute the query
         .then(docs => {
            console.log("the result",docs);
           console.log("size of results",docs.length);
          list_size = docs;
           index_url = docs.length +1;
           
          return list_size
          })
         .catch(err => {
            console.error(err)
          });

  res.json(list_size);
 
});

app.use("/api/users/:_id/exercises", function(req, res){
  console.log("root of /api/users/:_id/exercises, req.body POST: ",req.body);
  console.log("root of /api/users/:_id/exercises, _id: ",req.params._id);
  console.log("root of /api/users/:_id/exercises, description: ",req.body.description);
  console.log("root of /api/users/:_id/exercises, duration: ",req.body.duration);
  console.log("root of /api/users/:_id/exercises, given date: ",req.body.date);
  let log_description = req.body.description;
  let log_duration = req.body.duration;
  let log_date = req.body.date;
  
  user_db.findById(req.params._id).exec(function(err,byid){
    if(err){
      console.log(err);
    }
    else {
      console.log("found",byid);
      
      let log_obj = {};
      let count_numb = byid.log.length;
      let count_numb_new = count_numb+1;
      console.log("count of log number: ", count_numb);
     if (log_date){ 
       let date_given = new Date(log_date).toDateString();
       log_obj={description:log_description,duration:parseInt(log_duration),date:date_given};
       console.log("object exercise with date: ", log_obj);
                          }
      else{
        
        let date_now = new Date().toDateString();
        log_obj={description:log_description,duration:parseInt(log_duration),date:date_now};
        console.log("object exercise without date: ", log_obj);
      }
     
      byid.log.push(log_obj);
      byid.count = count_numb_new;
      
      console.log("new object: ", byid,"type of object: ",typeof byid);
      
      let new_model = new user_db(byid);
      byid.save(function (err,personUpdated){
    if(err){ 
      console.log("there was a error");
      return console.error(err);
    }
    else {
      console.log("saved exercise");
      
 res.json({username:personUpdated.username,description:log_obj.description,duration:parseInt(log_obj.duration),date:log_obj.date,_id:personUpdated._id});
 //working     res.json(personUpdated);
     
    }
      }
    );
      
    };

    });
});

app.use("/api/users/:_id/logs", function(req, res, next){
  console.log("root of /api/users/:_id/logs, req.params._id", req.params._id);
  let params_id = req.params._id;
  let query_from = req.query.from;
  let query_to = req.query.to;
  let query_limit = req.query.limit;
  
if(req.query.from || req.query.to || req.query.limit){
    console.log("in route /api/users/:_id/exercises, req.query.from",req.query.from);
  console.log("in route /api/users/:_id/exercises, req.query.to",req.query.to);
    console.log("in route /api/users/:_id/exercises, req.query.limit",req.query.limit);

  user_db.findById(params_id,function(err, userFound){
    if(err){
      console.log(err);
    }
    else {

console.log("length of object from query (length of id.log): ", userFound.log.length);
var var_date_from = Date.parse(req.query.from);
      console.log("date from converted to unix", var_date_from);
var var_date_to = Date.parse(req.query.to);
      console.log("date to converted to unix", var_date_to);
var w = 0;
var z = 0;
var size_log_length = userFound.log.length;
      console.log("size of userFound.log list",size_log_length);
      if(size_log_length > query_limit){
        console.log("size of userFound.log is greater than query_limit");
        console.log("query limit is:",query_limit);
        size_log_length = query_limit;
        console.log("new size_log_length (limit of userFound.list to acquire) is:", size_log_length);
      }
    for (var b of userFound.log){


      
    console.log("in for loop, value of w is",w);
      console.log("value of b of this iteration: ",b);
     
      var date_unix = Date.parse(b.date);
        console.log("iteration number: ",w);
        console.log("date_unix of iteration: ", date_unix);


      if(query_from && query_to){
        console.log("in if when from & to & limit are true");
      if (Date.parse(b.date) >= var_date_from && Date.parse(b.date) <= var_date_to){
        obj_exercise_log[z] = {description:b.description, duration:b.duration , date:b.date};
        z = z+1;
  // working      obj_exercise_log.push(b);
      }
       if (obj_exercise_log.length == size_log_length){
        break;
      }
      w = w+1;
      }
      
    if(query_from == undefined && query_to == undefined && query_limit){
      console.log("in if when only limit is true");
      if (w < size_log_length){
        obj_exercise_log[z] = {description:b.description, duration:b.duration , date:b.date};
        z = z+1;
  // working      obj_exercise_log.push(b);
      }
       if (w+1 == size_log_length){
        break;
      }
      w = w+1;
    }


      
      
      
  }
var obj_exercise = {};
    if (obj_exercise_log.length > 0){
      console.log("obj_exercise not empty, value is",obj_exercise_log);
    obj_exercise = {username: userFound.username,count:userFound.count,_id:userFound._id,log:  obj_exercise_log};
    
      res.json(obj_exercise);
      obj_exercise_log = [];
    }
      else{
        res.json({username: userFound.username,count:userFound.count,_id:userFound._id,log:  []});
        obj_exercise_log = [];
      }


      
  
}
});
}
else{

  
  user_db.findById(params_id,function(err, userFound){
    if(err){
      console.log(err);
    }
    else {
      console.log("user found", userFound);
      i = 0;
      var userFound_log = [];
      for(let dates of userFound.log){
        let date_to_string = new Date(dates.date).toDateString();
        console.log("type of date string", typeof date_to_string);
        userFound_log[i] = {description: dates.description,duration:dates.duration, date:date_to_string};
        console.log("new object cp_userFound",userFound_log);
        i = i+1;
      }
// working      res.json(userFound);
      
      res.json({username: userFound.username, count: userFound.count, _id: userFound._id,log: userFound_log});
      console.log("log of exercise for id was sent as json obj");
    }
  });
}

});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
