


$(document).ready(function(){
    //  button and key even listeners 
    $("#send-btn").click(function(){
        if($("#message-text").val() != ""){
            addMessage($("#message-text").val());
            $("#message-text").val("");
        }
    });
})

var messages = [];

function addMessage(message,render=true){
    // add message to the messages list 
    messages.push({
        "time" : (new Date()),
        "user" : "User1",
        "message" : message
    });
    if(render){ // for adding only if you want 
        //render the new message
        var template = $.templates("#message-tmpl");

        var htmlOutput = template.render(messages[messages.length-1]);

        $("#message-list").html($("#message-list").html() + htmlOutput);
    }
}

function renderMessages(){
    //  go thought the list backwards to add it to the list 
}


/* 
    Looks for a user's private key in the local storage and if 
    found will use it to connect to the chat room via websockets 
    to the server, there are 2 possibilites now 
    1. private key is good  
    2. private key is bad so send a new private key that is put into local storage 
    Next it will send a message to get all the users of the chat room and historical messages up too 200 for now 
    but there is going to be a way to load in more historical data 
    
*/
function initChatRoomClient(){

};
