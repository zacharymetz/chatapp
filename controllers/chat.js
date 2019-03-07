/*
Customer Module
*/
const db = require('../db');
var crypto = require('crypto'), shasum = crypto.createHash('sha1');
const express = require('express');
var queryBuilder = require('./helpers/queryBuilder');
var generators = require('./helpers/generators');
var googleStorage = require('./helpers/gcupload');
var router = express.Router();
var multer  = require('multer');
var upload = multer()

/*

*/
router.get('/', (req, res) => {
  //dont have to do nothing lol

  res.render('chat.html');
});
router.post('/GetChatRooms',(req,res)=> {
  
  var query = req.body;

  //  need to add sorts up here since can do sql injections if not
  //  to stop sql injections we need to check the feilds
  var sortFeild = null;
  var validSortFeilds = ["name","hash"];
  if(req.body.sortField != null){
     for(var i=0;i<validSortFeilds.length;i++){ //  loop to see if valid sort
       
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

router.post('/GetHistoricalMessages', (req, res) => {
  
  var body = req.body;

  var sql = "Select message.messageid, message.message, account.publickey, message.created_at from message inner join account on message.created_by = account.accountid where created_in = (select chatroomid from chatroom Where hash = $1) ";
  sql += "Limit " + parseInt(body.pageSize).toString() + "  ";
  sql += "Offset " + (body.pageSize *(body.page -1)).toString() + "  ;";
  sql_options = [body.roomHash];
  
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

  var sql = "Select  publickey ,name,color ,GREATEST (ni.nicknameid)from account inner join nickname as ni on ni.accountid = account.accountid where ni.accountid in (Select account.accountid from account_chatroom  Inner Join account ON account_chatroom.accountid = account.accountid GROUP BY account.accountid, chatroomid Having account_chatroom.chatroomid = (select chatroomid from chatroom where hash = $1)) and ni.nicknameid = (select nicknameid from nickname where accountid = ni.accountid order by created_at desc limit 1);";
  sql_options = [body.roomHash];
  db.query(sql,sql_options ,(err, result) => {
    if(err){
      console.log(err);
      res.send(JSON.stringify({
          success: false
      }));
    }else{
      res.send(JSON.stringify({
        "success": true,
        "accounts" : result.rows
      }));
    }
  });
  
  
});
router.post('/GetPastUserNames', (req, res) => {
  
  var body = req.body;
  var sql = "Select  name,color from  nickname where accountid =  (Select accountid from account where publickey = $1) order by created_at desc;";
  sql_options = [body.accountPublicKey];
  db.query(sql,sql_options ,(err, result) => {
    if(err){
      console.log(err);
      res.send(JSON.stringify({
          success: false
      }));
    }else{
      res.send(JSON.stringify({
        "success": true,
        "userNames" : result.rows
      }));
    }
  });
});

router.post('/postcontent/:roomHash',upload.any(), (req, res) => {
  //  run a query to see 
  //    if the file type is valid 
  //    if the filesize is wihin the contriaint 
  //    and if the user and room are real 
  for(var i=0;i<req.files.length;i++){

  
    var sql = "SELECT"; 
    /*See if the user exists*/
    sql += " exists(select accountid from account where publickey = $1) ";
    /* See if the room exists */
    sql += "and exists(select chatroomid from chatroom where hash = $2) ";
    /* see if the mimetype is accepted and that the file size is under */
    
    
    /* get the mimefiletype and its newest max file size  */
    sql += "and exists(select * from mimefiletype inner join mimetype on mimefiletype.mimetypeid = mimetype.mimetypeid  ";
    sql += "where mimetype.mimetype = $3 and $4 <= (select sizeinbytes from maxfilesize where maxfilesize.maxfilesizeid = mimefiletype.maxfilesizeid));";
    var sql_options = [generators.getPublicKey(req.header('Cookie').split(";")[0]),req.params.roomHash,req.files[i].mimetype,req.files[i].size];
    
    db.query(sql,sql_options, (err,result) =>{
      
      if(err){
        res.send(JSON.stringify({
              success : false,
              message : err
            }));
      }else{
        
        if(result.rows[0]['?column?']){ //  make sure the file is within the constraints
          
        //  now we need to upload the file to google cloud
        console.log(i);
          googleStorage.sendUploadToGCS(req.files[i-1], (err)=>{
            if(err){
              console.log(err);
              res.send(JSON.stringify({
                success : false,
                message : "Error uploading file to storage"
              }));
            }else{
              //  its been uploaded to google cloud now we can 
              //  save it in the database aswell as create a new 
              //  message using the public key, roomHash, and messagemedia that can be sent to the room roomhash
  
              var message_sql ="";
              var message_sql_options = [];
              db.query(message_sql,message_sql_options,(result,err) => {
                if(err){
                  res.send(JSON.stringify({
                  success : false,
                  message : "There was an error sending the message, please try again."
                }));
                }else{
                  //  send it to the chat messages channel with the room hash given 
  
                  res.send(JSON.stringify({
                  success : true,
                  message : "Upload Sucessful"
                }));
                }
              });
            }
          });
        }else{  //  
          res.send(JSON.stringify({
            success : false,
            message : "Your file Type was invalid or the file size was too large"
          }));
        }
        
      }
    });
  
  };
  //  if its good then start the upload save it to the database 
  //  return a true and update the rooms messages 

  //  if not just return false maybe with a helpful error message 

});
module.exports = router;
