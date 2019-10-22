

var questionManager;
/**
 * This object will be a lef contained question 
 * where you can submit answers, get answers others have submited 
 * and so on 
 */
class Question{
    constructor(options,callback){
        var _this = this;
        //  first lets just worry about a multiple choice question 

        //  it has a body and then choices 
        if(options.type !== null){
            //  now lets set the object up
            
            if(options.type == "mc"){
                //  if its a multiple choice
                this.type = options.type;

                this.body = options.body;

                this.choices = options.choices;

                this.answerIndex = options.answerIndex;
            }

            //  we need to save this so lets do a post request 
            //  then off the post request we can transmit it to 
            //  all in the room 
            console.log({
                "userKey" : readCookie("privatekey"),
                "roomHash":(new URL(window.location.href)).searchParams.get("roomHash"),
                "question" : JSON.stringify(_this)
            });
            let questionRequest = {
                "question" : JSON.stringify(_this),
                "userKey" : readCookie("privatekey"),
                "roomHash":(new URL(window.location.href)).searchParams.get("roomHash") 
            };
            // questionManager.questionRequest(questionRequest,(msg)=>{
                
            // });
            
            
        
        }else{
            throw("Question was initlaized with no type");
        }
    }


    checkAnswer(){

        // we should get the index of   the radial
        console.log()
        let inputs = this.questionCard.find('input[name="choiceSelection"]:checked');
        console.log(inputs)
        if(inputs.length == 0){
            console.log("please pick an answer")
        }else if(inputs.length == 1){
            console.log(inputs[0].value == this.answerIndex)
        }
        //  and then compair it to the answer index 
        console.log("anser submitted");
    }


    /**
     * will return the relavent query object for the question 
     */
    render(placeIn){
        // make sure to have an absolute refernce 
        var _this = this;

        //  make the over all card 
        
        this.questionCard = $(`<form class="question-card"></form>`);
        
        // okay we should append it to somehwere here 
        $(placeIn).append(this.questionCard);
        //  add the type to the title 
        if(this.type == "mc"){
            // if it is an mulktiple choice question 
            this.questionCard.append(`<p class="question-title">MC Question</p>`);

            //  add the question body
            this.questionCard.append(`<p>`+this.body+`</p>`);

            for(let i in this.choices){

                //  figure out the a, b or c, d 
                console.log(i)
                let letter = String.fromCharCode(parseInt(i) + 65);
                let choice = this.choices[i];
                //  gen random id 
                let array = new Uint32Array(2);
                window.crypto.getRandomValues(array);
                let id = array[0].toString() + array[1].toString();
                this.questionCard.append(`
                <div>
                    <input  type="radio" name="choiceSelection" id="`+id+`" value=`+i.toString()+` >
                    <label for="`+id+`">
                        `+letter+`) `+choice+`
                    </label>
                </div>
                `);
            }


            //  now add the check answer button 
            let array = new Uint32Array(2);
            window.crypto.getRandomValues(array);
            let id = array[0].toString() + array[1].toString();
            this.questionCard.append(` <div class="button" id=`+id+`>Check Answer</div>`)
            $("#"+id).click(()=>{
                
                _this.checkAnswer();
            });

            
        }
        

    }

}


/**
 * 
 */
class QuestionManager{
    constructor(){
        this.inFlightRequest = [];
    }

    //  this is the socket emit thing and will be able to 
    //  have a call back for when the ack comes in with the same id 

    questionRequest(request,callback){
        //  create an id and an inflight object to be sent 
        let id ;
        this.inFlightRequest.push({
            id : id,
            data : request,
            callback : callback
        });
        //  send the request and make sure it knows what user and room its from.
        socket.emit('question', JSON.stringify({
            "id" :id,
            "data" : request,
            "userKey" : readCookie("privatekey"),
            "roomHash":(new URL(window.location.href)).searchParams.get("roomHash") 
        }));
        

    }

    questionAck(msg){
        let index;
        //  look through the inlfight list to see which request it matches with 
        for(let i in this.inFlightRequest){
            // server will echo back same id that was send with quesiton request 
            if(this.inFlightRequest[i].id == msg.id){
                //  next get the object and run the call back with the data in it 
                this.inFlightRequest[i].callback(msg);
                index = parseInt(i);
                break;
            }
        }


        //  remove the inflight object from the list to no longer worry about it 
        this.inFlightRequestarr.splice(index, 1); 
        //  this is gonna be okay since we only append to the list so deleteing something 
        //  before that shouldnt mess to much with anything

    }

    newQuestion(question){

        //  this will trigger a new question getting created, 
        //  added to both the messages and the questions list

        //  then we will render the question in the proper place 

    }
}








/**
 * code for new question dialog is gonna sit here 
 */


var dialog; 


function openNewQuestionDialog(){

    //  lets reset everything up here r? idk



    $( "#newQuestionDialog" ).dialog({
        height: 450,
        width: 650,
        modal: true
      });
      $( "#tabs" ).tabs();
}
function validateNewCorrectMcChoice(target){
    //  see if i am selecting 
    if(target.checked){
        let listOfChoices = $("#mc-choices").children();
        console.log(listOfChoices);
        for(let i=0;i<listOfChoices.length;i++){
            $(listOfChoices[i]).find('input[type="checkbox"]').prop("checked", false)
        }
        $(target).prop("checked", true);
    }
    //  if i am then make sure to reset all but the one that is being 

    //  checked 
}

/**
 * adds a new empty question box to the new quesiton thing 
 */
function addNewMcChoice(){
    var newItem = $(`
    <div style="display: flex;align-items: center;margin-bottom:0.5rem;">
    <div class="delete-choice-btn"></div>
        <input type="checkbox" style="margin-right:1rem;">
            <label for="new-mc-body" style="margin-right:1rem;" >Choice :</label>
            <input type="text" style="flex-grow: 1">
          </div>
    `)
    $("#mc-choices").append(newItem);
    newItem.change((event)=>{
        validateNewCorrectMcChoice(event.target)
    });

    //  will go and self delete lol 
    $(newItem.find(".delete-choice-btn")[0]).click(()=>{
        newItem.remove();
    });
}

function CreateNewMcQuestion(){


    

    //  get all the choices 
    let choices = [];
    let answerIndex;
    let listOfChoices = $("#mc-choices").children();
        console.log(listOfChoices);
        for(let i=0;i<listOfChoices.length;i++){
            choices.push($(listOfChoices[i]).find('input[type="text"]').val());
            if($(listOfChoices[i]).find('input[type="checkbox"]').prop("checked")){
                //  lets keep a copy of i here for later 
                answerIndex = parseInt(i);
            }
        }
    
    //  do some validation here 
    
    
    let question = new Question({
            type : "mc",
            body : $("#new-mc-question-body").val(),
            image : $("#new-mc-question-image"), 
            choices : choices,
            answerIndex : answerIndex
        });
        question.render($("#message-list"));
        //  close the dialog box 
        $( "#newQuestionDialog" ).dialog('close');
}