function firstParse(TC){
  var thing = {};
  var comments = [];
  var words = [];
  var word = false;
  var commentLevel = 0;
  var wordBegan = 0;
  var nextChar;
  for(var i=0; i<TC.length; i++){
    nextChar = TC.charAt(i);
    if(commentLevel==0 || (commentLevel == 1 && nextChar=="}")){
      switch(nextChar){
        case " ":
        case "\n":
        case "\r":
        case "\t":
          if(word){
            words.push([word, wordBegan, i]);
          }
          wordBegan = false;
          word = false;
          break;
        case "{":
          if(word){
            words.push([word, wordBegan, i]);
          }
          wordBegan = i;
          word = nextChar;
          commentLevel++;
          break;
        case "}":
          commentLevel--;
          word += nextChar;
          words.push([word, wordBegan, (i+1)]);
          comments.push(words.length-1);
          word=false;
          wordBegan=false;
          commentLevel=0;
          break;
        default:
          if(!word){
            wordBegan=i;
            word="";
          }
          word += nextChar;
          break;
      }
    } else {
      word += nextChar;
      if(nextChar=="{"){
        commentLevel++;
      } else if (nextChar=="}"){
        commentLevel--;
      }
    }
  }
  if(word){
    words.push([word, wordBegan, TC.length]);
  }
  thing.words = words;
  thing.comments = comments;
  return thing;
}

function doubleParse(TC){
  // This is less a parsing process than a two-step tokenisation --
  // tokens are dependent on parenthetical comments, so we need to
  // find those first. Then we can find comments with specific
  // meanings, such as pages and system breaks.
  // firstParse provides a list of tokens and a list of indices
  // pointing to which of those tokens are comments.
  var struct = firstParse(TC);
  struct.pages = [];
  struct.systems = [];
  var checking;
  for(var i=0; i<struct.comments.length;i++){
    if(pagep(struct.words[struct.comments[i]][0])) {
      struct.pages.push(struct.comments[i]);
    } else if (systemp(struct.words[struct.comments[i]][0])) {
      struct.systems.push(struct.comments[i]);
    }
  }
  return struct;
}

function Tablature(TC, SVG, parameters, doc, win){
  if(typeof(doc)!=="undefined" && doc) document  = doc;
  if(typeof(win)!=="undefined" && win) window = win;
  this.code = TC;
  this.SVG = SVG;
  this.parameters = parameters;
  this.noteEvents = [];
  this.starts = 0;
  this.finishes = TC.length;
  this.rules = [];
  this.TabWords = [];
  this.commentOffsets = [];
  this.pageOffsets = [];
  this.systemOffsets = [];
  this.tokens = [];
  this.barCount=1;
  
  this.systemCount=1;

	this.syscounts = new Array();
	this.totalsys = 1;
	this.maxwidths = new Array();
	this.maxwidth = 0;
  this.selections = [];
	this.pixHeight = 0;
	this.pixWidth = 0;
  this.finalFlag = false;
  this.colours = [];
  this.removes = [];
  this.duration = false;
  rule = false;
  if(!parameters) console.log("No parameters", TC);
  TabCodeDocument = this;
  // FIXME: Should this really be here?
  curBeamGroup = [];
  // FIXME: belongs this here?
  // svgCSS(this.SVG, "webeditor.css");
  if(this.SVG) svgCSS(this.SVG, "render.css");
  this.removeInvisibles = function(){
    if(this.removes.length){
      var mods = [];
      var start, end, from, to;
      for(var i=0; i<this.removes.length; i++){
        start = this.removes[i].starts;
        end = this.removes[i].starts+2+this.removes[i].TC.length;
        from = this.code.substring(start, end);
        mods.push([start, from, ""]);
      }
      this.parameters.history.add(new compoundModify(mods, document.getElementById('code'), "initialCleanup"));
    }
  };
  this.finishParse = function(){
    // Turn tokens into parsed tabwords
    var TabWord = false;
	var incrementBarNo = false;
    for(var i=0; i<this.tokens.length; i++){
      // We treat comments differently, but this code is inefficient
      // in a way that's only a problem if there are lots of comments
      if(this.commentOffsets.indexOf(i) == -1){
		    TabWord = parseTabWord(this.tokens[i][0],this.tokens[i][1],this.tokens[i][2]);
			  if(TabWord){
		      if(this.starts == false) {
				    this.starts = TabWord.starts;
				  }
          if(curTripletGroup && TabWord.tType==="Chord"){
            curTripletGroup.addMember(TabWord);
          }
				  this.finishes = TabWord.finishes;
          if(this.TabWords.length > 0) {
            
            if(TabWord.tType === "Chord") {
            	incrementBarNo = true;
            } else if (TabWord.tType === "Barline") {
            	if(incrementBarNo) {
					TabWord.barnumber = this.barCount++;
            	}
            	incrementBarNo = false;
            }
            
            if(TabWord.tType === "SystemBreak") {
            	TabWord.systemnumber = this.systemCount++;
            	this.TabWords.push(new SystemBreak(this.tokens[i]));
            }
            
            TabWord.prev = this.TabWords[this.TabWords.length-1];
            if(TabWord.prev.tType=="Chord"){
              TabWord.prev.nextStart = TabWord.starts;
            }
            TabWord.prev.next = TabWord;
          }
				  this.TabWords.push(TabWord);
          if(typeof(TabWord.flag != 'undefined') && TabWord.flag){
            this.finalFlag = TabWord.flag; // Needed for subsequent systems in db
          }
			  }
      } else if (this.pageOffsets.indexOf(i) != -1) {
		    this.TabWords.push(new PageBreak(this.tokens[i]));
		  } else if (this.systemOffsets.indexOf(i) != -1) {
		    this.TabWords.push(new SystemBreak(this.tokens[i]));
		  } else if (rulesp(this.tokens[i])){
        rule = new Ruleset(this.tokens[i], rule);
        if(i===0){
          this.parameters.update(rule);
        }
        this.rules.push(rule);
        this.TabWords.push(rule);
      } else if(tabxmlp(this.tokens[i])){
        if(!curApparatus){
          curApparatus = new Apparatus();
        }
        this.TabWords.push(new StructuredComment(this.tokens[i]));
      } else {
        // Yes, it really is just a plain comment
		    this.TabWords.push(new Comment(this.tokens[i]));
		  }
      if(curApparatus){
        curApparatus.add(this.TabWords[this.TabWords.length-1]);
      }
    }
  };
  this.fixWhitespaceNoninteractive = function(codeObj){
    var loc = this.code.search(/\s+$/);
    if(codeObj) var cursorPos = codeObj.selectionStart;
    if(loc===-1){
      this.code += " ";
      if(codeObj) {
        codeObj.value += " ";
        if(cursorPos) {
          codeObj.selectionStart = cursorPos;
          codeObj.selectionEnd = cursorPos;
        }
      }
    } else if(loc<this.code.length-1){
      this.code = this.code.substring(0, loc+1);
      if(codeObj) codeObj.value = this.code;
    }
  };
  this.initialParse = function(){
    // First, find tokens and comments
    //
    // STRUCTURE is an object with tokenised words, and indexes for
	  // comments, systems and pages. All it needs is for the tokens to
	  // be parsed.
    var structure = doubleParse(TC);
    this.pageOffset = structure.pages;
    this.systemOffsets = structure.systems;
    this.commentOffsets = structure.comments;
    this.tokens = structure.words;
    this.systemOffsets.push(this.finishes);
  };
  this.fixWhitespaceNoninteractive(typeof(document)!=='undefined' && document ? document.getElementById('code') : false);
  this.initialParse();
  this.finishParse();
  this.firstNonComment = function(){
    for(var i=0; i<this.TabWords.length; i++){
      if(this.TabWords[i].fType !=="Ruleset"
         && this.TabWords[i].tType !=="Comment"){
        return this.TabWords[i];
      }
    }
    return false;
  };
  this.drawStaffLines = function (y){
    var vpos = cury + verticalAdjust();
    for(var linei=0; linei<lines; linei++){
      svgLine(curStaves, 0, vpos, fill ? this.SVG.style.width : curx,
        vpos, "staffline", false);
      vpos+=ld;
    }
  };
  this.makeStaffDiv = function(){
    curStaves=svgGroup(this.SVG, "Staves", false, false);
  };
  this.addPlayButtons = function(){
    var parentEl = this.SVG.parentNode;
    if(!$(parentEl).hasClass("hasControls")) return;
    $(parentEl).find(".playback.control").remove();
    var playDiv = DOMDiv("playback control start", false, false);
    parentEl.appendChild(playDiv);
    $(playDiv).click(playOrStop);
    $(playDiv).data("doc", this);
    $(parentEl).mouseenter(function(){
                             $(this).find(".control").fadeIn();
                           });
    $(parentEl).mouseleave(function(){
                             $(this).find(".control").fadeOut();
                           });
  };
  this.getDuration = function(){
    if(this.duration) return this.duration;
    // FIXME: estimate only of duration
    var time = 0;
    var dur = 0;
    var curDur = FlagDur(this.parameters.contextDur)*ticksPerCrotchet;
    for(var i=0; i<this.TabWords.length; i++){
      dur = 0;
      if(this.TabWords[i].tType=="Chord") {
          dur = this.TabWords[i].duration();
          time += dur;
          this.duration = Math.max(time, this.duration);
      }
    }
    return this.duration;
  };
  this.draw = function(){
    if(!this.SVG) return;
    TabCodeDocument = this;
    $(this.SVG).empty();
    var offset = $(this.SVG).offset();
    var firstChord = true;
    cury = topMargin;
    curx = leftMargin;
    curTabType = this.parameters.tabType;
    curFontName = this.parameters.fontName;
    curTuning = this.parameters.contextTuning;
    curDur = FlagDur(this.parameters.contextDur)*ticksPerCrotchet;
    extraClasses = "";
    var time = 0;
    var chordCounter = 0;
    var dur;

//??
    this.systemnumber=1;

    this.leftishHack = this.SVG.getBoundingClientRect().left;
    this.makeStaffDiv();
    if(editable) drawInsertBox(curx, cury, -1, this.SVG);
    if (!this.SVG.style.width) this.SVG.style.width = "10px";
    this.addPlayButtons();
    $(this.SVG).data("doc", this);
    for(var i=0; i<this.TabWords.length; i++){
      dur = 0;
      switch(this.TabWords[i].tType){
        case "SystemBreak":

//??          
          this.systemnumber++;
//          svgText(TabCodeDocument.SVG, this.xpos + 20, this.ypos+5, "systemBreak", "sys_"+this.systemnumber.toString(), false, "&#U+23CE");
 //         svgText(TabCodeDocument.SVG, this.xpos + 20, this.ypos+20, "systemBreak", "sys_"+this.systemnumber.toString(), false, "U+23CE");
//          var el = svgRect(TabCodeDocument.SVG, this.xpos, this.ypos, 20, 20, "systemBreak", "sys_"+this.systemnumber.toString());
//     $(el).data("word", i);

//		drawSystemBreak(this.DOMObj, this.systemnumber, this.xpos, this.ypos);
		drawSystemBreak(this,i);

          
          if(breaks == "stop"){
            this.drawStaffLines();
            return;
          } else if(breaks && !parseInt(breaks, 10)){
            this.drawStaffLines();
            cury += advance();
            curx = leftMargin;
            this.makeStaffDiv(this.SVG);
            this.SVG.height.baseVal.newValueSpecifiedUnits(5,cury+advance());
		}

		var before = i-1;
		var b = this.TabWords[before];
//		logger.log("Starting at SystemBreak, thing before is a "+b.tType);
		var count = 0;
		while((typeof b !== "undefined") && (b.tType !== "Barline") && (b.tType !== "Chord") && (count <= 10)) {
			count++;
			if(typeof this.TabWords[before-1] !== "undefined") {
				before -= 1;
				b = this.TabWords[before];
//			logger.log("Now looking "+before+" before at a "+b.tType);
			}
		}
//		logger.log("Reached a "+b.tType);
		var this_bar = (b.barnumber+1);
//		var barnum_xoffset = 10;
		var barnum_xoffset = 24;
		if(b.tType !== "Chord") {
			if(typeof b.barnumber !== "undefined") {
				this.barnumber = b.barnumber;		  	
			}
			else this.barnumber = 0;
		if(b.tType === "Barline") {
			var	bar = document.getElementById("bar_"+this_bar);
				bar.setAttributeNS(null, "class", "barNumber terminalBarnumber");
				bar.setAttributeNS(null, "id", "");
			}
		}
		if(this.barnumber >= 9) barnum_xoffset = 15;
		if(this.barnumber >= 99) barnum_xoffset = 20;
		svgText(TabCodeDocument.SVG, curx-barnum_xoffset, cury+5, "systemBarNumber", "bar_"+this_bar.toString(), false, this_bar);

          break;
        case "PageBreak":
          if(breaks == "stop"){
            this.drawStaffLines();
            return;
          } else if(breaks && !parseInt(breaks, 10)){
            this.drawStaffLines();
            cury += advance();
            curx = leftMargin;
            this.makeStaffDiv(this.SVG);
            this.SVG.height.baseVal.newValueSpecifiedUnits(5,cury+advance());
          }
          break;
        case "StructuredComment":
          this.TabWords[i].draw();
        case "Comment":
          // Do nothing (this may make sense--do we want footnotes?)
          // FIXME: Hackhackhack -- this should be parsed as a separate class
          if(this.TabWords[i].comment == "{/}"){
            curx += ld;
            var breakg = svgGroup(this.SVG, "pieceBreak", false);
            $(breakg).data("word", this.TabWords[i]);
            drawBarline(breakg, curx, true, true);
            curx += 2*ld;
          }
          continue;
          break;
        case "Ruleset":
          // Hackhackhack
          if(this.TabWords[i].fontFamily()) curFontName = this.TabWords[i].fontFamily();
          break;
        case "Chord":
    		chordCounter++;
          if(firstChord && editable){
            firstChord = false;
            if(!(this.TabWords[i].flag || this.TabWords[i].lbeams)){
              // First chord has no explicit rhythm, so the context
              // chord is significant
              this.parameters.drawContextDur(this.SVG);
            }
          }
          this.TabWords[i].startTime = time;
          for(var seli=0; seli<this.selections.length; seli++){
            if(this.selections[seli].appliesToTime(time)){
              this.TabWords[i].selections.push(this.selections[seli]);
              this.selections[seli].chords.push(this.TabWords[i]);
            }
          }
          dur = this.TabWords[i].duration();
    
        default:
          this.TabWords[i].draw();
          if(hilite.includes(i)) {
          	this.TabWords[i].DOMObj.classList.toggle('matched');
          }
          if(this.TabWords[i].tripletGroup && this.TabWords[i].tripletGroup.lastp(this.TabWords[i])){
            this.TabWords[i].tripletGroup.draw();
          }
          time += dur;
          this.duration = Math.max(time, this.duration);
      }
     if((chordCounter>=selectedChord)&&(chordCounter<endChord+ng_len)) {
		hilite.push(i);
		if(hilite.length==1) {sel_window_scroll = cury;}
    }
     if(editable) drawInsertBox(curx, cury, i, this.SVG);
      if(breaks && parseInt(breaks, 10) && curx>=breaks && i<(this.TabWords.length-1)){
        this.drawStaffLines();
        cury += advance();
        curx = leftMargin;
        this.makeStaffDiv(this.SVG);
        this.SVG.height.baseVal.newValueSpecifiedUnits(5,cury+advance());
      }
      if(curx > this.SVG.getBBox().width) this.SVG.style.width = Math.ceil(curx+leftMargin+ld)+"px";
    }
    if(curx > this.SVG.getBBox().width) this.SVG.style.width = Math.ceil(curx+leftMargin+ld)+"px";
    if(fill){
      var l = $(".staffline");
      for(var k=0; k<l.length; k++){
        l[k].setAttributeNS(null, "x2", this.SVG.style.width);
      }
    }
    var of = fill;
    fill = false;
    this.drawStaffLines();
	$(".barNumber").hide();
	$(".systemBarNumber").hide();
	$(".terminalBarnumber").hide;  //never show them
    if(barNumInterval>0){
    	for(var b=0;b<this.barCount;b++) {
			if(b && ((b % barNumInterval) == 0)) {
				$("#bar_"+b).show();
			}
    	}
    }
	if(barNumInterval == -1) {
		$(".systemBarNumber").show();
	}

    fill = of;
    var words = TabCodeDocument.TabWords;
  };
  this.play = function(){
    if(!this.noteEvents.length) this.makeMidi();
    var track = new MidiTrack({events: this.noteEvents});
    var song = MidiWriter({tracks: [track]});
    song.save_small();
  };
	this.makeMidi = function() {
		this.noteEvents = new Array();
		curDur = this.parameters.defaultDur() * ticksPerCrotchet;
    var duration;
		for(var i=0; i<this.TabWords.length; i++){
			if(typeof(this.TabWords[i].duration) != "undefined") {
				duration = this.TabWords[i].duration();
				if(!duration) duration = 1;
				duration /= tempoFactor; //FIXME: Never do this in MIDI (GSHARP used to do this too :-/)
				this.loadChord(this.TabWords[i].pitches(), duration);
			}
		}
	};
  this.durationRatios = function(){
    this.rhythmRatios = new Array();
    curDur = this.parameters.devaultDur();
    var duration, nextDuration;
    for(var i=0; i<this.TabWords[i]; i++){
      if(typeof(this.TabWords[i].duration) != "undefined"){
        nextDuration = this.TabWords[i].duration();
        if(!nextDuration) nextDuration = 1;
        this.rhythmRatios.push(nextDuration / duration);
        duration = nextDuration;
      }
    }
    return this.rhythmRatios;
  };
  this.loadChord = function (pitches, duration) {
    if(pitches.length){
      // It's a chord
      // First add all note no events (without duration)
	    for (var i=0; i<pitches.length; i++) {
		    this.noteEvents.push(MidiEvent.noteOn(pitches[i]));
		  }
      // Then note offs...
	    // It's not at all clear to me why duration needs to be divided by
	    // the number of notes in the chord - maybe a bug in jsmidi.js? -
	    // but it seems to work ...
		  for (i=0; i<pitches.length; i++) {
		    this.noteEvents.push(MidiEvent.noteOff(pitches[i], i==0 ? duration : 0));
		  }
    } else {
      // It's a rest;
	    var note = new Object();
		  note.pitch = 0;
		  note.volume = 0;
		  this.noteEvents.push(MidiEvent.noteOn(note));
		  this.noteEvents.push(MidiEvent.noteOff(note, duration));
    }
  };
}

// function extendExtras(note, newChar){
//   // Adds fingerings, ornaments and other additional symbols to notes
//     note.TC += newChar;
//   var curchar;
// 	var extras = new Array();
// 	for(var i=0; i<note.TC.length; i++) {
// 		curchar = note.TC.charAt(i);
// 		if(curchar=="("){
// 			// This is a longhand ornament or fingering
// 			var code = "";
// 			while(curchar!=")") {
// 				i++;
// 				if(i >= note.TC.length) break;
// 				curchar = note.TC.charAt(i);
// 				code+=curchar;
// 			}
// 			var newExtra = ParseFullExtra(code);
// 			if(newExtra) {
// 				note.extras.push(newExtra);
// 			}
// 		} else if (curchar == ".") {
// 			// Fingering dots are a special case, because multiple
// 			// symbols make one piece of information (e.g. a3...)
// 			var count = 0;
// 			while(curchar=="."){
// 				count++;
// 				i++;
// 				if(i >= note.TC.length) break;
// 				curchar = note.TC.charAt(i);
// 			}
// 			note.extras.push(new dotFingering(count,7));
// 			// We've overshot now
// 			i--;
// 		} else {
// 			var newExtra = ShorthandExtra(curchar);
// 			if(newExtra)
// 				note.extras.push(newExtra);
// 		}
// 	}
// }

function parseTabWord(TC, start, finish){
  if(TC.length>0) {
    var firstchar = TC.charAt(0);
		if(firstchar.match(/[a-z]/)||firstchar=="X"||firstchar=="-"||firstchar=="."){
			// Chord without rhythm flag
			return FlaglessChord(TC, start, finish, curBeams);
		} else if (rhythmFlags.indexOf(firstchar)>-1){
			// Chord with flag
      curBeams = 0;
			return FlaggedChord(TC, start, finish, curBeams);
		} else if (firstchar=="[" || firstchar=="]") {
      if(TC.charAt(1)==="3"){
        // Editorial triplet
        return TripletChord(TC, start, finish);
      }
			// Explicitly-beamed chord
			return BeamedChord(TC, start, finish);
		} else if (firstchar === "M") {
			// Timesig
			return new Meter(TC, start, finish);
		} else if (firstchar === "3") {
			// Triplet. FIXME: ignore.
			return TripletChord(TC, start, finish);
		} else if (firstchar===":" || firstchar === "|") {
			return new Barline(TC, start, finish);
		} else {
			return false;
		}
	} else
		return false;
}

function BassChord(TC, flag, dotted, mainCourses, start, finish, lbeams, rbeams, rFinish, bstart){
  // We have almost all we need to build a Chord -- just parse the
  // bass courses
  var bassCourses = [false, false, false, false, false, false, false, false];
  var fret = false;
  var prev = false;
  for(var i=0; i<TC.length; i++){
    var nextchar = TC.charAt(i);
    if(/[a-z]/.test(nextchar)){
      // FIXME: I *think* that this is based on a count of slashes, but I
      // haven't checked
      if(prev || prev===0) {
        bassCourses[i-prev-1] = new bassNote(fret, TC.substring(prev, i), i-prev-1, bstart+i, false);
      }
      fret = nextchar;
      prev = i;
    } else if (/[1-9]/.test(nextchar)){
      //FIXME: CHECK -- this is old code, and seems wrong to me.
      //bassCourses[0] = new bassNote(nextchar, 0);
      bassCourses[nextchar] = new bassNote('a', TC.substring(prev, i), Number(nextchar), bstart+i, nextchar);
      break;
    }
  }
  if(fret) bassCourses[i-prev-1] = new bassNote(fret, TC.substring(prev, i), i-prev-1, false);
  return new Chord(flag, dotted, mainCourses, bassCourses, start, finish, lbeams, rbeams, rFinish);
}

function MainChord(TC, flag, dotted, start, finish, lbeams, rbeams, localStart, rFinish) {
  // We've got any rhythmic info we need, so now we parse
  // mainCourses.
	var mainCourses = [false, false, false, false, false, false];
	var curNote = false;
	var extras = "";
	var curchar;
	for(var maini=0; maini<TC.length; maini++) {
		curchar = TC.charAt(maini);
		if(maini!=TC.length - 1 &&
       ((tabletters.indexOf(curchar)>=0 && !isNaN(TC.charAt(maini+1)))
        ||
        (curchar == "-" && !isNaN(TC.charAt(maini+1))))) {
			// This is a fret/course pair
			var course = Number(TC.charAt(maini+1)) -1;
			curNote = new TabNote(curchar, "", maini+localStart, course);
      if(mainCourses[course]){
        // This means there's more than one fret symbol on the same course
        TabCodeDocument.removes.push(mainCourses[course]);
      }
			mainCourses[course] = curNote;
			maini++;
		} else if(TC.charAt(maini)=="X") {
			return BassChord(TC.substr(maini+1), flag, dotted, mainCourses, start, finish, lbeams, rbeams, rFinish, maini+1);
			break;
		} else if(curNote) {
      // Ornaments, fingerings, lines, etc.
      var ex = curNote.extras.length;
      curNote.extendExtras(curchar);
			// and to save us from parenthetical brokenness
			if(curchar=="(") {
				while(curchar!=")") {
          if(curNote.extras.length > ex) curNote.extras.pop();
					maini++;
					if(maini==TC.length) break;
					curchar = TC.charAt(maini);
					curNote.extendExtras(curchar);
				}
			}
		}
	}
	return new Chord(flag, dotted, mainCourses, [], start, finish, lbeams, rbeams, rFinish);
}

function makeTriplet(TC){
  curTripletGroup = new Triplet();
  if(TC.charAt(0)==="[") {
    curTripletGroup.editorial = true;
    TC = TC.substring(1);
  }
  var num = /^[0-9]+/.exec(TC);
  if(num){
    curTripletGroup.numerator = Number(num[0]);
    TC = TC.substring(num[0].length);
  }
  if(TC.charAt(0)==="]") TC = TC.substring(1);
  if(TC.charAt(0)==="("){
    TC = TC.substring(1);
    var den = /^[0-9]+/.exec(TC);
    if(den){
      curTripletGroup.denominator = Number(den[0]);
      TC = TC.substring(den[0].length);
    }
    if(rhythmFlags.indexOf(TC.charAt(0))>-1){
      curTripletGroup.unit = TC.charAt(0);
      TC = TC.substring(1);
    }
    if(TC.charAt(0)===")") TC = TC.substring(1);
  }
  return TC;
}

function TripletChord(TC, start, finish){
  TC = makeTriplet(TC);
  if(TC.length===0) return false;
  var firstchar = TC.charAt(0);
  if(firstchar.match(/[a-z]/)||firstchar=="X"||firstchar=="-"||firstchar=="."){
    return FlaglessChord(TC, start, finish, curBeams);
  } else if(firstchar==="[" || firstchar==="]"){
    return BeamedChord(TC, start, finish);
  } else if (rhythmFlags.indexOf(firstchar)>-1){
    return FlaggedChord(TC, start, finish, 0);
  }
  return false;
}

function FlaggedChord(TC, start, finish, lbeams){
  // If there are beams still open, then there is a mistake. Options are:
  //   * close them
  //   * allow them to go `through' the flag
  // Since this can only happen when there's an error, I'll do what's easiest.
	var flag = TC.charAt(0);
	if(TC.charAt(1)==="."){
		return MainChord(TC.substr(2), flag, true, start, finish, lbeams, lbeams, start+2, start+2);
	} else {
		return MainChord(TC.substr(1), flag, false, start, finish, lbeams, lbeams, start+1, start+1);
	}
}

function FlaglessChord(TC, start, finish, lbeams){
  if(TC.charAt(0)=="."){
    return MainChord(TC.substr(1), false, true, start, finish, lbeams, lbeams, start, start);
  } else {
    return MainChord(TC, false, false, start, finish, lbeams, lbeams, start, start);
  }
}


function BeamedChord(TC, start, finish){
  // lbeams must match previous note, but rbeams must be altered for
  // how many new beams start and old ones end. Partial beams are
  // assumed, I think, not to exist in tablature.
  var beaminfo = /^[\[\]]*/.exec(TC)[0];
  var opens = (beaminfo.split("[").length -1);
  var closes = (beaminfo.split("]").length - 1);
  var partial = opens > 0 && closes > 0;
  var lpartial = partial && beaminfo.indexOf("[") < beaminfo.indexOf("]");
  var lbeams = lpartial ? curBeams + opens : curBeams;
  if(partial){
    var rbeams = lpartial ? lbeams - closes : curBeams + opens;
  } else {
    var rbeams = curBeams + opens - closes;
  }
  // FIXME: hacky guess
  //var beamends = start+opens+closes;
  var beamends = start+beaminfo.length;
  curBeams += opens - closes;
  var dotPos = TC.indexOf(".");
//  if(dotPos!=-1 && dotPos<TC.search(/[a-z]/)) {
  if(dotPos!=-1 && dotPos<=(beaminfo.length+1)){
    // rhythmic dot
    return MainChord(TC, false, true, start, finish, lbeams, rbeams, start, beamends+1);
  } else {
    return MainChord(TC, false, false, start, finish, lbeams, rbeams, start, beamends);
  }
}

// function Parameters(imageURL, tabcode, contextDur, contextTuning, tabType, fontName){
//   this.imageURL = imageURL;
//   this.tabcode = tabcode;
//   this.contextDur = contextDur;
//   this.contextTuning = contextTuning;
//   this.tabType = tabType;
//   this.fontName = fontName;
//   this.defaultDur = function(){return FlagDur(contextDur);};
//   this.font = function(){
//     if(this.fontName == "Varietie"){
//       return fonts[0];
//     } else {
//       return fonts[1];
//     }
//   };
// 	this.fretFont = function() {
// 		if(this.tabType == "Italian") {
// 			// Normal numbers rather than a special font
// 			return fonts[2]; //FIXME: This is a non-free font
// 		} else {
// 			return this.font();
// 		}
// 	};
//     this.flagFont = function () {
// 		if(this.tabType == "French") {
// 			return this.font();
// 		} else {			// Flags are always drawn as varietie for Italian tabs
// 			return fonts[0];
// 		}
// 	};
// }
