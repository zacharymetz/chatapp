/*
Authentication Module
*/
const db = require('../db');
const express = require('express');
var queryBuilder = require('./helpers/queryBuilder');
var router = express.Router();

var crypto = require('crypto');
/*

*/

//  this is my middle ware for authentication
function requiresLogin(req, res, next) {
  if (req.session && req.session.userid) {
    return next();
  } else {
      return res.redirect('admin/login');

  }
}






router.get('/login', (req, res) => {
  //dont have to do nothing lol

  res.render('auth/login.html');
});
router.post('/login', (req, res) => {
    //dont have to do nothing lol
    if(req.body.email && req.body.password){
      //  we have an email and a body so 
      let sql = `SELECT userid, email,
      emailconfirmed
      FROM public."user"
      where email = '' and passworddigest = '';`;
      let shasum = crypto.createHash('sha1');
      let params = [req.body.email,shasum.update(req.body.password).digest('hex')];
      db.query(sql,params,(err,result)=>{
        if(err){
          res.render('auth/login.html',{form : req.body,errors:["There was an error loggin you in, please check your account credntials and try again. "]})
        }else{
          //  the user was signed up sucesssfully so lets log them in and send them to their account page ?
          req.session.userid = result.rows[0].userid;
          //  also set a query to say the last login was at this time with this ip 
        }
      });
    }else{
      res.render('auth/login.html',{form : req.body,errors:["Please fill the form in correctly"]})
    }
});
//  the logout route here 
router.post('/logout', (req, res) => {
  //dont have to do nothing lol
  if (req.session) {
    // delete session object
    req.session.userid = null
            
             
    console.log("deleted");
    return res.redirect('/');
        
    }else{
        return res.redirect('/');
    }

});
router.get('/signup', (req, res) => {
    //dont have to do nothing lol
  
    res.render('auth/signup.html');
  });
  router.post('/signup', (req, res) => {
    //dont have to do nothing lol
    
    //  first thing is to validate the body 
    if(req.body.email && req.body.password){
      //  we have an email and a body so 
      let sql = `INSERT INTO public."user"( email, passworddigest, 
        date_created, lastloggedin, 
        loggedinfrom, emailconfirmed)
        VALUES ($1, $2, now(), now(), $3, false);
    `;
    let shasum = crypto.createHash('sha1');
      
      let params = [req.body.email,shasum.update(req.body.password).digest('hex'),
      req.headers['x-forwarded-for'] || req.connection.remoteAddress];
      db.query(sql,params,(err,result)=>{
        if(err){
          res.render('auth/signup.html',{form : req.body,errors:["We could not create your account, please try with a differnt email or password "]})
        }else{
          //  the user was signed up sucesssfully so lets log them in and send them to their account page ?
          req.session.userid = result.rows[0].userid;
        }
      });
    }else{  
      res.render('auth/signup.html', {form : req.body,errors:""});
    }
  });


module.exports = router;
module.exports.requiresLogin = requiresLogin;
