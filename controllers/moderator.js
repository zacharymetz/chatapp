/*
Moderator Module
*/
const db = require('../db');
const express = require('express');
var queryBuilder = require('./helpers/queryBuilder');
var router = express.Router();

/*

*/
router.get('/login', (req, res) => {
  //dont have to do nothing lol

  res.render('mod/login.html');
});
router.post('/login', (req, res) => {
    //dont have to do nothing lol

    res.render('index.html');
});
router.post('/logout', (req, res) => {
  //dont have to do nothing lol

  res.render('index.html');
});
router.get('/signup', (req, res) => {
    //dont have to do nothing lol
  
    res.render('mod/signup.html');
  });

module.exports = router;
