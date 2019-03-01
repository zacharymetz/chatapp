const express = require('express');
const nunjucks = require('nunjucks');
const db = require('./db');
const generator = require('./controllers/helpers/generators');
const bodyParser = require('body-parser');
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
app.use('/', home);
io.on('connection', function(socket){
  //  do a qquire here to set the users state to online and send an emit a message
  //  to the room afterwards 
  console.log('User is online');
  socket.join((new URL(socket.handshake.headers.referer)).searchParams.get("roomHash"));
  console.log("user has joined room "+(new URL(socket.handshake.headers.referer)).searchParams.get("roomHash"));
  //everything
  var userPrivateKey = socket.handshake.headers.cookie.split(";")[0]
  console.log(socket.handshake.headers.cookie.split(";")[0]);

  //  clients sending messages 
  socket.on('chat message', function(msg){
    var body = JSON.parse(msg);
    // store the message in the database then transmit it out to everyone in the same room 
    var sql = "INSERT INTO public.message(created_by, created_in, message, created_at) VALUES ( (Select accountid from account where privatekey = $1), (select chatroomid from chatroom where hash = $2),$3, now()) RETURNING *;";
    //  generate a radnom sha1 hash for the room 
    console.log(sql)
    var query_options = [body.userKey,body.roomHash,body.message];
    db.query(sql,query_options ,(err, result) => {
      if(err){
        console.log(err);
        
      }else{
        console.log(body.roomHash);
        io.to(body.roomHash).emit('chat message', result.rows[0]);
        console.log('message: ' + msg);
    }});
    
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
      userPublicKey : generator.getPublicKey(body.userPrivateKey),
      typing : body.typing
    });

  })


  //  go offline and amke sure the user is registered as offline
  socket.on('disconnect', function(){
    //  do a query here to set the users state to offline and send the message to 
    //  the others in the chat room 
    console.log('User went offline');
  });
});

//listen at 3000
http.listen(3000, () => console.log('server started'));
