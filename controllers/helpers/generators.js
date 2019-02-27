
var crypto = require('crypto'), shasum = crypto.createHash('sha1');
/*
  Use a seed or none to generate a 512 bit private user key,
  this is going to be my own algorithem so it might not
  be secure.
*/
function generate512Private(seed=null){
  var number_of_octets = 64; // needs to be even
  var charList = "abcdefghijklmnopqrstuvwqyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$"
  var numbers = [];
  //  generate 512 random bits of data in 16 bit numbers 
  for(var i=0;i<number_of_octets/2;i++){
    numbers.push((Math.floor((Math.random() * 8796093022208) + 1)) % 65535);
  }

  //  now we can do things to the numbers 
  //  catch the seed value
  

  //  create a string from the numbers and return it 
  var returnString = "";
  for(var i=0;i<numbers.length;i++){
    while(numbers[i] > charList.length - 1){
      var target = (numbers[i] ) % (charList.length - 1);
      returnString += charList.charAt(target)
      //  now we need to shift over the number by log(charList.length) bits 
      //  so we 
      numbers[i] = numbers[i] >>> Math.log2(charList.length) ; 
    }
    //  add the remining letter 
    returnString += charList.charAt(numbers[i]);
  }
  return returnString;
}

/*
  Public Keys are just hashes of the private keys,
  Its a nice unike way to identify people when they change their nick name 
*/
function getPublicKey(privateKey){
  return shasum.update(privateKey);
}
