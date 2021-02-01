///////////////////
// 
// In this file, the basics for managing multiple extracts
//
var curParams;

function Parameters(imageURL, tabcode, contextDur, contextTuning, tabType, fontName, history){
  // This object contains information about the basic unit of
  // transcription/edition. It also keeps track of its undo record
  // ('history'). For most applications, it is expected that this will
  // be retrieved from a remote server, usually on a live ajax link.
  this.imageURL = imageURL;
  this.tabcode = tabcode;
  this.contextDur = contextDur;
  this.contextTuning = contextTuning;
  this.tabType = tabType;
  this.fontName = fontName;
  this.history = history;
  this.id = false;
  this.num = false;
  this.allocated = false;
  this.edited = false;
  this.submitted = false;
  this.message = false;
  this.messageType = false;

  this.defaultDur = function(){return FlagDur(contextDur);};
  this.font = function(){
    if(this.fontName == "Varietie"){
      return fonts[0];
    } else {
      return fonts[1];   
    }
  };
	this.fretFont = function() {
		if(this.tabType == "Italian") {
			// Normal numbers rather than a special font
			return fonts[2]; //FIXME: This is a non-free font
		} else {
			return this.font();
		}
	};
    this.flagFont = function () {
		if(this.tabType == "French") {
			return this.font();
		} else {			// Flags are always drawn as varietie for Italian tabs
			return fonts[0];
		}
	};
  this.drawContextDur = function(DOMObj){
//    alert(this.fontName);
    var obj = svgText(DOMObj, 10,10, "flag "+this.fontName, 
      "contextflag", false, this.contextDur);
    $(obj).data("word", this);
  };
  this.editMessage = function(){
    var dbox = dialogueBoxFloat();
    dbox.style.left = "10%";
    dbox.style.bottom = "5px";
    dbox.appendChild(DOMTextEl('h3', '', '', 'Messages'));
    dbox.appendChild(DOMSelect('MessageType', 'messages', 'messages', true, 
        messageSelectOptions(this.messageType)));
    var ta = DOMTextArea('messagetext', 'messagetext');
    if(this.message) ta.innerHTML(this.message);
    ta.cols = 60;
    ta.rows = 12;
    dbox.appendChild(ta);
    var div = DOMDiv('simplebuttonsbar', 'simplebuttonsbar', false);
    dbox.appendChild(div);
    div.appendChild(DOMButton('okbutton', 'okbutton',
      'Ok', function(id){
        return function(){
          var types = getTypes();
          var message = document.getElementById('messagetext').value;
          if(types!=this.messageType || message!= this.message){
            this.messageType = types;
            this.message = message;
            curUser.commitMessage(id, types, message);
          }
          clearButtons();
        };
      }(this.id)));
    div.appendChild(DOMButton('cancelbutton', 'cancelbutton',
      'Cancel', clearButtons));
  };
}

function getTypes(){
  var options = $("#messages option");
  var types = 0;
  for(var i=0; i<options.length; i++){
    if(options[i].selected){
      types += Math.pow(2,i);
    }
  }
  return types;
}

function messageTypeArray(n){
  var messageTypes = [["-- --"],
                      ["No tablature in image"],
                      ["Too many errors"],
                      ["Symbols illegible"],
                      ["Handwritten correction"],
                      ["Graphic too faint"],
                      ["Could not edit symbol"],
                      ["Could not add symbol"]];
  for(var i=messageTypes.length -1; i>=0; i--){
    if(n>=Math.pow(2, i)){
      n -=Math.pow(2, i);
      messageTypes[i].push(true);
    } else {
      messageTypes[i].push(false);
    }
  }
  return messageTypes;
}

function messageSelectOptions(n){
  var messageTypes = messageTypeArray(n);
  var optionarray = [];
  for(var i=0; i<messageTypes.length; i++){
    optionarray.push(DOMOption(i, i, messageTypes[i][0], messageTypes[i][1]));
  }
  return optionarray;
}

var curUser = false;
var myObj = false;
var saved = true;
var resync = false;
function User(name, password){
  this.name = name;
  this.password = password;
  this.assignments = false;
  this.getDBAssignments = function(){
    // if user name and password aren't in database, this will set
    // assignments as false
    myObj = this;
    $.ajax({
      type: 'POST',
      async: false,
      url: "db.php",
      datatype: 'json',
      data: {"username": this.name,
             "password": this.password,
             "agent": window.navigator.userAgent},
      contentType: "application/x-www-form-urlencoded;charset=UTF-8",
      failure: function(){
        alert("Assignment fetch failed");
      },
      success: function(data){
        myObj.assignments = JSON.parse(data);
        if(!curParams || myObj.getAssignmentById(curParams.id).state==2){
          for(var i=0; i<myObj.assignments.length; i++){
            if(myObj.assignments[i].state <2){
              edit(myObj.assignments[i]);
              break;
            }
          }
        }
        // myObj.hideAssignments();
      }});
  };
  this.refreshAssignments = function (){
    this.getDBAssignments();
  };
  this.getAssignmentById = function(id){
    for(var i=0; i<this.assignments.length; i++){
      if(this.assignments[i].id == id){
        return this.assignments[i];
      }
    }
    return false;
  };
  this.dbSynchronise = function(doc, submit){
    var params = doc.parameters;
    var id = params.id;
    var code = doc.code;
    var history = JSON.stringify(params.history);
    var assignment = this.getAssignmentById(id);
    if(resync) {
      // If we've got a timeout scheduled to resync, stop it now
      window.clearTimeout(resync);
      resync = false;
    }
    if(assignment.tabcode == code && !submit){
      return;
    }
    $("#statuslamp").removeClass("lampsaved");
    $("#statuslamp").addClass("lampunsaved");
    assignment.tabcode = code;
    $.ajax({
      type: 'POST',
      async: true,
      url: "db.php",
      // datatype: 'json',
      data: {"username": this.name,
             "password": this.password,
             "id": id,
             "tabcode": code,
             "duration": params.contextDur,
             "tuning": params.contextTuning,
             "font": params.fontName,
             "tabtype": params.tabType,
             "finalFlag": doc.finalFlag,
             "history": history,
             "state": submit ? 2 : assignment.state,
             "submit": submit},
      contentType: "application/x-www-form-urlencoded;charset=UTF-8",
      failure: function(){
        saved = false;
        resync = window.setTimeout(dbSynchronise, 300);
        alert("reconnecting...");
      },
      success: function(data){
        saved = true;
        $("#statuslamp").removeClass("lampunsaved");
        $("#statuslamp").addClass("lampsaved");
        if(submit) {
          curUser.refreshAssignments();
        }
      }});
    if(submit) alert("Saving corrections. Please note: this may take a little while...");
  };
  this.commitMessage = function(id, types, message){
    $.ajax({
      type: 'POST',
      async: true,
      url: "db.php",
      data: {"username": this.name,
             "password": this.password,
             "id": id,
             "message": message,
             "messageType": types},
      contentType: "application/x-www-form-urlencoded;charset=UTF-8",
      failure: function(){
        alert("Message not saved");
      },
      success: function(){
        return;
      }
    });
  };
  this.changePwd=function(){
    if(document.getElementById('pwd').value == this.password){
      if(document.getElementById('pwd2').value == document.getElementById('pwd3').value){
        if(document.getElementById('pwd2').value.length){
          $.ajax({
            type: 'POST',
            async: true,
            url: "db.php",
            data: {"username": this.name,
                   "password": this.password,
                   "newpassword": document.getElementById('pwd2').value},
            contentType: "application/x-www-form-urlencoded;charset=UTF-8",
            failure: function(){
              saved = false;
            },
            success: function(data){
              saved = true;
            }
          });
          $(document.getElementById('pchange')).hide();
          if(document.getElementById('showpwd')) {
            $(document.getElementById('showpwd')).show();
          } else {
            document.getElementById('changepwdbutton').disabled=false;
          }
        } else {
          alert("Please enter a new password");
        }
      } else {
        alert("New passwords are different. Please retype them.");
      }
    } else {
      // Not really forgotten -- probably mistyped
      alert("Incorrect password entered. If you have forgotten your password, please contact administrators.");
    }
  };
  this.nextAssignmentFn = function(backn){
    for(var i=backn; i<this.assignments.length; i++){
      if(this.assignments[i].id == curParams.id){
        return function(assign){
          return function() {edit(assign);};
        }(this.assignments[i-backn]);
      }
    }
    return false;
  };
  this.prevAssignmentFn = function(forwardn){
    for(var i=0; i<this.assignments.length-forwardn; i++){
      if(this.assignments[i].id == curParams.id){
        return function(assign){
          return function() {edit(assign);};
        }(this.assignments[i+forwardn]);
      }
    }
    return false;
  };
  this.latest = function(){
    if(this.assignments[0].id != curParams.id){
      return function(a){
        return function(){edit(a);};
      } (this.assignments[0]);
    }
    return false;
  };
  this.earliest = function(){
    if(this.assignments[this.assignments.length-1].id != curParams.id){
            return function(a){
        return function(){edit(a);};
      } (this.assignments[this.assignments.length-1]);
    }
    return false;
  };
  this.refreshAssignments();
}

function logIn(){
  if(!$("#login").length) {
    var logInDiv = DOMDiv("login", "login", DOMTextEl("h2", false, false, "Log in to help edit the Electronic Corpus of Lute Music’s new acquisitions"));
    logInDiv.appendChild(DOMDiv("msg", "logmsg", false));
    var inputs = DOMDiv("inputs", "inputs", DOMTextInput("User", "User", "Username"));
    inputs.appendChild(DOMPasswordInput("Password", "Password", "password"));
    logInDiv.appendChild(inputs);
    logInDiv.appendChild(DOMButton("LoginOK", "LoginOK", "Ok", logFromForm));
    logInDiv.appendChild(DOMButton("LoginCancel", "LoginCancel", "Cancel", cancelForm));
    document.body.appendChild(logInDiv);
    $('.Password, .User').keyup(checkConfirm);
  }
}

function checkConfirm (e){
  if(e.which ==13){
    logFromForm();
  };
}

function logFromForm(){
  var uname = document.getElementById('User').value;
  var pword = document.getElementById('Password').value;
  var newUser = new User(uname, pword);
  if(newUser.assignments.length){
    curUser = newUser;
    if($(document.getElementById('browse')).is(':visible')){
      updateNavButtons();
    } else if(curUser.assignments.length > 1){
      $(document.getElementById('viewprevbutton')).show();
    } else {
      $(document.getElementById('viewprevbutton')).hide();
    }
    $("#login").remove();
    if(document.getElementById("user")) document.getElementById("user").innerHTML=curUser.name;
  } else {
    $("#logmsg").html("The username or password has not been recognised");
  }
}

function cancelForm(){
  $("#login").remove();  
}

function viewCurAssignments(){
  curUser.showAssignments();
}

function dbSynchronise(){
  curUser.dbSynchronise(TabCodeDocument, 0);
}

function dbSubmit(){
  curUser.dbSynchronise(TabCodeDocument, 1);
//  curUser.refreshAssignments();
}

function edit(a){
  // curParams = new Parameters(a.imageurl, a.tabcode, a.contextDur, a.contextTuning, 
  //   a.tabType, a.fontName, new History());
  curParams = new Parameters(a.imageURL, a.tabcode, a.contextDur, a.contextTuning, 
    a.tabType, a.fontName, new History());
  curParams.id = a.id;
  var infostring = "";
  if(a.num) {
    curParams.number = a.num;
    infostring += "No. "+a.num;
  }
  if(a.allocated && format_mysqldate(a.allocated)) {
    curParams.allocated = a.allocated;
    infostring += " <span id='allocated' class='dates'>allocated "+format_mysqldate(a.allocated)+"</span>";
  }
  if(a.submitted && format_mysqldate(a.submitted)) {
    curParams.submitted = a.submitted;
    infostring += " <span id='submitted' class='dates'> and <span>submitted "+format_mysqldate(a.submitted)+"</span></span>";
  } else if (a.state<2) {
    infostring += " <span class='unsubmitted'>not yet submitted.</class>";
  }
  if(a.edited && format_mysqldate(a.edited)) curParams.edited = a.edited;
  if(a.submitted) curParams.submitted = a.submitted;
  if(a.message) curParams.message = a.message;
  if(a.messageType) curParams.messageType = a.messageType;
  if(a.history){
    curParams.history = importHistory(a.history);
  }
  if(a.state>2){
    // It's being collated
    alert("Editing of this edition is no longer possible as the text is now "
        + "with the core editorial tema for collation");
    document.getElementById("Submit").disabled = true;
  } else if(a.state == 2) {
    document.getElementById("Submit").disabled = true;
  } else {
    document.getElementById("Submit").disabled = false;
  }
  document.getElementById("assignment").innerHTML = infostring;
//  Extract = Example;
  if($(document.getElementById('browse')).is(':visible')){
    updateNavButtons();
  } else if(curUser && curUser.assignments.length > 1){
    $(document.getElementById('viewprevbutton')).show();
  } else {
    $(document.getElementById('viewprevbutton')).hide();
  }

  initialisePage2();
//  $("#assignmentsbutton").click(viewCurAssignments);
}

function updateNavButtons(){
  var naf = curUser.nextAssignmentFn(1);
  var paf = curUser.prevAssignmentFn(1);
  var lf = curUser.latest();
  var ef = curUser.earliest();
  if(ef) {
    document.getElementById('firstass').disabled = false;
    document.getElementById('firstass').onclick = ef;
  } else {
    document.getElementById('firstass').disabled = true;
  }
  if(lf) {
    document.getElementById('latestass').disabled = false;
    document.getElementById('latestass').onclick = lf;
  } else {
    document.getElementById('latestass').disabled = true;
  }
  if(paf) {
    document.getElementById('prevass').disabled = false;
    document.getElementById('prevass').onclick = paf;
  } else {
    document.getElementById('prevass').disabled = true;
  }
  if(naf) {
    document.getElementById('nextass').disabled = false;
    document.getElementById('nextass').onclick = naf;
  } else {
    document.getElementById('nextass').disabled = true;
  }
}

function basepathname(imageURL){
  return imageURL.substring(0, imageURL.lastIndexOf("/"));
}

function facename(imageURL){
  var shorter = imageURL.substring(0, imageURL.lastIndexOf("/out/"));
  return shorter.substring(shorter.lastIndexOf("/")+1);
}

function curSysNo(){
  // FIXME: should just keep all the sys info...
  // FIXME: depends on nice path names -- not something we've guaranteed
  var imageURL = curParams.imageURL;
  return parseInt(imageURL.substring(imageURL.lastIndexOf("system")+6))-1;
}








/****Added by TC for loading individual systems via querystring in url***/
// NB Code suggested in email from DL 2 July 2012
function GETParameters(){
  var vars = new Querystring().params;
  if(!vars) return false;
  if(vars.browse){
   return browse(vars);
  } else if(vars.batch && vars.name && vars.system){
    var basepath = "../output/"+vars.batch+"/"+vars.batch+"_"+vars.name+"/out/system"+vars.system;
    if(vars.color)
       return new Parameters(basepath+".png", file_get_contents(basepath+".tc"), 
         "Q", ren_G, "Italian", "Varietie", new History());
   else
      return new Parameters(basepath+"_gray.png", file_get_contents(basepath+".tc"), 
        "Q", ren_G, "Italian", "Varietie", new History());
  } else if(vars.batch && vars.no && vars.part && vars.system){
    if(vars.part=="a"){
      nextpage = window.location.search.replace("part=a", "part=b");
      prevpage = window.location.search.replace("part=a", "part=b")
        .replace("num="+vars.no, "num="+threeWide(Number(vars.no)-1));
    } else {
      prevpage = window.location.search.replace("part=b", "part=a");
      nextpage = window.location.search.replace("part=b", "part=a")
        .replace("num="+vars.no, "num="+threeWide(Number(vars.no)+1));
    }
    var basepath = "../output/"+vars.batch+"/"+vars.batch+"_"+vars.no+"_part_"+vars.part+"/out/system"+vars.system;
    if(vars.color)
       return new Parameters(basepath+".png", file_get_contents(basepath+".tc"), "Q", ren_G, "Italian", "Varietie", new History());
    else
      return new Parameters(basepath+"_gray.png", file_get_contents(basepath+".tc"), "Q", ren_G, "Italian", "Varietie", new History());
  } else if (vars.imageURL && vars.tabcode){
    return new Parameters(vars.imageURL, vars.tabcode, vars.contextDur, vars.contextTuning, vars.tabType, vars.fontName, new History());
  } else {
    return false;
  }
}

function threeWide(n){
  if(n>99){
    return n+"";
  } else if(n>9){
    return "0"+""+n;
  } else {
    return "00"+""+n;
  }
}

// This alternative code might be more robust:

/* Client-side access to querystring name=value pairs
Version 1.3 28 May 2008
License (Simplified BSD): http://adamv.com/dev/javascript/qslicense.txt
*/
function Querystring(qs) { // optionally pass a querystring to parse
  this.params = {};
  if (qs == null) qs = location.search.substring(1, location.search.length);
  if (qs.length == 0) return;
  // Turn <plus> back to <space>
  // See: http://www.w3.org/TR/REC-html40/interact/forms.html#h-17.13.4.1
  qs = qs.replace(/\+/g, ' ');
  var args = qs.split('&'); // parse out name/value pairs separated via &
  // split out each name=value pair
  for (var i = 0; i < args.length; i++) {
    var pair = args[i].split('=');
    var name = decodeURIComponent(pair[0]);
    var value = (pair.length==2)
      ? decodeURIComponent(pair[1])
      : name;
    this.params[name] = value;
  }
}
Querystring.prototype.get = function(key, default_) {
  var value = this.params[key];
  return (value != null) ? value : default_;
};
Querystring.prototype.contains = function(key) {
  var value = this.params[key];
  return (value != null);
};

var p;
var dd;
var d;
function browse(vars){
  $.ajax({type: 'POST',
          async: false,
          url: "browse.php",
          datatype: 'json',
          data: {"source": vars.batch,
                 "page": vars.no,
                 "part": vars.part,
                 "colour": (typeof(vars.color)=="undefined" ? 0 : 1),
                 "system": vars.system},
          contentType: "application/x-www-form-urlencoded; charset=UTF-8",
          failure: function(){
            alert("Failed to fetch data due to a server error");
          },
          success: function(data){
            dd = data;
            d = JSON.parse(data);
            nextpage = d.nexturl;
            prevpage = d.prevurl;
            p = new Parameters(d.imageurl, d.tabcode, d.contextDur, 
              d.contextTuning, d.tabType, d.fontName, new History());
          }
  });
  return p;
}
