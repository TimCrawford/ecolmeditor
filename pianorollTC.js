var events = [];
var tempo = false;
var legato_factor = 1.1;
var playing = false;
var thesoundfont = false;
var leadTime = 1;

function resumePlaying(){
//  jsPlay(false, false, this.wordi+1); // FIXME: add some time
  jsPlay(false, false, playing.wordi+1);
}
function pausePlaying(){
  window.clearTimeout(this.timeout);
  playing.timeout = false;
  jsStop();
}
function follow(){
  var doc = playing.doc;
  doc.TabWords[playing.wordi].DOMObj.classList.remove('playing');
  playing.wordi++;
  while(doc.TabWords.length>playing.wordi && doc.TabWords[playing.wordi].tType!=="Chord"){
    playing.wordi++;
  }
  if(doc.TabWords.length>playing.wordi){
    doc.TabWords[playing.wordi].DOMObj.classList.add('playing');
    var nextInterval = 1000*(doc.TabWords[playing.wordi].dur/64) / (3/2*playing.tempoFactor);
    var now = new Date().getTime();
    var prevError = playing.interval - (now - playing.now);
    playing.now = now;
    nextInterval += prevError;
    playing.interval = nextInterval;
    playing.timeout = window.setTimeout(follow, nextInterval);
  }
}

function Playing(){
  this.ctx = ctx;
  this.doc = false;
  this.wordi = false;
  this.timeout = false;
  this.now = 0;
  this.interval = 0;
  this.tempoFactor = 1;
  this.pause = pausePlaying;
  this.resume = resumePlaying;
}

function getTempo(){
  if(tempo){
    return tempo;
  } else if (document.getElementById('tempoSelect')){
    return document.getElementById('tempoSelect').value;
  } else return 1;
}
function getSoundfont(doc){
  if(document.getElementById('soundSelect')){
    return document.getElementById('soundSelect').value;
  } else if(doc.rules && doc.rules.length && doc.rules[0].isBaroque()){
    return "Bar_lute";
  } else {
    return "G_lute";
  }
}
// function eventList(){
//   events = [];
//   var tfactor = getTempo();
//   var curTuning = curParams.contextTuning;
//   for(var i=0; i<TabCodeDocument.TabWords.length; i++){
//     if(TabCodeDocument.TabWords[i].tType=="Chord"){
//       addChord(TabCodeDocument.TabWords[i].pitches(), TabCodeDocument.TabWords[i].dur / tfactor);
//     }
//   }
// }

// function addChord(pitches, duration){
//   if(pitches.length){
//     for(var i=0; i<pitches.length; i++){
//       events.push(MidiEvent.noteOn(pitches[i]));
//     }
//     for(i=0; i<pitches.length; i++){
//       events.push(MidiEvent.noteOff(pitches[i], i ? 0 : duration));
//     }    
//   } else {
//     // It's a rest
//     var note = {pitch: 0, volume: 0};
//     events.push(MidiEvent.noteOn(note));
//     events.push(MidiEvent.noteOff(note, duration));
//   }
// }

// function stopSound() {
// 	if(stopit=document.getElementById('playing'))
// 		stopit.parentNode.removeChild(stopit);
// }

// function playMIDI(){
//   console.log(JSON.stringify(eventArray(TabCodeDocument)));
//   eventList();
//   var track = new MidiTrack({ events: events });
// /*
//     //  Set instrument to selected sound  --- DOESN'T WORK OF COURSE!
//                 noteEvents.push(MidiEvent.program_change(25));
// */
//   var song  = MidiWriter({ tracks: [track] });
//       // song.playinto("MIDI");
//   // song.save_small();
//   stopSound();
//   song.play();
// }

// function MP3play(name) {
// 	var needed = false;
// 	if(!document.getElementById("mp3playing")) {
// 		var audioElement = document.createElement('audio');
// 		needed = true;
// 	}
// 	else {
// 		var audioElement = document.getElementById("mp3playing");
// 	}
// 	if(audioElement.canPlayType('audio/ogg')) {
// 		audioElement.setAttribute('src', '../midis/' + name + '_'+playcount+'.ogg');
// 	}
// 	else if(audioElement.canPlayType('audio/mp3')) {
// 		audioElement.setAttribute('src', '../midis/' + name + '_'+playcount+'.mp3');
// 	}
// 	audioElement.setAttribute("id", "mp3playing");
// 	audioElement.setAttribute('controls', 'true');
// 	audioElement.setAttribute('autoplay', 'true');
// 	audioElement.load();
// 	audioElement.addEventListener("canplay", function() { 
// 		audioElement.play(); 
// 	}, false);
// 	if(needed) {
// 		document.body.appendChild(audioElement);
// 	}
// }

function noteName(MIDIPitch){
  var oct = Math.max(0, Math.floor(MIDIPitch / 12) - 1);
  var pc = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'][MIDIPitch%12];
  return pc+oct;
}

var src = false;
function updateTempo(){
  // alert(Number(document.getElementById('tempoSlider').value) / 90);
  //if(src) src.playbackRate.value = Number(document.getElementById('tempoSlider').value) / 90;
  if(playing && playing.timeout && isPlaying()){
    playing.pause();
    leadTime = 0;
    window.setTimeout(playing.resume, 500);
  } 
}
function showTempoValue(value) {
  var out = document.getElementById('tempoReadOutvalue');
  if(out){
    if(!value){
      value = document.getElementById('tempoSlider').value;
    }
    var dispVal = value / 2;
    out.innerHTML = dispVal.toFixed(0);
  }
}
function getTempoFactorFromPage(){
  if(document.getElementById('tempoSlider')){
    return Number(document.getElementById('tempoSlider').value) / 90;
  } else if(document.getElementById('tempoSelect')) {
    return Number(document.getElementById('tempoSelect').value);
  } else return false;
  
}
function extraDurMain(course, index, words){
  // 
  var dur = 0;
  var max_extra_dur = 128;
  for(var i=index+1; i<words.length; i++){
    if(words[i].tType==="Chord"){
      if(words[i].mainCourses[course]) {
        return dur;
      }
      dur +=words[i].dur / 64;
      if(dur>=max_extra_dur){
        return max_extra_dur;
      }
    }
  }
  return dur;
}
function extraDurBass(course, index, words){
  // 
  var dur = 0;
  var max_extra_dur = 128;
  for(var i=index+1; i<words.length; i++){
    if(words[i].tType==="Chord"){
      if(words[i].bassCourses[course]) {
        return dur;
      }
      dur +=words[i].dur / 64;
      if(dur>=max_extra_dur){
        return max_extra_dur;
      }
    }
  }
  return dur;
}
function bufferChord(chord, t, instrument, wordi, words){
  var notes = chord.pitches();
  // Tab durations in this program use 1 as the tatum (i.e. demi-semi-hemi whatever), so ...
  var baseDur = (chord.dur / 64);
  // And this playback stuff is realtime, so we need to use tempo too...
  var tempoFactor = getTempoFactorFromPage() || 1;
  var dur = baseDur / (3 / 2 * tempoFactor);
  if(playing && !playing.timeout) {
    playing.tempoFactor = tempoFactor;
    playing.timeout = window.setTimeout(follow, 1000*(dur+0)); // Why not leadTime?
    playing.interval = 1000*(dur+0);
    chord.DOMObj.classList.add('playing');
  }
  for(var i=0; i<chord.mainCourses.length; i++){
    if(chord.mainCourses[i]){
      var pitch = chord.mainCourses[i].pitch(chord.tuning);
      if(pitch){
        var soundingDur = dur+(extraDurMain(i, wordi, words)/(3/2*tempoFactor));
        src = instrument.play(noteName(pitch), t,
                            soundingDur * legato_factor);
      }
    }
  }
  for(i=0; i<chord.bassCourses.length; i++){
    if(chord.bassCourses[i]){
      var pitch = chord.bassCourses[i].pitch(chord.tuning);
      if(pitch){
        var soundingDur = dur+(extraDurBass(i, wordi, words)/(3/2*tempoFactor));
        src = instrument.play(noteName(pitch), t,
                            soundingDur * legato_factor);
      }
    }
  }
  return t+dur;
}
var ctx = false;
var soundfont = false;
var instrument = false;
var AudioContext = window.AudioContext || window.webkitAudioContext;
function jsPlay(start, end, starti){
  if(ctx && ctx.close) {
    ctx.close();
    ctx = false;
  }
  ctx = new AudioContext();
  soundfont = new Soundfont(ctx);
  // instrument = soundfont.instrument('acoustic_guitar_nylon');
  thesoundfont = getSoundfont(TabCodeDocument);
  instrument = soundfont.instrument(thesoundfont+'/acoustic_grand_piano');
  curTuning = curParams.contextTuning;
  var words = TabCodeDocument.TabWords;
  var now = leadTime;
  var started = false;
  starti = starti || 0;
  instrument.onready(function(){
    playing=new Playing();
    playing.doc = TabCodeDocument;
    playing.now = new Date().getTime();
    $(".playing").each(function(){
                         this.classList.remove('playing');
    });
    for(var i=starti; i<words.length; i++){
      if(start && !started && start!==words[i]) continue;
      started = true;
      if(words[i].tType==="Chord"){
        if(!playing.wordi && playing.wordi!==0) playing.wordi = i;
        now = bufferChord(words[i], now, instrument, i, words);
      }
      if(end && end===words[i]) break;
    }
    TabCodeDocument.duration = (now-leadTime)*64;
    $(".playback.control").toggleClass("start", false);
    $(".playback.control").toggleClass("stop", true);  
    playingTimeout = setTimeout(switchControls, (now+leadTime)*1000);
  });
}
function resultMetadata(data){
  var parent = DOMSpan('metadata', false, false);
  if(data.ptitle) {
    parent.appendChild(DOMSpan('PieceTitle', false, data.ptitle));
    if(data.pieceAliases) parent.appendChild(DOMSpan('AlternativePieceTitle', false, 
                                                     " ("+data.pieceAliases+")"));
  }
 else {
    if(data.pieceAliases) {
      parent.appendChild(DOMSpan('PieceTitles', false, data.pieceAliases));
    } else parent.appendChild(DOMSpan('sn', false,'Untitled'));
  }
  if(data.stitle || data.shtitle || data.shelf || data.sourceAliases){
    parent.appendChild(document.createTextNode(" in "));
    if(data.shtitle){
      parent.appendChild(DOMSpan('SourceTitle', false, data.shtitle));
    } else if(data.stitle){
      parent.appendChild(DOMSpan('SourceTitle', false, data.stitle));
      if(data.ssubtitle){
        parent.appendChild(DOMSpan('SourceSubtitle', false, data.ssubtitle));
      }
    }
/*
    if(data.sourceAliases){
      parent.appendChild(DOMSpan('AlternativeSourceTitle', false, " ["+data.sourceAliases+"]"));
    }
    if(data.shelf){
      parent.appendChild(DOMSpan('Shelfmark', false, data.shelf));
    }
*/
  }
  return parent;
}
function resultTab(){
  var stuff = ECOLMStuff[Number(this.id)];
  var tc = stuff.data.Tabcode;
  $(".searchResult").toggleClass("clicked", false);
  $(this).parents(".searchResult").toggleClass("clicked", true);
  var otcd = TabCodeDocument;//This is *bad*
  var doc = new Tablature(tc, svg(650, 650), copyParams(TabCodeDocument.parameters));
  var svgDiv = document.getElementById('resultTab');
  $(svgDiv).show();
  var vectors = stuff.results[1];
  var exDur = 0;
  var start = 0;
  ECOLMStuff[Number(this.id)].tablature = doc;
  for(var i=0; i<vectors.length; i++){
    // start = vectors[i][0]/64; // I don't know why I don't need to convert this back
    //start = vectors[i][0];
    start = vectors[i][0]*4;// WHY??? WHY???
    doc.selections.push(new Selection(start, start+otcd.duration, ECOLMStuff.query, vectors[i][1]));
  }
  if(svgDiv){
    $(svgDiv).empty();
    var top = svgDiv.getBoundingClientRect().top;
    $(svgDiv).css("height", "calc(100% - "+(top+5)+"px");
    svgDiv.appendChild(doc.SVG);
    var oedit = editable;
    var old = ld;
    editable = false;
    ld = 8;
    var oldBreaks=breaks;
    breaks=650;
    doc.draw();
    breaks=oldBreaks;
    var matchwidth = doc.SVG.getBoundingClientRect().width;
    var querywidth = document.getElementById('notation').getBoundingClientRect().right;
    $(document.body).css("min-width", matchwidth+querywidth+25+"px");
    $("#codediv").css("width", querywidth+"px");
    $("#searchResults").css("width", "calc(100% - "+(10+matchwidth)+"px)");
    ld = old;
    editable = oedit;
    TabCodeDocument = otcd;
  }
}
function resultAjax(ID, domObj, resultsObj){
  var anchor = DOMAnchor('resultAnchor', false, "(DB entry)",
                             "http://doc.gold.ac.uk/isms/ecolm/database/?type=41&ID="+ID);
  anchor.target = "newwindow";
  if(resultsObj[ID] && resultsObj[ID].data) {
      var result = resultMetadata(resultsObj[ID].data);
      result.id = ID;
      domObj.appendChild(result);
      domObj.appendChild(anchor);
      $(result).click(resultTab);
      return;
  }
  $.ajax({
    type: 'POST',
    async: true,
    url: '../db.php',
    datatype: 'json',
    data: { lookup:   ID },
    contentType: "application/x-www-form-urlencoded;charset=UTF-8",
    failure: function(){
      logger.log("Retrieval failed for ECOLMID", ID);
    },
    success: function(data){
      if(!data) return;
      if(!resultsObj[ID]) resultsObj[ID] = {};
      resultsObj[ID].data=JSON.parse(data);
      var result = resultMetadata(resultsObj[ID].data);
      result.id = ID;
      domObj.appendChild(result);
      domObj.appendChild(anchor);
      $(result).click(resultTab);
    }
  });
}
function jsStop(){
  if(ctx) ctx.close();
  $(".playback.control").toggleClass("start", true);
  $(".playback.control").toggleClass("stop", false);
  if(playingTimeout){
    window.clearTimeout(playingTimeout);
    playingTimeout = false;    
  }
  if(playing && playing.timeout){
    window.clearTimeout(playing.timeout);
    playing.timeout = false;
  }
  ctx = false;
}
function switchControls(){
  $(".playback.control").toggleClass("start", true);
  $(".playback.control").toggleClass("stop", false);
  jsStop();
}
function resultDiagram(result){
  // Result is of the form index, hit count, vector list
  var id = result[0];
  var ribbon = DOMDiv('result-ribbon',  'result-ribbon-'+id, false);
  var pieceArray = corpusVectors.find(function(x){return x[0]==id});
  var pieceDur = pieceArray[2];
  var vectors = result[2];
  var queryDur = (TabCodeDocument.duration / 4) / pieceDur;
  for(var i=0; i<vectors.length; i++){
    var match = DOMDiv('result-block t'+vectors[i][0]+' p'+vectors[i][1]+' n'+i, 'result-block', false);
    var prop = Math.min(vectors[i][0]/pieceDur, 1);
    ribbon.appendChild(match);
    $(match).css('left', Math.floor(prop*100)+'%');
    $(match).css('width', Math.max(1, Math.floor(queryDur*100))+'%');
  }
  return ribbon;
}
function summariseResult(result){
  // Result is of the form index, hit count, vector list. For now, let's just list vectors.
  var vectors = result[2];
//  var intervals = ["a semitone", "a tone", "a minor third", "a third", "a fourth", "a tritone",
//                  "a fifth", "a minor sixth", "a sixth", "a minor seventh", "a seventh"];
  var intervals = ["s-tone", "tone", "min 3rd", "3rd", "4th", "aug 4th",
                  "5th", "min 6th", "6th", "min 7th", "7th"];
  var out = [];
  var id = result[0];
  var pieceArray = corpusVectors.find(function(x){return x[0]==id});
  var queryDur = TabCodeDocument.duration;
//  var targetNotes = corpusVectors[id][1].length;
//  var targetDur = (corpusVectors[id][1][targetNotes-1][0]);
  var targetNotes = pieceArray[1].length;
  var targetDur = pieceArray[2];
  for(var i=0; i<vectors.length; i++){
    var str = "";
    if(vectors[i][0]!=0){
   
//      str+= vectors[i][0]/32+" crotchets in";
//      str+= "[ID "+id+"] durations: "+(vectors[i][0])+"/"+(targetDur-(queryDur / 4))+" ("+Math.round(100*(vectors[i][0]/(targetDur-(queryDur / 4))))+"%)";
    }
    if(vectors[i][1]>0){
      str+=(str.length ? ", " : "")+"up "+intervals[(vectors[i][1] % 12)-1];
    } else if (vectors[i][1]<0){
      str+=(str.length ? ", " : "")+"down "+intervals[(Math.abs(vectors[i][1] % 12))-1];
    }
    if(str.length) out.push(str);
  }
  return out.length ? "("+out.join("; ")+")" : "";
}
function resultOut(num, result, max){
	var num;
//  return DOMSpan('resultStats', false, (num+1) + ") "+ Math.round(100*(result[1]/max))+"% "
//                +summariseResult(result));
//  return DOMSpan('resultStats', false, (num+1) + ") " + summariseResult(result));
  var span = DOMSpan('resultStats', false, summariseResult(result));
  return span;
}
var ECOLMStuff = {};
function corpusSearch(cutOff){
  if(TabCodeDocument){
    tcHide(); // make some screen space
    var needle = vectorizeTabCodeObject(TabCodeDocument, curParams.contextTuning);
    ECOLMStuff.query = needle;
    if(!cutOff) cutOff=Math.round(needle.length/2);
 cutOff = needle.length;
    var results = searchCorpusWithIDs(needle, corpusVectors, cutOff);
    var div = document.getElementById('searchResults');
    $(div).empty();
    $(div).show();
    var top = div.getBoundingClientRect().top;
    $(div).css("height", "calc(100% - "+(10+top)+"px");
    for(var i=0; i<results.length; i++){
      var sr = DOMDiv('searchResult', false, resultOut(i, results[i], needle.length));
	  var numspan = DOMSpan('resultNum', false, (i+1) + ") ");
	  sr.insertBefore(numspan, sr.firstChild);
      if(!ECOLMStuff[results[i][0]]) ECOLMStuff[results[i][0]] = {};
      ECOLMStuff[results[i][0]].results = [results[i][1], results[i][2]];
      resultAjax(results[i][0], sr, ECOLMStuff);
  sr.appendChild(resultDiagram(results[i]));
      div.appendChild(sr);
    }
  }
}
function Selection(start, finish, query, transposition){
  this.start = start;
  this.finish = finish;
  this.query = query;
  this.transposition = transposition;
  this.chords = [];
  this.notes = [];
  this.translatedQuery = {};
  this.doc = TabCodeDocument;
  for(var i=0; i<this.query.length; i++){
    if(this.translatedQuery[this.query[i][0]*4+this.start]){
      this.translatedQuery[this.query[i][0]*4+this.start][this.query[i][1]+this.transposition] =true;
    } else {
      this.translatedQuery[this.query[i][0]*4+this.start]={};
      this.translatedQuery[this.query[i][0]*4+this.start][this.query[i][1]+this.transposition] =true;
    }
  };
  this.appliesToTime = function(time){
    return time>=this.start && time<this.finish;
  };
  this.appliesToNote = function(note, chord){
    var pitch = note.pitch(chord.tuning);
    if(this.translatedQuery[chord.startTime] && this.translatedQuery[chord.startTime][pitch]) {
      return true;
    } else { 
      return false;
    }
  };
  this.play = function(){
    var otcd = TabCodeDocument;
    TabCodeDocument = this.doc;
    jsPlay(this.chords[0], this.chords[this.chords.length -1]);
    TabCodeDocument = otcd;
  };
}
function playSelection(){
  var word = $(this).data("word");
  word.selections[0].play();
}
function playDoc(doc){
  var otcd = TabCodeDocument;
  TabCodeDocument = doc;
  jsPlay();
  TabCodeDocument = otcd;  
}
function playOrStop(){
  if(isPlaying()){
    jsStop();
  } else {
    playDoc($(this).data("doc"));
  }
}
var playingTimeout = false;
function isPlaying(){
  return playingTimeout;
}
function playOrResume(){
  if(playing && playing.wordi<playing.doc.TabWords.length){
    playing.resume();
  } else {
    jsPlay();
  }
}
function stopOrPause(){
  if(playing && playing.timeout){
    playing.pause();
  } else if(playing && playing.wordi){
    TabCodeDocument.TabWords[playing.wordi].DOMObj.classList.remove('playing');
    playing.wordi = 0;
  } else {
    jsStop();
  }
}
