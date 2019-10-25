const express = require('express');
const nunjucks = require('nunjucks');
const db = require('./db');
const generator = require('./controllers/helpers/generators');
const bodyParser = require('body-parser');
var cookie = require('cookie');
var URL = require('url').URL;
const inializeSocket = require('./controllers/socket');
const getConnectAccounts = require('./controllers/socket').getConnectAccounts;
const addUser = require('./controllers/socket').addUser;
const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//  pass it though 


app.use('/static', express.static(__dirname + '/static'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



nunjucks.configure('views', {
  autoescape: true,
  express: app
});

var chat = require('./controllers/chat');
var home = require('./controllers/home');
var question = require('./controllers/question');
app.use('/question', question);
app.use('/chat', chat);
app.use('/', home);


//  have a simple route that will get all the online users 
//  should move this over too a socket route tho
app.post("/GetOnlineUsers",(req,res)=>{
  res.send(JSON.stringify({
    success : true,
    //  tell them the guy that is online so they can respond back
    users: getConnectAccounts()
  }));
});






io.on('connection', function(socket){


  //  should move all of this over to the socket initalization thing 


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

      //  when we are down here everything is good and now its socket manipulation 
      console.log('User is online');

      //  set up the socket it interact with the rest of the system 
      inializeSocket(socket,io);
      
      
      
    }
  });
});

//listen at 3000
http.listen(3000, () => console.log(db));


exports.server = http
exports.io = io





