/*
 JS code to extract topnote codestring from a TabCode file
 NB: THIS ONLY WORKS WITH TabCode OUTPUT FROM luteconv!!
 */

// stuff to be used with node:
/*
const fs = require('fs');
var tc_file = process.argv[2];
var tc = fs.readFileSync(tc_file,"utf-8");
var tc_arr = tc.split("\n");

var upbeat = (process.argv[3]=="true"); // if true, skip to first full bar of music
var window = process.argv[4]; // output pitches only when (time%window=0)
const debug = false;
if(debug) console.log(window + "\t"+upbeat)
*/
// end of node stuff.

/* Otherwise (not node - i.e. in browser) do this:*/

const debug = false;

// tc_path is where the TabCode file is stored on the server
// upbeat (Boolean): true means ignore first (incomplete) bar of music
// window: output pitches only when (time%window=0)
function getTopnoteCode(tc_path, upbeat, window) {
  var tc_arr = [];

  function getTabCode() {
    if (!tc_path) {
      return false;
    }
    var array = [];
    var result = null;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", tc_path, false);
    xmlhttp.send();
    if (xmlhttp.status == 200) {
      result = xmlhttp.responseText;
    }
    array = result.split(/\r?\n/).slice();
    return array;
  }
  tc_arr = getTabCode();

  const BREAKPITCH = 55; // lowest pitch to be used in note-sequence (A below middle C)
  const alphabet = "abcdefghijklmnopqrstuvwxyz"
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
    
    if(firstChar=="M") continue; // metre
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
      codestring += "*";
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
          codestring += "*"
          if (debug) logger.log(time + " * (" + note_pitch + ")");
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
  return codestring;

  // Next two lines are not used with node, just in browser:
  /**/
}
// 	exports.encode = getTopnoteCode;