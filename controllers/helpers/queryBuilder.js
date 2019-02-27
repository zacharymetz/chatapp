//  Constaints
var DEFAULT_PAGE_SIZE = 20;



/*
 Builds a postrgres query from a js grid data request


 // every query must also return the count of items in the database for the
 // returns the query sting and the options

*/
function jsGridQueryBuilder(tableName,query,validSortFeilds,innerJoin=null){
  var query_string ="";
  var query_options = [];
  var andFlag = false; //if there is only one option no need for and


  var attributes = Object.keys(query);
  //remove page Size, page Index, SortFeild and Sort Order
  if(query.pageSize != null){
    attributes.splice( attributes.indexOf('pageSize'), 1 );
  }
  if(query.pageIndex != null){
    attributes.splice( attributes.indexOf('pageIndex'), 1 );
  }
  if(query.sortField != null){
    attributes.splice( attributes.indexOf('sortField'), 1 );
  }
  if(query.sortOrder != null){
    attributes.splice( attributes.indexOf('sortOrder'), 1 );
  }

  // now that all of them are removed loop through the attributes to
  // build the query string
  // if there is an inner join request then we can put the request here

  if(innerJoin != null){
    console.log(innerJoin);
    console.log("=======================");
    query_string =  query_string + innerJoin.query;
    andFlag = true;
  }
 for(var i=0;i<attributes.length;i++){
   if(query[attributes[i]] != ''){
     if(!andFlag){
       andFlag = true;
     }else{
       query_string = query_string + " AND "
     }
     //do a check to see if the feild is number or a string or date
     // WARNING ALL UNTESTED BUT WORKS WITH STRINGS, no idea about dates tho
     // havent gotten that far lol
     if(!isNaN(query[attributes[i]])){ // if its a number
       query_string = query_string + attributes[i] +" = $" + (query_options.length + 1) + " ";
     }
     else if(new Date(query[attributes[i]]) !== "Invalid Date" && !isNaN(new Date(query[attributes[i]]))){ // see if its a valid date
       query_string = query_string + attributes[i] +" = $" + (query_options.length + 1) + " ";
     }else{ // give up its a string and make sure toi search it by lower
       query_string = query_string +" LOWER(" + attributes[i] +") like LOWER($" + (query_options.length + 1) + ") ";
       //since its a string we need to add the % % to front and back
       query[attributes[i]] = "%" + query[attributes[i]] + "%";
     }
     //no matter what
     query_options.push(query[attributes[i]]); // push it to the string so it can be added in later
   }
 }
 if(query_options.length > 0 && innerJoin == null ){
   query_string =" WHERE " + query_string;
 }



 //also have a thing that retinr the items number with it
 var query_string_select = "SELECT *" ;
 // here incase there is an inner join we might need to ad extra columns here
 if(innerJoin != null){
   for(var i=0;i<innerJoin.columns;i++){
     query_string_selec = query_string_selec + ", "+ innerJoin.columns[i];
   }
 }

 query_string = query_string_select +", count(*) OVER() AS itemsNumber From " + tableName + "  " + query_string;
 //check to see if there are any options to query by
var sort = "";
 // check to see if there is a sort feild and add it to the query
   if(query.sortField == null){
     //if the sort is null we should show newest first so newest id
     sort = tableName + "id";
   }else{
      for(var i=0;i<validSortFeilds.length;i++){ //  loop to see if valid sort
        if(query.sortField == validSortFeilds[i]){
          sort = validSortFeilds[i];
          break;
        }
      }
   }

  //need to safely add it to things cuz asc and desc are control statments
    var sortOrder = "DESC";
    if(query.sortOrder == 'asc'){
      sortOrder = "ASC"
  }
  query_string = query_string + "ORDER BY " + tableName +"." + sort + " " + sortOrder + " ";
   //query_options.push(query.sortField);




  if(query.pageSize == null){
    query.pageSize = DEFAULT_PAGE_SIZE;
  }
 // next we need to add the limit and potentially the offset
 query_string = query_string + " LIMIT " + query.pageSize + " ";

 if(query.pageIndex > 1){
   query_string = query_string + " OFFSET " + ((query.pageIndex - 1) *query.pageSize ) + " ";
 }
 query_string = query_string + "; ";
 //add the part to get the number of records in the database
 return [query_string,query_options];
}
module.exports.jsGridQueryBuilder = jsGridQueryBuilder;
