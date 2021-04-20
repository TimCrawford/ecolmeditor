//var curParams;
var blockassignmentsdiv = true;

function basicwidth() {
  return 950;
  //  return Math.max(parseInt(TabCodeDocument.SVG.style.width), 700);
}

function parseTCDoc(TC) {
  curBeams = 0;
  if (TabCodeDocument) {
    TabCodeDocument = new Tablature(TC, node ? false : document.getElementById('notation'),
      curParams);
  }
  else {
    TabCodeDocument = new Tablature(TC, node ? false : document.getElementById('notation'),
      curParams);
  }
  TabCodeDocument.draw();
  updatePage();
}

var doubleclick=false;
var currKeyStroke=false;
var oldTop = 0;

function updatePage() {
  if (node) return;
  // document.getElementById("background").style.width = TabCodeDocument.SVG.style.width;
  if (document.getElementById("banner")) {
    var w = basicwidth();
    document.getElementById("banner").style.width = w;
    //    document.getElementById("systemimage").style.width = w;
    if (document.getElementById("topstuff")) document.getElementById("topstuff").style.width = w;
    if (document.getElementById("menubar")) document.getElementById("menubar").style.width = w;
    if (document.getElementById("settingsbar")) document.getElementById("settingsbar").style.width = w;
    if (document.getElementById("assignmentbar")) document.getElementById("assignmentbar").style.width = w;
    if (prevdiv) prevdiv.style.marginLeft = w - parseInt(prevdiv.style.width);
  }
  document.getElementById("rendered").style.width = basicwidth();

/*
  document.getElementById("editor").addEventListener('dblclick',(event) => {
//    logger.log('Double-clicked on '+word.fret+(word.course+1)+ 'at '+event.offsetX+' '+event.offsetY+' in editor pane!');
    doubleclick = true;
  });
  document.getElementById("editor").addEventListener('click',(event) => {
//    logger.log('Clicked on '+word.fret+(word.course+1)+ 'at '+event.offsetX+' '+event.offsetY+' in editor pane!');
    doubleclick = false;
  });
*/

  
  //  TabCodeDocument.makeMidi();
  if (editable) {
    $(".editable .flag.rhythm").click(function(e) {
      rhythmFlagSelector(e.pageX, (e.pageY), $(this).data("word"));
      return false;
    });
    $("#contextflag").click(function(e) {
      buttonBox(contextButtonSet(0, 0, $(this).data("word")), e.pageX, (e.pageY), []);
      return false;
    });
    $(".editable .tabnote.French").click(function(e) {
      doubleclick = true;
      var word = $(this).data("word");
      sel_note = word;
//      logger.log('Clicked on '+word.fret+(word.course+1)+ ' at '+e.offsetX+' '+e.offsetY+' in editor pane!');
      activeDialog = frenchTabSelector(e.pageX, (e.pageY), word);
//      logger.log(activeDialog)
//      frenchTabSelector(e.pageX, (e.pageY), word);
      getKeys(activeDialog);
    });

	$(".editable .tabnote.Italian").click(function(e) {
      doubleclick = true;
      var word = $(this).data("word");
      sel_note = word;
//      logger.log('Clicked on '+word.fret+(word.course+1)+ ' at '+e.offsetX+' '+e.offsetY+' in editor pane!');
      activeDialog = italianTabSelector(e.pageX, (e.pageY), word);
//      logger.log(activeDialog)
//      italianTabSelector(e.pageX, (e.pageY), word)
      getKeys(activeDialog);
    });

    $(".editable .bassgroup").click(function(e) {
      var word = $(this).data("word");
    //  logger.log(word)
      if(word.TC.length) logger.log('Clicked on bass course '+word.TC+ ' at '+e.offsetX+' '+e.offsetY+' in editor pane!');
      else logger.log('Clicked on bass number '+word.course+ ' at '+e.offsetX+' '+e.offsetY+' in editor pane!');
      if(this.querySelectorAll(".French").length) activeDialog = frenchTabSelector(e.pageX, (e.pageY), word);
      else activeDialog = italianTabSelector(e.pageX, (e.pageY), word);
      return false;
    });

    $(".pieceBreak").click(function(e) {
      var word = $(this).data("word");
      breakSelector(e.pageX, (e.pageY), word);
      return false;
    });
    $(".editable .fingering, .editable .orn").click(function(e) {
      var word = $(this).data("word");
      var orns = new ornamentbox(word);
      orns.draw(e.pageX, (e.pageY));
    });
    $(".barline").click(function(e) {
      var word = $(this).data("word");
      buttonBox(barlineButtonSet(0, 0, $(this).data("word")),
        e.pageX, (e.pageY), [deleteButton(0, 0, word.starts, word.finishes, "barline")]);
    });
    $(".missingFret").click(function(e) {
      var word = $(this).data("word");
      var course = $(this).data("course");
      var ins = word.insertionPoint(course);
      buttonBox(TabCodeDocument.parameters.tabType == "Italian" ?
        italianTabSet([course, ins, false, false]) :
        frenchTabSet([course, ins, false, false]),
        e.pageX, (e.pageY), []);
    });
    $(".missingFlag").click(function(e) {
      var word = $(this).data("word");
      var ins = word.starts;
      buttonBox(rhythmButtonSet(0, 0, [ins, false, false]), e.pageX, (e.pageY), []);
    });
    $(".missingChord").click(function(e) {
      var prec = $(this).data("precedes");
      var ins = TabCodeDocument.code.length; // -1;
      if (prec < TabCodeDocument.TabWords.length) {
        if (prec < TabCodeDocument.TabWords.length - 1 && TabCodeDocument.TabWords[prec].tType === "Comment") {
          ins = TabCodeDocument.TabWords[prec + 1].starts;
        }
        else if (prec == TabCodeDocument.TabWords.length - 1 &&
          TabCodeDocument.TabWords[prec].tType === "Comment") {
          ins = TabCodeDocument.TabWords[prec].finishes + 1;
        }
        else {
          ins = TabCodeDocument.TabWords[prec].starts;
        }
      }
      else {
        ins = TabCodeDocument.code.length;
      }
      var pos = $(this).data("pos");
      insertionButtons(TabCodeDocument.parameters.tabType, ins, pos,
        e.pageX, (e.pageY));
    });
    $(".tscomponent").click(function(e) {
      var word = $(this).data("word");
      var i = $(this).data("i");
      var j = $(this).data("j");
      metricalModButtonBox(word, i, j, e.pageX, (e.pageY));
    });
    $(".missingTSC.above").click(function(e) {
      var word = $(this).data("word");
      var i = $(this).data("i");
      metricalInsButtonBox(word, i, 0, "above", e.pageX, (e.pageY));
    });
    $(".missingTSC.below").click(function(e) {
      var word = $(this).data("word");
      var i = $(this).data("i");
      metricalInsButtonBox(word, i, 0, "below", e.pageX, (e.pageY));
    });
    $(".missingTSC.before").click(function(e) {
      var word = $(this).data("word");
      var i = $(this).data("i");
      metricalInsButtonBox(word, i, 0, "before", e.pageX, (e.pageY));
    });
    $(".missingTSC.after").click(function(e) {
      var word = $(this).data("word");
      var i = $(this).data("i");
      metricalInsButtonBox(word, i, 0, "after", e.pageX, (e.pageY));
    });
    $(".beamelement").click(function(e) {
      var word = $(this).data("word");
      var beamgroup = word.beamGroup;
      beamTable(e.pageX, (e.pageY), beamgroup);
    });
  }

document.getElementById("editor_container").scrollTop = oldTop;

}



// Deal with keystrokes for user-interaction in pane
let keysPressed = [];
var alpha = /[ A-Za-z]/;
var numeric = /[0-9]/; 
var alphanumeric = /[ A-Za-z0-9]/;
function getKeys() {
   document.addEventListener('keydown', keyhandler);
}
function keyhandler(event) {
   keysPressed[event.key] = true;
   if ((keysPressed['Control']||keysPressed['Meta']) && (event.key == '.')) {
	  logger.log(event.code +" [Cancelled!]");
	  releaseKeys();
	  clearButtons();
	  activeDialog = false;		  
   }
   else {
	var keyChar = String.fromCharCode(event.which || event.key)
	
	// experiment to test keystroke entry: needs doing properly!
/*	
	if(alphanumeric.test(keyChar)) {
	  var selected = false;
	  var prefix = false;
	  var suffix = false;
	  if(Array.isArray(sel_note)){
	    prefix = (note[2] && " ") || "";
	    suffix = (note[3] && " ") || "";
	  } else {
	    selected = letterPitch(sel_note.fret);
	  }
	  var tab_alpha="abcdefghjklmnop";
		if(selected) {
			if(curTabType=="Italian") {
				logger.log("Change tab number " 
					+ selected  +" to "+event.key 
					+ " on course "+ (sel_note.course + 1) 
					+ " (code offset " + sel_note.starts + ")");
				TabCodeDocument.parameters.history.add(new Modify(sel_note.starts, "abcdefghjklmnop"[selected], "abcdefghjklmnop"[event.key], code, "fret"));
			}
			else {
				logger.log("Change tab letter " 
					+ "abcdefghjklmnop"[selected] +" to "+event.key 
					+ " on course "+ (sel_note.course + 1) 
					+ " (code offset " + sel_note.starts + ")");
				TabCodeDocument.parameters.history.add(new Modify(sel_note.starts, "abcdefghjklmnop"[selected], event.key, code, "fret"));
			}
			clearButtons();
		  }
	}
	// end of keyboard entry experiment code
*/
   }
}
	
function releaseKeys() {
//   delete keysPressed[event.key];
   keysPressed.length = 0;
}

function refresh() {
  if (TabCodeDocument) {
    $(TabCodeDocument.SVG).empty();
  }
  if (document.getElementById('code') && document.getElementById('code').value.trim().length) {
    sel_window_scroll = cury;
    parseTCDoc(document.getElementById('code').value);
    if (curUser) {
      dbSynchronise();
    }
  }
  //  parseTCDoc(document.getElementById('code').value);
}

function nextPage() {
  if (nextpage) window.location.href = nextpage + "&browse=1";
}

function prevPage() {
  if (prevpage) window.location.href = prevpage + "&browse=1";
}

function newInitialisePage(example) {
  // FIXME: This is just for now...
  $(document.getElementById('tcspan')).hide();
  $(document.getElementById('pchange')).hide();
  $(document.getElementById('hideprevbutton')).hide();
  $(document.getElementById('browse')).hide();
  window.onbeforeunload = function() {
    if (resync) {
      return "Not all your changes have been saved. " +
        "Press 'Cancel' to return to the page and wait or " +
        "'Ok' to continue. Clicking Ok may mean you have " +
        "to redo some or all of your editing next time you log in.";
    }
    return undefined;
  };
  curParams = GETParameters();
  if (!curParams) {
    if (typeof(curUser) == 'undefined' || !curUser) {
      logIn();
    }
    else {
      $("#assignmentsdiv").hide();
    }
  }
  if (curParams) {
    initialisePage2();
  }
}

function initialisePage(example) {
  // FIXME: This is just for now...
  $(document.getElementById('tcspan')).hide();
  $(document.getElementById('pchange')).hide();
  curParams = GETParameters();
  if (!curParams) {
    if (typeof(curUser) == 'undefined' || !curUser) {
      logIn();
    }
    else {
      $("#assignmentsdiv").hide();
    }
  }
  if (curParams) {
    initialisePage2();
  }
}

function initialisePage2() {
  if (node) return parseTCDoc(curParams.tabcode);;
  document.getElementById("code").value = curParams.tabcode;
  if (document.getElementById("systemimage")) document.getElementById("systemimage").src = curParams.imageURL;
  if (document.getElementById('preview')) {
    var base = basepathname(curParams.imageURL);
    var face = facename(curParams.imageURL);
    previewinit(base + "/" + face + "_thumb.gif", base + "/" + face + ".png", base + "/" + face + ".staffs");
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
  if (document.getElementById("systemimage")) document.getElementById("systemimage").width = 900;
  if (document.getElementById(curParams.fontName)) document.getElementById(curParams.fontName).checked = true;
  if (document.getElementById(curParams.tabType)) document.getElementById(curParams.tabType).checked = true;
  parseTCDoc(curParams.tabcode);
  if (!nextpage) {
    $("#nextP").attr("disabled", true);
  }
  if (!prevpage) {
    $("#prevP").attr("disabled", true);
  }
}

function italianTabSelector(x, y, note) {
  var set = italianTabSet(note);
  if (!note.extras) note.extras = [];
  var extras = [deleteButton(x, y, note.starts, note.starts + 2 + note.extras.length, "tabNote")];
  extras.push(deleteChordButton(x, y, note.chord.starts, note.chord.finishes, note.chord));
//  extras.push(deleteToHereButton(x, y, TabCodeDocument.firstNonComment().starts, note.chord.finishes, note.chord));
  var course = note.chord.mainCourses.indexOf(note);
  var same;
  if (course > 0 && !note.chord.mainCourses[course - 1]) {
    extras.push(ItUpCourse(note, course + 1));
    same = ItUpCourseKeepPitch(note, course + 1);
    if (same) extras.push(same); // Only if on fingerboard
  }
  if (course < 5 && !note.chord.mainCourses[course + 1]) {
    extras.push(ItDownCourse(note, course + 1));
    same = ItDownCourseKeepPitch(note, course + 1);
    if (same) extras.push(same); // Only if on fingerboard
  }
  extras.push(textButton("OrnFing", "orndialogue", function(note, x, y) {
    return function() {
      var orns = new ornamentbox(note);
      orns.draw(x, y);
    };
  }(note, x, y), "Ornaments/Fingerings", false));
  //  genericSelector(set, x, y, extras);
  return buttonBox(set, x, y, extras);
}

function frenchTabSelector(x, y, note) {
  var set = frenchTabSet(note);
  var extras = [deleteButton(x, y, note.starts, note.starts + 2 + note.extras.length, "tabNote")];
  extras.push(deleteChordButton(x, y, note.chord.starts, note.chord.finishes, note.chord));
//  extras.push(deleteToHereButton(x, y, TabCodeDocument.firstNonComment().starts, note.chord.finishes, note.chord));
  var course = note.chord.mainCourses.indexOf(note);
  var same;
  if (course > 0 && !note.chord.mainCourses[course - 1]) {
    extras.push(FrUpCourse(note, course + 1));
    same = FrUpCourseKeepPitch(note, course + 1);
    if (same) extras.push(same); // Only if on fingerboard
  }
  if (course < 5 && !note.chord.mainCourses[course + 1]) {
    extras.push(FrDownCourse(note, course + 1));
    same = FrDownCourseKeepPitch(note, course + 1);
    if (same) extras.push(same); // Only if on fingerboard
  }
  extras.push(textButton("OrnFing", "orndialogue", function(note, x, y) {
    return function() {
      var orns = new ornamentbox(note);
      orns.draw(x, y);
    };
  }(note, x, y), "Ornaments/Fingerings", false));
  //  genericSelector(set, x, y, extras);
  return buttonBox(set, x, y, extras);
}

function rhythmFlagSelector(x, y, chord, noBeams, noDelete) {
  var set = rhythmButtonSet(x, y, chord);
  var extras = [];
  if (!Array.isArray(chord) && chord.dotted) {
    //FIXME: Not robust
    extras.push(undotButton(x, y, document.getElementById('code').value.indexOf(".", chord.starts)));
  }
  else {
    extras.push(dotButton(x, y, chord.starts + 1));
  }
  if (!noDelete) {
    extras.push(deleteButton(x, y, chord.starts, chord.starts + ((chord.dotted && 2) || 1), "Flag"));
    extras.push(deleteChordButton(x, y, chord.starts, chord.finishes, chord));
//    extras.push(deleteToHereButton(x, y, TabCodeDocument.firstNonComment().starts, chord.finishes, chord));
  }
  if (typeof(noBeams) == "undefined" || !noBeams) {
    extras.push(beamifyButton(x, y, chord));
  }
  //  genericSelector(set, x, y, extras);
  buttonBox(set, x, y, extras);
}

function tcShow() {
  if (document.getElementById('tcspan')) {
    $(document.getElementById('tcspan')).show();
    document.getElementById('tcspan').style.width = Math.max(parseInt(TabCodeDocument.SVG.style.width), 250) + 'px';
    $(document.getElementById('tcshow')).hide();
    $(document.getElementById('tchide')).show();
  }
}

function tcHide() {
  $(document.getElementById('tcspan')).hide();
  $(document.getElementById('tcshow')).show();
    $(document.getElementById('tchide')).hide();
}