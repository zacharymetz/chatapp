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
/*

*/
router.get('/CustomerDetails', (req,res) =>{
  res.render('customers/details.html', { customer : null });
});
/*

*/
router.post('/GetCustomers',(req,res)=> {
  console.log(req.body);
  var query = req.body;

  //  need to add sorts up here since can do sql injections if not
  //  to stop sql injections we need to check the feilds
  var validSortFeilds = ["lastname","email","street","postal_code","state","firstname"];

 var queryOptions = queryBuilder.jsGridQueryBuilder("Customer", query, validSortFeilds);

  //run the query here since it should be good
  //this is all simulation
  //send back a mock but this is the structure we need but exact the itemsCount
  db.query(queryOptions[0],queryOptions[1] ,(err, result) => {

    if (err) {
      console.log(err.stack);
      res.send(JSON.stringify({
          d: false
      }));
    } else {
      var numberOfItems = 0;
      if(result.rows[0]){
        numberOfItems = result.rows[0].itemsnumber
      }
      res.send(JSON.stringify({
          data: result.rows,
          itemsCount: numberOfItems
      }));
    }
  });

});

/* Country and  */




/*

*/
router.post('/CreateCustomer', (req,res) => {

  //get the request arguments
  var data = req.body;
  console.log(data);
  //validate them
  if(false){
    res.send(JSON.stringify({success : false}));
  }

  //save them to the db
  var sqlString = "INSERT INTO public.customer(lastname, firstname, street, postal_code, phone, email, province) VALUES ($1, $2, $3, $4, $5, $6, $7);";
  var sqlOptions = [data.last_name,data.first_name,data.street,data.postal_code,data.phone,data.email,data.state];
  db.query(sqlString,sqlOptions,(err, result) => {
    var result_json = {};
    if(err){
      result_json.success = false;
      result_json.error = "Database error";
      console.log(err);
    }else{
      result_json.success = true;
    }

    res.send(JSON.stringify(result_json));

  });


});



module.exports = router;
