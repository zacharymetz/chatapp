const express = require('express');
const nunjucks = require('nunjucks');

const bodyParser = require('body-parser');

const app = express();

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

//listen at 3000
app.listen(3000, () => console.log('server started'));
