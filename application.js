var log;

function checkuname(){
  var uname=document.getElementById("un").value;
  var val = false;
  $.ajax({
    type: 'POST',
    async: false,
    url: "admin.php",
    datatype: 'json',
    data: {"username": uname,
           "check": true},
    contentType: "application/x-www-form-urlencoded;charset=UTF-8",
    failure: function(){
      log="can't connect";
    },
    success: function(data){
      if(data==0){
        // no match;
        document.getElementById("unmessage").innerHTML="";
      } else {
        document.getElementById("unmessage").innerHTML="This username is unavailable.";
      }
    }
  });
}

function submitUser(uname, fname, c, em, pwd){
  $.ajax({
    type: 'POST',
    async: false,
    url: "admin.php",
    datatype: 'json',
    data: {"username": uname,
           "password": pwd,
           "fullname": fname,
           "country": c,
           "e-mail": em,
           "apply": true},
    contentType: "application/x-www-form-urlencoded;charset=UTF-8",
    failure: function(){
      log="can't connect";
    },
    success: function(data){
      var browsercheck="";
      if($.browser.msie && parseInt($.browser.version)<9){
        browsercheck = " Please be warned -- the browser you are using at \
the moment is too old to support the editing software. If you intend to \
use this computer for your editing, please consider either updating Internet\
Explorer or using Firefox, Safari or Chrome for your editing.";
      } else if ($.browser.mozilla && parseInt($.browser.version)<4){
        browsercheck = "You are using an old version of Firefox, and some \
parts of the ECOLM editing software may not work well with it. You may need to \
upgrade before you can edit on the ECOLM website.";
      } else if ($.browser.mozilla && parseInt($.browser.version)>13){
        browsercheck = " Your current browser software should be fine for editing tabcode.";
      }
      alert("Your request has been sent. Your new account will be confirmed by\
 e-mail shortly."+browsercheck);
      clearForm();
    }
  });  
}

function clearForm(){
 document.getElementById("un").value = '';
 document.getElementById("fn").value = '';
 document.getElementById("c").value = '';
 document.getElementById("em").value = '';
 document.getElementById("pwd").value = '';
 document.getElementById("pwd2").value = '';
}

function submit(){
  var vals = [];
  var uname=document.getElementById("un").value;
  var fname=document.getElementById("fn").value;
  var c=document.getElementById("c").value;
  var em=document.getElementById("em").value;
  var pwd=document.getElementById("pwd").value;
  var pwd2=document.getElementById("pwd2").value;
  var missing=[];
  var matches=false;
  if(!uname) missing.push("username");
  if(!fname) missing.push("full name");
  if(!c) missing.push("country");
  if(!em) missing.push("e-mail");
  if(!pwd) missing.push("password");
  if(!pwd2) missing.push("password");
  if(pwd==pwd2) matches=true;
  if(!missing.length & matches){
    checkuname();
    if(document.getElementById("unmessage").innerHTML=="") submitUser(uname, fname, c, em, pwd);
  } else if(!missing.length){
    alert("The two password fields do not match. Please retype and try again");
  } else if(missing.length==1){
    alert("Please supply the missing information about your "+missing[0]+
          (pwd && pwd2 && !matches ? ", and ensure that both password fields contain the same password" : "."));
  } else {
    var error="Please complete the following empty fields -- ";
    for(var m=0; m<missing.length; m++){
      if(m<missing.length-2){
        error+=missing[m]+", ";
      } else if (m==missing.length-2){
        error+=missing[m]+" and ";
      } else {
        error+=missing[m]+".";
      }
    }
    if(pwd && pwd2 && !matches) error += " You will also need to retype the password "
      + "fields - they must contain the same value.";
    alert(error);
  }
}
