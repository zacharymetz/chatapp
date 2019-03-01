var socket;
var messages;
var accounts;
var publickey;
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
    accounts = [];
    if(document.cookie != ""){
        
        
        $.post("/chat/GetChatRoomUsers",{
            roomHash : (new URL(window.location.href)).searchParams.get("roomHash"),
            pageSize : 200,     //  how many messages to get 
            page : 1,           //  if we have to offset to the next page
            pageStart : (new Date).getTime()    //  so we dont double load if 
        })                                      //  more messages are sent
        .done(function(data){
            
            data = JSON.parse(data);
            //  add the users to the user list and the page 
            console.log(data);
            //  lets snag our public key 
           
            for(var i=0;i<data.accounts.length;i++){
                addAccount(data.accounts[i]);
                
                
               
            }
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
            socket.on('hash', function(msg){
                publickey = msg
                for(var i=0;i<accounts.length;i++){
                    //  if we find our account lets set our user stuff 
                    console.log(accounts[i].color );
                    if(accounts[i].publickey == publickey){
                        $("#current-user").html(accounts[i].userName);
                        $("#current-user").css( "color", "#" +accounts[i].color );
                    }
                }
                console.log('message: ' + JSON.stringify(msg));
            });

            //  reciving user updates for state 
            socket.on('account state', function(msg){
                console.log('message: ' + JSON.stringify(msg));
                //  if an update nickname commands comes 
                if(msg.type = "nicknamechange"){
                    //  go thought the users and find the same hash then replace it with the the new one and rerender the user list 
                    var i;
                    for(i=0;i<accounts.length;i++){
                        console.log(accounts[i].userPublicKey);
                            console.log(msg.publickey);
                        if(accounts[i].publickey == msg.publickey){
                            
                            break
                        }
                    }
                    //  now we can replace the ith nick name and rerender the users 
                    accounts[i].userName = msg.newNickName;
                    accounts[i].color = msg.newColor.toString(16);
                    renderAccountsTab();
                    console.log(msg);
                }
            });

            //  start listening to a channel for this chat room 
        });
    }
}




function addMessage(message){
    var template = $.templates("#message-tmpl");
        var d = new Date(message.created_at);
        var htmlOutput = template.render({
            time :d.getHours()+":"+d.getMinutes()+":"+d.getSeconds() ,
            user : getUser(message.publickey),
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
            user : getUser(messageList[i].publickey),
            message: messageList[i].message
        });
        //  also inster it into the proper place in the list
        $("#message-list").html($("#message-list").html() + htmlOutput);

    }
}

function addAccount(account){
    
    accounts.push({
        publickey : account.publickey,
        userName : account.name ,
        color : account.color.toString(16)
    });
    var template = $.templates("#user-tmpl");
    var htmlOutput = template.render({
        userName : account.name ,
        publickey : account.publickey,
        color: account.color.toString(16)
    });
    //  also inster it into the proper place in the list
    
    $("#users-list").html($("#users-list").html() + htmlOutput);
    console.log(account);

}
function renderAccountsTab(){
    $("#users-list").html("");
    for(var i=0;i<accounts.length;i++){
        var template = $.templates("#user-tmpl");
        var htmlOutput = template.render(accounts[i]);
        //  also inster it into the proper place in the list
        console.log(accounts[i]);
        
        $("#users-list").html($("#users-list").html() + htmlOutput);
    }
}
function getUser(publickey){
    for(var i=0;i<accounts.length;i++){
        if(publickey == accounts[i].publickey){
            return accounts[i];
        }
    }
    return "Error name not found"
}

function getPastNicknames(publicKey,callback){
    $.post("/chat/GetPastUserNames",{
        accountPublicKey : publicKey
    }).done(callback);
}

function loadPastNickName(publicKey,originator,callback){
    //  if the current nick name is the same as the first nic name from the list 
    //  then no request, if it is differnt then we send request 
    getPastNicknames(publicKey,function(data){
        data = JSON.parse(data);
        if(data.success){
            getUser(publicKey).pastNicknames = data.userNames;
            //  create a nice string of the past user names to send 
            var accounts = "";
            for(var i=0;i<data.userNames.length;i++){
                accounts += "<p>" + data.userNames[i].name +"</p>"
            }
            console.log(accounts);
            callback(accounts,originator);
        }else{
            //  fail scilently 
        }
    });
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

// when you type "/nickcolor " into the bar regardless 
//  the color thing will popup 
$('#message-text').on('keyup', function() {
    if($('#message-text').val() == "/nickcolor"){
        // show the color thing above the keybar 
        document.getElementById('color-area').jscolor.show();
        //  span an event listener for the on change to the other thing to put in the nick color 
        $("#color-area").on("change",function(){
            $('#message-text').val("/nickcolor " + $("#color-area").val());
        });
    }
});



//  2 event for file drag and dropping 
$('#file-drop-area').on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
    e.preventDefault();
    e.stopPropagation();
  })
  .on('dragover dragenter', function() {
    $('#file-drop-pic').addClass('is-dragover');
  })
  .on('dragleave dragend drop', function() {
    $('#file-drop-pic').removeClass('is-dragover');
  })
  .on('drop', function(e) {
    droppedFiles = e.originalEvent.dataTransfer.files;
  });
