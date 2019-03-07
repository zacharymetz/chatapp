var socket;
var messages;
var accounts;
var publickey;
$(document).ready(function(){
    //  put the loading screen up and then
    //  pick a random loading icon
    var loaders = ["square","fire","flask","ghost","block","line"];
    $("#connection-loader-animation").addClass(loaders[Math.floor(Math.random() * 7199254740992) % loaders.length] + "_loader");
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
            $.post(
                "/getOnlineUsers"
            ).done((data)=>{
                data = JSON.parse(data);
                //  run through all of the online users and set them to online
                console.log(data.users);
                for(var i=0;i<data.users.length;i++){
                    if(getUser(data.users[i]) != null){
                        console.log("Setting to online");
                        getUser(data.users[i]).online = true;
                    }
                }
                //  rerender the accoutnsTab
                renderAccountsTab();
            });
            //  ask for the last 200 messages 
            $.post("/chat/GetHistoricalMessages",{
                roomHash : (new URL(window.location.href)).searchParams.get("roomHash"),
                pageSize : 200,     //  how many messages to get 
                page : 1,           //  if we have to offset to the next page
                pageStart : (new Date).getTime()    //  so we dont double load if 
            })                                      //  more messages are sent
            .done(function(data){
                data = JSON.parse(data);
                $("#connection-loader").hide();
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
                renderAccountsTab();
                console.log('message: ' + JSON.stringify(msg));
            });

            //  reciving user updates for state 
            socket.on('account state', function(msg){
                console.log('asmessage: ' + JSON.stringify(msg));
                //  if an update nickname commands comes 
                if(msg.type == "nicknamechange"){
                    //  go thought the users and find the same hash then replace it with the the new one and rerender the user list 
                    var i;
                    for(i=0;i<accounts.length;i++){
                        console.log(accounts[i].userPublicKey);
                            console.log(msg.publickey);
                        if(accounts[i].publickey == msg.publickey){
                            
                            break;
                        }
                    }
                    //  now we can replace the ith nick name and rerender the users 
                    accounts[i].userName = msg.newNickName;
                    accounts[i].color = msg.newColor.toString(16);
                    renderAccountsTab();
                    console.log(msg);
                }else if(msg.type == "userConnected"){
                    console.log("taking account offline");  
                    bringAccountOnline(msg.publickey);
                }else if(msg.type == "userDisconnected"){  
                    console.log("taking account offline");
                    bringAccountOffline(msg.publickey);
                }else if(msg.type == "onlineUsers"){
                    console.log("got a list of inline users");
                    //  go though the list of accounts and set the proper ones to online before 
                    
                }
            });


            //  send a message to the server requesting a list of online users 
            
            
            
            //  start listening to a channel for this chat room 
        });
    }else{  //  there is not a valid cookie so we need to get a new account 
            //  and then call itselft again so we can start the inializtation
            //  again
            $.post("/chat/NewAccount")
            .then((data) => {
                data = JSON.parse(data);
                //  set the cookie 
                document.cookie = data.privatekey;
                initalizeClient();
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
    console.log(account.publickey);
    
    
    accounts.push({
        publickey : account.publickey,
        userName : account.name ,
        color : account.color.toString(16),
        online : false
    });
    var template = $.templates("#user-tmpl");
    var htmlOutput = template.render({
        userName : account.name ,
        publickey : account.publickey,
        color: account.color.toString(16),
        online : account.online
    });
    //  also inster it into the proper place in the list
    
    $("#users-list").html($("#users-list").html() + htmlOutput);
    

}
function renderAccountsTab(){
    $("#users-list").html("");
    //  need to order the list by who is online first with a simple sort 
    console.log("renderingAccounts Tab");
    for(var i=0;i<accounts.length;i++){
        var template = $.templates("#user-tmpl");
        console.log( publickey );
        if(accounts[i].publickey == publickey ){   //  if this is you then 
            console.log("its me");
            accounts[i].online = true;
        }
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

function updateInfoContainer(publicKey){
    //  put a little loading icon in the metadata container 

    loadPastNickName(publicKey,(data) => {
        //  hide the loading animation 
        console.log(data);
        $("#info-container-title").html(data.userName);
        $("#info-container-pk").html(data.publickey);
        $("#past-nicknames").html("");
        for(var i=0;i<data.pastNicknames.length;i++){
            var template = $.templates("#user-tmpl");
            var htmlOutput = template.render({
                userName : data.pastNicknames[i].name ,
                color: data.pastNicknames[i].color.toString(16)
            });
        //  also inster it into the proper place in the list
        
            $("#past-nicknames").html($("#past-nicknames").html() + htmlOutput);
        };
    });
    

}

function loadPastNickName(publicKey,callback){
    //  if the current nick name is the same as the first nic name from the list 
    //  then no request, if it is differnt then we send request 
    getPastNicknames(publicKey,function(data){
        data = JSON.parse(data);
        if(data.success){
            getUser(publicKey).pastNicknames = data.userNames;
            //  create a nice string of the past user names to send 
            callback(getUser(publicKey));
        }else{
            //  fail scilently 
        }
    });
}


function bringAccountOnline(publickey){
    //  first see if we have the user in our lists
    var index = -1;
    
    for(var i=0;i<accounts.length;i++){
        if(accounts[i].publickey == publickey){
            index = i;
            break;
        }
    }
    if(index != -1){
        //  if so we set the div to the online color 
        getUser(publickey).online = true;
        renderAccountsTab();
    }else{
        // if not we send an http request to the server to 
        //  find out what the username is from the route 
        //  we made ealier since it return the current one
        getPastNicknames(publickey,(data) =>{
            data = JSON.parse(data);
            //  add the entry to the list and add it to
            //  the list of users in the chat room and 
            //  set them to online 
            addAccount({
                "publickey" : publickey,
                userName : data.userNames[data.userNames.length -1].name ,  // last one is newest
                color : data.userNames[data.userNames.length -1].color.toString(16),
                online : true
            });

            //  send a command to rerender the account list and 
            //  to put all off the active users on the bottom
            renderAccountsTab();
        });
    }
    

}
function bringAccountOffline(accountPublickey){
    console.log("taking "+ JSON.stringify(accountPublickey) + " offline");
    for(var i=0;i<accounts.length;i++){
        console.log(accounts[i].publickey == accountPublickey);
        if(accounts[i].publickey == accountPublickey){
            console.log("it is offline");
            accounts[i].online = false
            break;
        }
    }
    renderAccountsTab();
}

//  2 event for file drag and dropping 
$('#file-drop-area').on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
    e.preventDefault();
    e.stopPropagation();
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
    var data = new FormData();
    for(var i=0;i<droppedFiles.length;i++){
        data.append('file-'+i, droppedFiles[i]);
    }
    $.ajax({
        url: '/chat/postcontent/'+ (new URL(window.location.href)).searchParams.get("roomHash") ,
        data: data,
        cache: false,
        contentType: false,
        processData: false,
        method: 'POST',
        type: 'POST', // For jQuery < 1.9
        done: function(data){
            console.log(data)
        }
    });
    
  });
