/*
Customer Module
*/
const db = require('../db');
var crypto = require('crypto'), shasum = crypto.createHash('sha1');
const express = require('express');
var queryBuilder = require('./helpers/queryBuilder');
var generators = require('./helpers/generators');
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
  
  var query_options = [req.body.name,shasum.update(roomHash).digest('hex')];
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

router.post('/NewAccount', (req, res) => {
  
  //  generate a new private key and insert it into 
  //  the db and return it to them 
  var sql = "INSERT INTO public.account(publickey, privatekey, created_at) VALUES ( $1, $2, now()) RETURNING accountid;";
  //  generate a radnom sha1 hash for the room 
  var key = generators.generate512Private();
  var query_options = [generators.getPublicKey(key),"haha nothing here for security"];
  db.query(sql,query_options ,(err, result) => {
    if(err){
      console.log(err);
      res.send(JSON.stringify({
          success: false
      }));
    }else{
      
      console.log(result);
      //  here we can give the new user a nic name and return the private hash
      var nickname_sql = "INSERT INTO public.nickname( accountid, name, color, created_at)VALUES ( $1, $2, $3, now());";
      var nickname_query_options = [result.rows[0].accountid,"User"+result.rows[0].accountid.toString(),"000000"];
      db.query(nickname_sql,nickname_query_options,(err, result) => {
        res.send(JSON.stringify({
          "success": true,
          "privatekey": key //make sure to send back the new hash so they can redirect 
        }));
      });
      
  }});
});


router.post('/JoinChatRoom', (req, res) => {
  var body = req.body;
  //  first lets see if this is the first time weve been too the room and then add us to the chat room 
  sql = "INSERT INTO public.account_chatroom( accountid, chatroomid, date_joined) VALUES ( (Select accountid from account where publickey = $1),(select chatroomid from chatroom where hash = $2) , now());"
  
  //  now we need to return a list of all of the users in the the chat room and 
  //  their current nickname according to the database 
  sql += "";
  sql_options = [generators.getPublicKey(body.userPrivateKey),body.roomHash];
  //  we need to see if there is a user and if so then we can 
  //  get a list of the users in that chat room and up too 
  //  the most 200 recent messages
  db.query(sql,sql_options ,(err, result) => {
    if(err){
      console.log(err);
      res.send(JSON.stringify({
          success: false
      }));
    }else{
      res.send(JSON.stringify({
        "success": true
      }));
    }
  });
  
});
router.post('/GetHistoricalMessages', (req, res) => {
  
  var body = req.body;

  var sql = "Select * from message where created_in = (select chatroomid from chatroom Where hash = $1) ";
  sql += "Limit " + parseInt(body.pageSize).toString() + "  ";
  sql += "Offset " + (body.pageSize *(body.page -1)).toString() + "  ;";
  sql_options = [body.roomHash];
  console.log(sql);
  db.query(sql,sql_options ,(err, result) => {
    if(err){
      console.log(err);
      res.send(JSON.stringify({
          success: false
      }));
    }else{
      res.send(JSON.stringify({
        "success": true,
        "messages" : result.rows
      }));
    }
  });
  
  
});
router.post('/GetChatRoomUsers', (req, res) => {
  
  var body = req.body;

  var sql = "Select * from messages where created_in = (select chatroomid from chatroom Where hash = $1) ";
  sql += "Limit " + parseInt(body.pageSize).toString() + "  ";
  sql += "Offset " + (body.pageSize *(body.page -1)).toString() + "  ;";
  sql_options = [body.roomHash];
  console.log(sql);
  db.query(sql,sql_options ,(err, result) => {
    if(err){
      console.log(err);
      res.send(JSON.stringify({
          success: false
      }));
    }else{
      res.send(JSON.stringify({
        "success": true,
        "messages" : result.rows
      }));
    }
  });
  
  
});



module.exports = router;
