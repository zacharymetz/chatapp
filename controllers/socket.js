const db = require('../db');
const generator = require('./helpers/generators');

var cookie = require('cookie');
var URL = require('url').URL;


//  this variable is for saving the socket id of the user 
var onlineUsers = [];
var Server =require('../index');



console.log("IMPORTED NEW IOT THING")



/**
 * This function will set up the socket for all the events and communication 
 * @param {Socket IO object} socket 
 */
function initalizeSocket(socket,io){
    //  get the required data from the socket
    var cookies = cookie.parse(socket.handshake.headers.cookie);
    var userPrivateKey = cookies.privatekey;
    
    //  let the socket join the room based on the room hash and then give them their hash for some reasons 
    socket.join((new URL(socket.handshake.headers.referer)).searchParams.get("roomHash"));
    socket.emit('hash',generator.getPublicKey(userPrivateKey));
    //  send a message to the room that tells everyone that the user has connected
    console.log("user has joined room "+(new URL(socket.handshake.headers.referer)).searchParams.get("roomHash"));
        socket.broadcast.emit('account state', {
        type : "userConnected",
        publickey : generator.getPublicKey(userPrivateKey)
    });











    //  route for sending messages 
    socket.on('chat message', newChatMessage);

    // need to do this to pass the socket to the function 
    socket.on('disconnect', ()=>{
        userDisconnect(socket);
    });
    // for reciving heart beats form the client 
    socket.on('ping',(msg)=>{
        clientPing(msg,socket);
    });

}



module.exports = initalizeSocket;


//  *****************************************************************
//  BELOW ARE FUNCTION FOR SOCKET ACTIONS

function newChatMessage(msg){
    var body = JSON.parse(msg);
    //  here is where i am gonna do all the command things 
    {  //  it isnt a command so we can just send the message
        // i remove the text commands suince ill moves those too another one 
      var sql = "INSERT INTO public.message(created_by, created_in, message, created_at) VALUES ( (Select accountid from account where publickey = $1), (select chatroomid from chatroom where hash = $2),$3, now()) RETURNING *;";
      //  generate a radnom sha1 hash for the room 
      

      var query_options = [generator.getPublicKey( body.userKey),body.roomHash,escapeHtml(body.message)];
      db.query(sql,query_options ,(err, result) => {
        if(err){
          console.log(err);
          
        }else{
          console.log(result);
          result.rows[0].publickey = generator.getPublicKey( body.userKey);
          Server.io.to(body.roomHash).emit('chat message', result.rows[0]);
          console.log("sent message");
      }});
    }
    // store the message in the database then transmit it out to everyone in the same room 
    
    

    
    
  }

  function userDisconnect(socket){
    //  take the user offline if they are only connected by one socket id 
    
    var publickey = removeUser(socket.id);
    console.log(publickey);
    if(publickey != null){
      socket.broadcast.emit('account state', {
        type : "userDisconnected",
        publickey : publickey
      });
    }
    console.log('User went offline');
  }


function clientPing(msg,socket){
    var body = JSON.parse(msg);
    console.log("got a ping");
    if(type == "initalPing"){
      socket.emit('account state', {
      type : "onlineUsers",
        //  tell them the guy that is online so they can respond back
      users: getConnectAccounts()
      });
    
    
    

  }}



//  *****************************************************************
//  BELOW ARE FUNCTIONS FOR SOCKET ACTIONS

//  used alot to stop xss 
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  }
  


function addUser(publickey,id){
  //  check if the user is in the list 
  var index = -1;
  for(var i=0;i<onlineUsers.length;i++){
    if(onlineUsers[i].publickey == publickey){
      index = i;
      break;
    }
  }
  if(index == -1){  //  it does not exist in the list so we should add it
    onlineUsers.push({
      'publickey' : publickey,
      'ids' : [id]
    });
    console.log(onlineUsers);
  }else{
    onlineUsers[index].ids.push(id);
  }
  console.log(onlineUsers);
}

function removeUser(id){
  //  go though the 2d list 
  var i;
  var j;
  var found = false;
  var returnKey;
  for(i=0;i<onlineUsers.length;i++){
    for(j=0;j<onlineUsers[i].ids.length;j++){
      if(onlineUsers[i].ids[j] == id){
        found = true;
        returnKey = onlineUsers[i].publickey;
        break;
      }
    }
  }
  console.log(found);
  if(found){
     // remove the object from the list 
      onlineUsers.splice(i-1, 1);
      return returnKey;
      
    
  }
}
function getConnectAccounts(){
  accountsList =[];
  for(var i=0;i<onlineUsers.length;i++){
    accountsList.push(onlineUsers[i].publickey);
  }
  return accountsList;
}

module.exports.getConnectAccounts = getConnectAccounts;
module.exports.addUser = addUser;