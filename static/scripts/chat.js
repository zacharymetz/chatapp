var socket;
var messages;

$(document).ready(function(){
    initalizeClient();
    //  button and key even listeners 
    $("#send-btn").click(function(){
        if($("#message-text").val() != ""){
            sendMessage($("#message-text").val());
            $("#message-text").val("");
        }
    });

    $('#message-text').on('keyup', function() {
        if (this.value.length > 1) {
             // do search for this.value here
             typingStart();
        }
   });
})

function initalizeClient(){
    //  get the room hash to figure out 
    messages = [];  // initalize the messages list 
    if(document.cookie != ""){
        var url = (new URL(window.location.href));
        
        $.post("/chat/JoinChatRoom", { userPrivateKey: document.cookie, roomHash : (new URL(window.location.href)).searchParams.get("roomHash") })
        .done(function( data ) {
            data = JSON.parse(data);
            if(data.success){
                console.log("Joied the room lol");
                //  ask for the last 200 messages 
                $.post("/chat/GetHistoricalMessages",{
                    roomHash : (new URL(window.location.href)).searchParams.get("roomHash"),
                    pageSize : 200,     //  how many messages to get 
                    page : 1,           //  if we have to offset to the next page
                    pageStart : (new Date).getTime()    //  so we dont double load if 
                })                                      //  more messages are sent
                .done(function(data){
                    data = JSON.parse(data);
                    if(data.success){
                        renderMessages(data.messages);
                    }else{
                        Swal.fire({
                            position: 'top-end',
                            type: 'fail',
                            title: 'Past Messages Could Not be Loaded',
                            showConfirmButton: false,
                            backdrop : false,
                            timer: 1500
                          })
                    }
                    
                });

                //  now lets open a websockets connection to our server 
                socket = io(window.location.origin,{user:document.cookie});
                
                //  reciving chat messages handler 
                socket.on('chat message', function(msg){
                    addMessage(msg);
                    console.log('message: ' + JSON.stringify(msg));
                });

                //  reciving user updates for state 
                socket.on('account state', function(msg){
                    console.log('message: ' + JSON.stringify(msg));
                });

                //  start listening to a channel for this chat room 
            }else{  //  create an error message if thinfs go wrong 
                Swal.fire({
                type: 'error',
                title: 'Error',
                text: 'There was an error joining the chat room, please try again later'
                });
            }
        });
    }
}




function addMessage(message){
    var template = $.templates("#message-tmpl");
    var htmlOutput = template.render({
        time : new Date(message.created_at),
        message: message.message
    });
    //  also inster it into the proper place in the list
    $("#message-list").html($("#message-list").html() + htmlOutput);
}

function sendMessage(message){
    // add message to the messages list 
    socket.emit('chat message', JSON.stringify({ "message" : message, "userKey" : document.cookie, "roomHash":(new URL(window.location.href)).searchParams.get("roomHash") }));
}
//  take in a message list and add them in to the correct spot on the list and the message 
//  internal list if i want to
function renderMessages(messageList){
    //  go thought the list backwards to add it to the list 
    for(var i=0;i<messageList.length;i++){
        //  add the messsages to the message list 
        messages.push(messageList[i]);
        //  render it in the list 
        var template = $.templates("#message-tmpl");
        var d = new Date(messageList[i].created_at);
        var htmlOutput = template.render({
            time :d.getHours()+":"+d.getMinutes()+":"+d.getSeconds() ,
            message: messageList[i].message
        });
        //  also inster it into the proper place in the list
        $("#message-list").html($("#message-list").html() + htmlOutput);

    }
}


//  events for typing and not typing 
var typingTimeout;
function typingStart(){
    //  when people start typing into the message bar a timeout will set 
    //  that will send a message to the account state line but will abort if
    //  either the send button is pressed (another message will be instantly sent)
    //  or more typing happens to the message 
    if(typingTimeout == null){  //  if there is a typingTimeout object then
                                //  we know that we have already been typing
                                //  and should send a message saying we are typing 
        socket.emit('account state',JSON.stringify({
            typing : true,
            userPrivateKey: document.cookie
        }));
        
    }else{
        clearTimeout(typingTimeout)
        typingTimeout = null;
    }
    typingTimeout = setTimeout(function(){
        socket.emit('account state',JSON.stringify({
            typing : false,
            userPrivateKey: document.cookie
        }));
        typingTimeout = null;
    },1000);
}
