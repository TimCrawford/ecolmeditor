/*
 JS code to extract topnote codestring from a TabCode file
 NB: THIS ONLY WORKS WITH TabCode OUTPUT FROM luteconv!!
 */

const debug = false;
const alphabet = "abcdefghijklmnopqrstuvwxyz"

// tc_path is where the TabCode file is stored on the server
// upbeat (Boolean): true means ignore first (incomplete) bar of music
// window: output pitches only when (time%window=0)
function getTopnoteCode(tc_path, upbeat, window) {
  var tc_arr = [];

readSyncDataURL = function(file) {
//    var url = URL.createObjectURL(file); //Create Object URL
    var url =file;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false); //Synchronous XMLHttpRequest on Object URL
    xhr.overrideMimeType("text/plain; charset=x-user-defined"); //Override MIME Type to prevent UTF-8 related errors
    xhr.send();
    URL.revokeObjectURL(url);
    var returnText = "";
    for (var i = 0; i < xhr.responseText.length; i++) {
      returnText += String.fromCharCode(xhr.responseText.charCodeAt(i) & 0xff);
    }; //remove higher byte
//    return "data:" + file.type + ";base64," + btoa(returnText); //Generate data URL
    if(xhr.status == 200) return returnText;
    }

  function getTabCode() {
    if (!tc_path) {
      return false;
    }
    var array = [];
    var result = null;
    
    result = readSyncDataURL(tc_path);
    
/*    
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", tc_path, false);
    xmlhttp.send();
    if (xmlhttp.status == 200) {
      result = xmlhttp.responseText;
    }
*/    
    array = result.split(/\r?\n/).slice();
    return array;
  }
  tc_arr = getTabCode();
  
  const BREAKPITCH = 55; // lowest pitch to be used in note-sequence (A below middle C)
  const tab_alphabet = "abcdefghjklmnopqrstvwxyz";
  const rhythmFlags = "ZYTSEQHWBF";

  var pitch = 0;
  var tuning = "";
  var tuning_arr = [];
  var stringpitch = [];
  var lastpitch = 0;
  var interval = 0;
  var codestring = "";

  var durs = rhythmFlags.split("");
  var dur = [];
  for (d = 0; d < durs.length; d++) {
    dur[d] = 4 * (Math.pow(2, d));
  }
  var curr_dur = 128; // default quarter-note
  var time = 0; // accumulated since start
  var multiplier = 1; // alter time to suit metre - TOO CRUDE!!

  var beams = 0;
  var metre = ""; // NOT CURRENTLY USED??


  function getDurVal(c) {
    for (var j = 0; j < dur.length; j++) {
      if (durs[j] == c) return dur[j];
    }
    return false
  }

  var music = false;
  var got_Start = false;
  var gotInitialBL = false;

  for (i = 0; i < tc_arr.length; i++) {
    line = tc_arr[i].trim();
    if (!line.length) continue
    if (debug) logger.log("\t" + line)
    if (line.substr(1, 5) == "pitch") { // only works inside a <rules> element
      pitch = line.substr(7, line.lastIndexOf("<") - 7);
      continue;
    }
    if (line.substr(1, 6) == "tuning") { // only works inside a <rules> element
      tuning = line.substr(9, line.lastIndexOf("<") - 10);
      tuning_arr = tuning.split(" ");
      stringpitch[0] = parseInt(pitch);
      for (s = 1; s < 6; s++) stringpitch[s] = stringpitch[s - 1] + parseInt(tuning_arr[s - 1]);
      if (debug) logger.log("Tuning array: " + tuning_arr)
      if (debug) logger.log("String pitches: " + stringpitch)
      continue;
    }

    var firstChar = line.substr(0, 1)
    if (firstChar == "|" && !music && !gotInitialBL) {
      if (debug) logger.log("FOUND initial barline!")
      music = true;
      gotInitialBL = true;
      i++;
      // 		continue;
    }
    // if(debug) logger.log("upbeat: "+upbeat+" got_Start: "+got_Start+" music: "+music)	
    if (upbeat && !got_Start && music) { // advance i to first barline in music (skip any initial barline!)
      while (tc_arr[i + 1].trim().substr(0, 1) != "|") {
        if (debug) logger.log("Seeking first bar after upbeat; now at " + i + " : " + tc_arr[i].trim().substr(0, 1))
        i++;
        // 		continue;
      }
      got_Start = true;
      i++
      if (debug) logger.log("Found start bar at " + i)
    }
    firstChar = tc_arr[i].trim().substr(0, 1);

    if (firstChar == "<") continue; // some other rule tag
    // 	if(firstChar=="|") continue; // barline: MAYBE SHOULD ENCODE THESE AS "|" IN CODESTRING?? 
    if (firstChar == "|") {
      codestring += "|"
      continue;
    }
    if (firstChar == "{") continue; // comment

    if (firstChar == "M") continue; // metre
    //     if (firstChar == "M") { // metre - apply crude 2/3 reduction in M(3) case!! TOO CRUDE
    //       if (tc_arr[i].trim().substr(2, 1) == 3) multiplier = 2 / 3;
    //       else multiplier = 1;
    //       if (debug) logger.log("New Metre: " + tc_arr[i].trim().substr(2, 1) + " multiplier: " + multiplier)
    //       continue;
    //     }

    // Get rhythms:
    var skip_rs = 0;
    if ((firstChar == "[") || (firstChar == "]")) { // beam 
      var word_arr = tc_arr[i].trim().split("");
      for (var k = 0;
        ((word_arr[k] == "[") || (word_arr[k] == "]")); k++) {
        skip_rs++;
        switch (word_arr[k]) {
          case "[":
            beams++;
            break;
          case "]":
            beams--;
            break;
          default:
            continue;
        }
      }
      if (beams > 0) curr_dur = dur[(6 - beams)];
      if (debug) logger.log("curr_dur is " + curr_dur + " (" + beams + " beams)");
      music = true;
    }
    else if (rhythmFlags.indexOf(firstChar) >= 0) {
      var dotted = false;
      curr_dur = getDurVal(firstChar);
      skip_rs++;
      if (tc_arr[i].trim().substr(1, 1) == ".") { // second char
        dotted = true;
        curr_dur = curr_dur * (3 / 2);
        skip_rs++;
      }
      var message = "curr_dur is " + curr_dur + " ";
      if (debug) logger.log(message)
      music = true;
    }


    // Done rhythm - now notes:	
    line = tc_arr[i].trim().substr(skip_rs);
    firstChar = line.substr(0, 1);
    if (debug) logger.log("Got rhythm - now first char is: " + firstChar)
    if (firstChar == "") {
      if (debug) logger.log("REST!");
      codestring += '*';
    }
    else {
      if (tab_alphabet.indexOf(firstChar) >= 0) { // it's a note!
        var the_string = line.substr(1, 1); // not safe in general if fingering dot is before string number! 
        music = true;
        var note_pitch = stringpitch[the_string - 1] + tab_alphabet.indexOf(firstChar);
        if (debug) logger.log("\tnote of pitch " + note_pitch)
        var topnote = "";
        var toolow = false;
        if (note_pitch < BREAKPITCH) {
          toolow = true;
          codestring += '*'
          if (debug) logger.log(time + " ! (" + note_pitch + ")");
        }
        else {
          if (debug) logger.log(time + " pitch " + note_pitch + " OK");
        }
        topnote = note_pitch;
        var interval_code = "";
        if (debug) logger.log("window is " + window + " time is " + time);

        if ((time % window) == 0) {
          if (!toolow) {
            interval = topnote - lastpitch;
            if (interval == 0) interval_code = "-"
            else interval_code = (interval < 0) ? alphabet.charAt((interval + 1) * -1) : alphabet.charAt(interval - 1).toUpperCase();
            if (debug) logger.log("\t\t" + interval_code)
            codestring += interval_code;
            lastpitch = topnote;
            if (time)
              if (debug) logger.log((time % window) + "\t" + time + "\t" + topnote + "\t" + interval + "\t" + interval_code);
          }
          else if (debug) logger.log((time % window) + "\t" + time + "\t(" + topnote + ")");
        }
      }
    }
    time += parseInt(curr_dur * multiplier);
    if (debug) logger.log("Time now: " + time)
    if (debug) logger.log("codestring for " + tc_path + " is \n\t" + codestring)
  }
  if (codestring.length) return codestring;
  else return "Codestring for " + tc_path + " failed!!"
}

var comp_arr = [];

function compareCodesHiliteToHTML(q_code, lcs) {
  //	Split q_code and lcs into arrays q_code_arr and lcs_arr, respectively.
  // 	With each char in lcs_arr in turn, find its first index within q_code_arr.
  //   NB Ignore chars "|" (barlines) and '*' (skipped chords) in lcs.
  //	Store each chord-number and bar-number of q_code_arr in global comp_arr.
  //   Return html representation of the code with all matched chars highlighted.

  logger.log("LCS is "+lcs)
  
//   var q_code_arr = q_code.split('');
  var q_code_arr = [...q_code];
  if(!q_code_arr.length) return false;
  var c
  for (c = 0; c < q_code_arr.length; c++) {
    comp_arr[c] = {};
    comp_arr[c].symbol = q_code_arr[c];
    comp_arr[c].chord_num = 0;
    comp_arr[c].bar_num = 0;
    comp_arr[c].html = "";
  }
  logger.log(c + " objects in comp_arr");
//   for (n=0;n<comp_arr.length;n++)logger.log(comp_arr[n].symbol)
  
  var lcs_arr = lcs.split('');
    var j = 0;
    var last_loc = 0;
    var bar_num = 0; // bar number in matched file - not query
    var chord_num = 0; // chord number in matched file - not query
  for (i = 0; i < lcs_arr.length; i++) {
    var the_char = lcs_arr[i];
logger.log("Next char in match: "+the_char)
    var j;
logger.log("Now starting at "+ (last_loc))
    for (j = last_loc; j < q_code_arr.length; j++) {
	    if (alphabet.indexOf(the_char) > -1) {
		 chord_num++;
	    }
	    else {
		 if (q_code_arr[j] == '*') {
		   logger.log("Here's a skip!!")
		   chord_num++;
		 }
		 if (q_code_arr[j] == "|") {
		   bar_num++;
		 }
	    }
logger.log("q_code_arr[j]: "+q_code_arr[j]+" the_char: "+the_char)
      if (q_code_arr[j] != the_char) {
logger.log("\tEntering: "+q_code_arr[j])
        comp_arr[j].chord_num = chord_num;
        comp_arr[j].bar_num = bar_num;
        comp_arr[j].html = q_code_arr[j];
      }
      else {
        comp_arr[j].chord_num = chord_num;
        comp_arr[j].bar_num = bar_num;
        comp_arr[j].html = "<span class='matched'>" + q_code_arr[j] + "</span>";
 logger.log("\t**Highlighting: "+comp_arr[j].html)
        break;
      }
    last_loc = j+2;
    }
    logger.log("last_loc "+last_loc)
  }
if((last_loc == lcs_arr.length-1) && (j < q_code_arr.length-1) ) {
logger.log("Still "+(q_code_arr.length-1 - j)+" to fill in")
	for(j=last_loc;j < q_code_arr.length-1;j++) {
logger.log("\tEntering: "+q_code_arr[j])
        comp_arr[j].chord_num = chord_num;
        comp_arr[j].bar_num = bar_num
        comp_arr[j].html = q_code_arr[j];
}
logger.log(comp_arr)
}
  
  var out_html = "";
  for (p = 0; p < comp_arr.length; p++) {
    logger.log(p +
      " symbol: " + comp_arr[p].symbol +
      " chord: " + comp_arr[p].chord_num +
      " bar: " + comp_arr[p].bar_num +
      "\t" + comp_arr[p].html);
    out_html += comp_arr[p].html;
  }
  logger.log(out_html);
  return out_html;
}