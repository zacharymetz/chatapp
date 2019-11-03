/*
Customer Module
*/
const db = require('../db');
const express = require('express');
var router = express.Router();
var requiresLogin = require('./auth').requiresLogin;
//  get the io from the main 



router.get('/',(req, res) => {
    if(req.session.userid){
        res.render('moderation/dashboard.html')
    }else{
        res.render('moderation/index.html')
    }
});


router.get('/thread/:threadId',requiresLogin,(req, res) => {

});


module.exports = router;