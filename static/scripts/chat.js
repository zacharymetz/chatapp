


$(document).ready(function(){
    //  button and key even listeners 
    $("#send-btn").click(function(){
        if($("#message-text").val() != ""){
            addMessage($("#message-text").val());
            $("#message-text").val("");
        }
    });
})

var messages = []

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