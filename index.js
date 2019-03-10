const express = require('express');
const nunjucks = require('nunjucks');
const db = require('./db');
const generator = require('./controllers/helpers/generators');
const bodyParser = require('body-parser');
var cookie = require('cookie');
var URL = require('url').URL;

const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use('/static', express.static(__dirname + '/static'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



nunjucks.configure('views', {
  autoescape: true,
  express: app
});

var chat = require('./controllers/chat');
var home = require('./controllers/home');




app.use('/chat', chat);
app.post("/GetOnlineUsers",(req,res)=>{
  res.send(JSON.stringify({
    success : true,
    //  tell them the guy that is online so they can respond back
    users: getConnectAccounts()
  }));
});
app.use('/', home);



//  this variable is for saving the socket id of the user 
var onlineUsers = [];

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



io.on('connection', function(socket){
  var cookies = cookie.parse(socket.handshake.headers.cookie);
  var userPrivateKey = cookies.privatekey;
  console.log(cookies);
  //  do a qquire here to set the users state to online and send an emit a message
  sql = "INSERT INTO public.account_chatroom( accountid, chatroomid, date_joined) VALUES ( (Select accountid from account where publickey = $1),(select chatroomid from chatroom where hash = $2) , now());"
  //  now we need to return a list of all of the users in the the chat room and 
  //  their current nickname according to the database 
  sql += "";
  sql_options = [generator.getPublicKey(userPrivateKey),(new URL(socket.handshake.headers.referer)).searchParams.get("roomHash")];
  //  we need to see if there is a user and if so then we can 
  //  get a list of the users in that chat room and up too 
  //  the most 200 recent messages
  db.query(sql,sql_options ,(err, result) => {
    if(err){
      console.log(err);
      
    }else{
      //  this is the sucess conditions 
      addUser(generator.getPublicKey(userPrivateKey),socket.id);
      //  send a message to asll clients that the user is online 
      
      
      console.log('User is online');
      socket.join((new URL(socket.handshake.headers.referer)).searchParams.get("roomHash"));
      socket.emit('hash',generator.getPublicKey(userPrivateKey));
      console.log("user has joined room "+(new URL(socket.handshake.headers.referer)).searchParams.get("roomHash"));
      socket.broadcast.emit('account state', {
        type : "userConnected",
        publickey : generator.getPublicKey(userPrivateKey)
      });
    }
  });

  //  clients sending messages 
  socket.on('chat message', function(msg){
    var body = JSON.parse(msg);
    //  here is where i am gonna do all the command things 
    if(body.message.charAt(0) == "/"){
      //now lets check to see if eveything before the first " ", 
      var command = body.message.split(" ")[0].substring(1);
      if(command == "nick"){
        //  update the nick name in the database and then send the chat room a user state update ?
        var sql = "INSERT INTO public.nickname(accountid, name, color, created_at) VALUES ( (select accountid from account where publickey = $1), $2, 000000, now()) RETURNING name, color;";
        var sql_options = [generator.getPublicKey(body.userKey),body.message.split(" ")[1]];
        db.query(sql,sql_options ,(err, result) => {
          if(err){
            console.log(err);
            
          }else{
            console.log(body.roomHash);
            io.to(body.roomHash).emit('account state', {
              publickey : generator.getPublicKey( body.userKey),
              newNickName : result.rows[0].name,
              newColor : result.rows[0].color
            });
            console.log('message: ' + msg);
        }});
      }else if(command == "nickcolor"){
        //  update the nick name color for the current nick name 
        var sql = "UPDATE public.nickname SET  color= $1 WHERE nicknameid =  (select nicknameid from nickname where accountid = (select accountid from account where publickey = $2) order by created_at DESC  limit 1 ) RETURNING *;";
        var sql_options = [parseInt(body.message.split(" ")[1],16),generator.getPublicKey(body.userKey)];
        db.query(sql,sql_options ,(err, result) => {
          if(err){
            console.log(err);
          }else{
            console.log(result.rows[0]);
            io.to(body.roomHash).emit('account state', {
              publickey : generator.getPublicKey( body.userKey),
              newNickName : result.rows[0].name,
              newColor : result.rows[0].color
            });
          }});
        
      }
    }else{  //  it isnt a command so we can just send the message
      var sql = "INSERT INTO public.message(created_by, created_in, message, created_at) VALUES ( (Select accountid from account where publickey = $1), (select chatroomid from chatroom where hash = $2),$3, now()) RETURNING *;";
      //  generate a radnom sha1 hash for the room 
      

      var query_options = [generator.getPublicKey( body.userKey),body.roomHash,body.message];
      db.query(sql,query_options ,(err, result) => {
        if(err){
          console.log(err);
          
        }else{
          console.log(result);
          result.rows[0].publickey = generator.getPublicKey( body.userKey);
          io.to(body.roomHash).emit('chat message', result.rows[0]);
          console.log("sent message");
      }});
    }
    // store the message in the database then transmit it out to everyone in the same room 
    
    
  });

  //  this channel will be for sending account states (for now just typing)
  socket.on('account state',function(msg){
    var body = JSON.parse(msg);
    
    //  the accounts table will be where account state is stored so 
    //  depending on what kind of message is recived here it will either
    //  set typing true and typing false as well as send the update to the 
    //  others in the same room as the users 
    
    //  send the typing notification about the account 
    io.to(body.roomHash).emit('account state', {
      type : "usertyping",
      userPublicKey : generator.getPublicKey(body.userPrivateKey),
      typing : body.typing
    });

  })

  socket.on('ping',function(msg,socket){
    var body = JSON.parse(msg);
    console.log("got a ping");
    if(type == "initalPing"){
      socket.emit('account state', {
      type : "onlineUsers",
        //  tell them the guy that is online so they can respond back
      users: getConnectAccounts()
      });
    
    
    

  }});


  //  go offline and amke sure the user is registered as offline
  socket.on('disconnect', function(){
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
  });
});

//listen at 3000
http.listen(3000, () => console.log('server started'));
