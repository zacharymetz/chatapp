/*
Customer Module
*/
const db = require('../db');
const express = require('express');
var queryBuilder = require('./helpers/queryBuilder');
var router = express.Router();

/*

*/
router.get('/', (req, res) => {
  //dont have to do nothing lol

  res.render('index.html');
});
router.get('/newroom', (req, res) => {
  //dont have to do nothing lol

  res.render('newRoom.html');
});


router.get('/about', (req, res) => {
  //dont have to do nothing lol

  res.render('about.html');
});
router.get('/howto', (req, res) => {
  //dont have to do nothing lol

  res.render('howto.html');
});


module.exports = router;
