var time;
Tablature.prototype.MP3Name = false;
Tablature.prototype.MP3play = function(){
  console.log("yay");
  if(!this.MP3Name){
    console.log("meh");
    refreshAudio();
  } else {
    console.log(this.MP3Name);
    MP3play(this.MP3Name);
  }
};
function eventArray(doc){
  var word, newEvents;
  var events = [];
  time = 0;
  ticksPerCrotchet = 192; // 64*3
  curTuning = doc.parameters.contextTuning;
  for(var i=0; i<doc.TabWords.length; i++){
    word = doc.TabWords[i];
    if(word.tType=="Chord"){
      newEvents = chordEvents(word);
      if(newEvents.length) events = events.concat(newEvents);
    }
  }
  return events;
}

function chordEvents(word){
  var events = [];
  var pitches = word.pitches();
  if(pitches && pitches.length){
    for(var i=0; i<pitches.length; i++){
      events.push([time, pitches[i], 1]);
    }
  }
  word.dur = false;
  time += word.duration();
  if(pitches && pitches.length){
    for(var i=0; i<pitches.length; i++){
      events.push([time, pitches[i], 0]);
    }
  }
  return events;
}

function refreshAudio(){
 var ea = eventArray(TabCodeDocument);
 console.log("wtf");
 playcount++;
 $.ajax({
    type: 'POST',
    async: true,
    url: '../midi.php',
    datatype: 'json',
    data: {"events": JSON.stringify(ea),
           "UID": uniqueID,
           "playcount": playcount,
           "tempo": tempo ? tempo :
             (document.getElementById('tempoSelect') ? 
              document.getElementById('tempoSelect').value :
              1),
           "ticks": ticksPerCrotchet},
    contentType: "application/x-www-form-urlencoded;charset=UTF-8",
    failure: function(){
      alert("I'm sorry, Dave, but I can't do that.");
    },
    error: function(a, b, c){
      console.log([a.statusText, b, c].join(" -- "));
    },
    success: function(returned){
//      if(!uniqueID){
        uniqueID = String(returned.substring(0,7));
        TabCodeDocument.MP3Name = uniqueID;
        MP3play(uniqueID);
//        uniqueID = returned;
//      }
    }
  });
}
