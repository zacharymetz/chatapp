/*
Customer Module
*/
const db = require('../db');
const express = require('express');
var router = express.Router();
//  get the io from the main 
var emit = require('../index').emit;
/*

*/
router.post('/new', (req, res) => {

  //first lets validate the question json
    // right now im going to assume that its nice and validated 


  // then query to see if the user belongs in that room
    //  this is assumed as well 

  // add a message from the user with the type question so it renders differnly 
  // since its js render i can pass it as an object back and just set up 
  // a div with an id and then render it in there 
  console.log(req.body.userKey,req.body.roomHash)
  db.query(`
  INSERT INTO public.message(created_by, created_in, message, data, created_at)
  VALUES ((Select accountid from account where publickey = $1), (select chatroomid from chatroom where hash = $2), $3, $4, now());
  `,[req.body.userKey,req.body.roomHash,"New Question",req.body.question],(err, result) => {
    if(err){
        console.log(err)
        res.send(JSON.stringify({
            success : false,
            data : err
        }));
    }else{
        //  if it is a successful insert then we can just send it back 
        
        res.send(JSON.stringify({
            success : true,
            data : {}
        }));
    }
  });

  
});



module.exports = router;
