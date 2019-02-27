/*
Customer Module
*/
const db = require('../db');
var crypto = require('crypto'), shasum = crypto.createHash('sha1');
const express = require('express');
var queryBuilder = require('./helpers/queryBuilder');
var router = express.Router();

/*

*/
router.get('/', (req, res) => {
  //dont have to do nothing lol

  res.render('chat.html');
});
router.post('/GetChatRooms',(req,res)=> {
  console.log(req.body);
  var query = req.body;

  //  need to add sorts up here since can do sql injections if not
  //  to stop sql injections we need to check the feilds
  var sortFeild = null;
  var validSortFeilds = ["name","hash"];
  if(req.body.sortField != null){
    console.log(req.body.sortField);
     for(var i=0;i<validSortFeilds.length;i++){ //  loop to see if valid sort
       console.log(validSortFeilds[i]);
       if(req.body.sortField == validSortFeilds[i]){
         sortFeild = validSortFeilds[i];
         break;
       }
     }
  }
  //  query builder is code i made to interact with grid js for sorting and filtering 
 var queryOptions = queryBuilder.jsGridQueryBuilder("chatroom", query, sortFeild);

  //  run the query here since it should be good
  db.query(queryOptions[0],queryOptions[1] ,(err, result) => {

    if (err) {
      console.log(err.stack);
      res.send(JSON.stringify({
          d: false
      }));
    } else {
      var numberOfItems = 0;
      if(result.rows[0]){
        numberOfItems = result.rows[0].itemsnumber
      }
      res.send(JSON.stringify({
          data: result.rows,
          itemsCount: numberOfItems
      }));
    }
  });
});

router.post('/NewChatRoom', (req, res) => {
  //here we can make a new char room
  var sql = "INSERT INTO public.chatroom(created_by, name, hash, created_at) VALUES ( 1, $1, $2, now()) RETURNING hash;";
  //  generate a radnom sha1 hash for the room 
  var roomHash = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 32; i++)
    roomHash += possible.charAt(Math.floor(Math.random() * possible.length));
  
  var query_options = [req.body.name,shasum.update(roomHash)];
  db.query(sql,query_options ,(err, result) => {
    if(err){
      console.log(err);
      res.send(JSON.stringify({
          success: false
      }));
    }else{
      console.log(result);
      res.send(JSON.stringify({
        success: true,
        hash: result.rows[0].hash //make sure to send back the new hash so they can redirect 
    }));
  }});
});



module.exports = router;
