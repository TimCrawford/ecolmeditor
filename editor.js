//var curParams;
var blockassignmentsdiv = true;
function basicwidth(){
  return 950;
//  return Math.max(parseInt(TabCodeDocument.SVG.style.width), 700);
}
function parseTCDoc(TC){
  curBeams = 0;
  if(TabCodeDocument){
    TabCodeDocument = new Tablature(TC, node ? false : document.getElementById('notation'), 
      curParams);
  } else {
    TabCodeDocument = new Tablature(TC, node ? false : document.getElementById('notation'), 
      curParams);
  }
  TabCodeDocument.draw();
  updatePage();
}
function updatePage(){
  if(node) return;
  // document.getElementById("background").style.width = TabCodeDocument.SVG.style.width;
  if(document.getElementById("banner")){
    var w = basicwidth();
    document.getElementById("banner").style.width = w;
//    document.getElementById("systemimage").style.width = w;
    if(document.getElementById("topstuff")) document.getElementById("topstuff").style.width = w;
    if(document.getElementById("menubar")) document.getElementById("menubar").style.width = w;
    if(document.getElementById("settingsbar")) document.getElementById("settingsbar").style.width = w;
    if(document.getElementById("assignmentbar")) document.getElementById("assignmentbar").style.width = w;
    if(prevdiv) prevdiv.style.marginLeft = w - parseInt(prevdiv.style.width);
  }
  document.getElementById("rendered").style.width = basicwidth();
//  TabCodeDocument.makeMidi();
  if(editable){
    $(".editable .flag.rhythm").click(function(e){ 
                              rhythmFlagSelector(e.pageX, (e.pageY), $(this).data("word"));
                              return false;});
    $("#contextflag").click(function(e){ 
                              buttonBox(contextButtonSet(0,0,$(this).data("word")), e.pageX, (e.pageY), []);
                              return false;});
    $(".editable .tabnote.French").click(function(e){ 
                                 var word = $(this).data("word");
                                 frenchTabSelector(e.pageX, (e.pageY), word);
                                 return false;
                               });
    $(".editable .tabnote.Italian").click(function(e){ 
                                  var word = $(this).data("word");
                                  italianTabSelector(e.pageX, (e.pageY), word);
                                  return false;
                                });
    $(".pieceBreak").click(function(e){
                             var word = $(this).data("word");
                             breakSelector(e.pageX, (e.pageY), word);
                             return false;
                           });
    $(".editable .fingering, .editable .orn").click(function(e){
        var word = $(this).data("word");
        var orns = new ornamentbox(word);
        orns.draw(e.pageX, (e.pageY));
      });
    $(".barline").click(function(e){
      var word = $(this).data("word");
          buttonBox(barlineButtonSet(0,0,$(this).data("word")),
          e.pageX, (e.pageY), [deleteButton(0,0,word.starts, word.finishes, "barline")]);
      });
    $(".missingFret").click(function(e){
        var word = $(this).data("word");
        var course = $(this).data("course");
        var ins = word.insertionPoint(course);
        buttonBox(TabCodeDocument.parameters.tabType == "Italian"
                 ? italianTabSet([course, ins, false, false])
                 : frenchTabSet([course, ins, false, false]),
                e.pageX, (e.pageY), []);
        });
    $(".missingFlag").click(function(e){
      var word = $(this).data("word");
      var ins = word.starts;
      buttonBox(rhythmButtonSet(0, 0, [ins, false, false]),e.pageX, (e.pageY), []);
    });
    $(".missingChord").click(function(e){
      var prec = $(this).data("precedes");
      var ins = TabCodeDocument.code.length;// -1;
      if(prec<TabCodeDocument.TabWords.length){
        if(prec<TabCodeDocument.TabWords.length-1 && TabCodeDocument.TabWords[prec].tType==="Comment"){
          ins = TabCodeDocument.TabWords[prec+1].starts;
        } else if (prec==TabCodeDocument.TabWords.length-1 
                   && TabCodeDocument.TabWords[prec].tType==="Comment"){
          ins = TabCodeDocument.TabWords[prec].finishes + 1;
        } else {
          ins = TabCodeDocument.TabWords[prec].starts;          
        }
      } else {
        ins = TabCodeDocument.code.length;
      }
      var pos = $(this).data("pos");
      insertionButtons(TabCodeDocument.parameters.tabType, ins, pos,
        e.pageX, (e.pageY));
      });
    $(".tscomponent").click(function(e){
      var word = $(this).data("word");
      var i = $(this).data("i");
      var j = $(this).data("j");
      metricalModButtonBox(word, i, j, e.pageX, (e.pageY));
    });
    $(".missingTSC.above").click(function(e){
      var word = $(this).data("word");
      var i = $(this).data("i");
      metricalInsButtonBox(word, i, 0, "above", e.pageX, (e.pageY));
    });
    $(".missingTSC.below").click(function(e){
      var word = $(this).data("word");
      var i = $(this).data("i");
      metricalInsButtonBox(word, i, 0, "below", e.pageX, (e.pageY));
    });
    $(".missingTSC.before").click(function(e){
      var word = $(this).data("word");
      var i = $(this).data("i");
      metricalInsButtonBox(word, i, 0, "before", e.pageX, (e.pageY));
    });
    $(".missingTSC.after").click(function(e){
      var word = $(this).data("word");
      var i = $(this).data("i");
      metricalInsButtonBox(word, i, 0, "after", e.pageX, (e.pageY));
    });
    $(".beamelement").click(function(e){
      var word = $(this).data("word");
      var beamgroup = word.beamGroup;
      beamTable(e.pageX, (e.pageY), beamgroup);
    });
  }
}

function refresh() {
  if(TabCodeDocument){
    $(TabCodeDocument.SVG).empty();
  }
  if(document.getElementById('code') && document.getElementById('code').value.trim().length){
    parseTCDoc(document.getElementById('code').value);
    if(curUser){
      dbSynchronise();
    }
  }
//  parseTCDoc(document.getElementById('code').value);
}

function nextPage() {
	if (nextpage) window.location.href = nextpage+"&browse=1"; 
}

function prevPage() {
	if (prevpage) window.location.href = prevpage+"&browse=1";
}

function newInitialisePage(example){
  // FIXME: This is just for now...
  $(document.getElementById('tcspan')).hide();
  $(document.getElementById('pchange')).hide();
  $(document.getElementById('hideprevbutton')).hide();
  $(document.getElementById('browse')).hide();
  window.onbeforeunload = function(){
    if(resync){
      return "Not all your changes have been saved. "
             + "Press 'Cancel' to return to the page and wait or "
             + "'Ok' to continue. Clicking Ok may mean you have "
             + "to redo some or all of your editing next time you log in.";
    }
    return undefined;
  };
  curParams = GETParameters();
  if(!curParams){
    if(typeof(curUser)=='undefined' || !curUser) {
      logIn();
    } else {
      $("#assignmentsdiv").hide();
    }
  }
  if(curParams){
    initialisePage2();
  }  
}

function initialisePage(example){
  // FIXME: This is just for now...
  $(document.getElementById('tcspan')).hide();
  $(document.getElementById('pchange')).hide();
  curParams = GETParameters();
  if(!curParams){
    if(typeof(curUser)=='undefined' || !curUser) {
      logIn();
    } else {
      $("#assignmentsdiv").hide();
    }
  }
  if(curParams){
    initialisePage2();
  }
}

function initialisePage2(){
  if(node) return parseTCDoc(curParams.tabcode);;
  document.getElementById("code").value = curParams.tabcode;
  if(document.getElementById("systemimage")) document.getElementById("systemimage").src = curParams.imageURL;
  if(document.getElementById('preview')){
    var base = basepathname(curParams.imageURL);
    var face = facename(curParams.imageURL);
    previewinit(base+"/"+face+"_thumb.gif", base+"/"+face+".png", base+"/"+face+".staffs");
//    pageimg.src = base+"/"+face+".png";
//    document.getElementById('thumb').src = base+"/"+face+"_thumb.gif";
    // previmg.onload = function(){
    //   prevdiv.style.width=previmg.width;
    //   prevdiv.style.height=previmg.height;
    //   prevcan.style.width = previmg.width;
    //   prevcan.style.height = previmg.height;
    //   if(TabCodeDocument){
    //     prevdiv.style.marginLeft = basicwidth() - parseInt(prevdiv.style.width);
    //   }
    // };
  }
  //    document.getElementById("systemimage").height = 180;  
  if(document.getElementById("systemimage")) document.getElementById("systemimage").width = 900;
  if(document.getElementById(curParams.fontName)) document.getElementById(curParams.fontName).checked=true;
  if(document.getElementById(curParams.tabType)) document.getElementById(curParams.tabType).checked=true;
  parseTCDoc(curParams.tabcode);
  if(!nextpage) {
    $("#nextP").attr("disabled", true);
  }
  if(!prevpage)  {
    $("#prevP").attr("disabled", true);
  }  
}

function italianTabSelector(x, y, note){
  var set = italianTabSet(note);
  if(!note.extras) note.extras=[];
  var extras = [deleteButton(x, y, note.starts, note.starts+2+note.extras.length, "tabNote")];
  extras.push(deleteChordButton(x, y, note.chord.starts, note.chord.finishes, note.chord));
  extras.push(deleteToHereButton(x, y, TabCodeDocument.firstNonComment().starts, note.chord.finishes, note.chord));
  var course = note.chord.mainCourses.indexOf(note);
  var same;
  if(course>0 && !note.chord.mainCourses[course-1]){
    extras.push(ItUpCourse(note, course+1));
    same = ItUpCourseKeepPitch(note, course+1);
    if(same) extras.push(same); // Only if on fingerboard
  }
  if(course<5 && !note.chord.mainCourses[course+1]){
    extras.push(ItDownCourse(note, course+1));
    same = ItDownCourseKeepPitch(note, course+1);
    if(same) extras.push(same); // Only if on fingerboard
  }
  extras.push(textButton("OrnFing","orndialogue", function(note, x, y){
        return function() {
          var orns = new ornamentbox(note);
          orns.draw(x,y);
        };
      }(note, x, y), "Ornaments/Fingerings", false));
//  genericSelector(set, x, y, extras);
  buttonBox(set, x, y, extras);
}

function frenchTabSelector(x, y, note){
  var set = frenchTabSet(note);
  var extras = [deleteButton(x, y, note.starts, note.starts+2+note.extras.length, "tabNote")];
  extras.push(deleteChordButton(x, y, note.chord.starts, note.chord.finishes, note.chord));
  extras.push(deleteToHereButton(x, y, TabCodeDocument.firstNonComment().starts, note.chord.finishes, note.chord));
  var course = note.chord.mainCourses.indexOf(note);
  var same;
  if(course>0 && !note.chord.mainCourses[course-1]){
    extras.push(FrUpCourse(note, course+1));
    same = FrUpCourseKeepPitch(note, course+1);
    if(same) extras.push(same); // Only if on fingerboard
  }
  if(course<5 && !note.chord.mainCourses[course+1]){
    extras.push(FrDownCourse(note, course+1));
    same = FrDownCourseKeepPitch(note, course+1);
    if(same) extras.push(same); // Only if on fingerboard
  }
  extras.push(textButton("OrnFing","orndialogue", function(note, x, y){
        return function() {
          var orns = new ornamentbox(note);
          orns.draw(x,y);
        };
      }(note, x, y), "Ornaments/Fingerings", false));
  //  genericSelector(set, x, y, extras);
  buttonBox(set, x, y, extras);
}

function rhythmFlagSelector(x, y, chord, noBeams, noDelete){
  var set = rhythmButtonSet(x, y, chord);
  var extras = [];
  if(!Array.isArray(chord) && chord.dotted){
     //FIXME: Not robust
    extras.push(undotButton(x, y, document.getElementById('code').value.indexOf(".", chord.starts)));
  } else {
    extras.push(dotButton(x, y, chord.starts+1));
  }
  if(!noDelete){
    extras.push(deleteButton(x, y, chord.starts, chord.starts+((chord.dotted && 2)||1), "Flag"));
    extras.push(deleteChordButton(x, y, chord.starts, chord.finishes, chord));
    extras.push(deleteToHereButton(x, y, TabCodeDocument.firstNonComment().starts, chord.finishes, chord));
  }
  if(typeof(noBeams)=="undefined" || !noBeams){
    extras.push(beamifyButton(x, y, chord));
  }
//  genericSelector(set, x, y, extras);
  buttonBox(set, x, y, extras);
}
function tcShow(){
  if(document.getElementById('tcspan')){
    $(document.getElementById('tcspan')).show();
    document.getElementById('tcspan').style.width=Math.max(parseInt(TabCodeDocument.SVG.style.width), 600)+'px';
    $(document.getElementById('tcshow')).hide();
  }
}
function tcHide(){
  $(document.getElementById('tcspan')).hide(); 
  $(document.getElementById('tcshow')).show();
}
