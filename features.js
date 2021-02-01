/// Relatively standalone code for adding and drawing values for
/// tablature

// Add attribute for storing values in chord (for features involving
// other classes, add a similar attribute)
Chord.prototype.featureValues = false;

// This is for keeping track of features and how they should be
// visualised. Not currently used.

var visualisations = [];

// Here are the main classes. We need not only a linked list of
// values, but also to keep track of the range so that plotting or
// summarising scales right. we do that with a Range class. Range
// keeps track of a max and min and updates them as necessary. It
// could keep a sum and mean too pretty easily.
function range(){
  this.max = false;
  this.min = false;
  this.sum = 0;
  this.count = 0;
  this.mean = function(){
    return this.sum / this.count;
  };
  this.update = function(x){
    if(this.max===false || x>this.max) this.max = x;
    if(this.min===false || x<this.min) this.min = x;
    this.sum +=x;
    this.count++;
  };
}

// simpleNumericValue is just that. It stores its own value, points
// to the thing it is calculated on and the range-tracking object and,
// if it's been drawn, knows where the drawn thing is.
function simpleNumericValue (){
  this.feature = false;
  this.range = false;
  this.value = false;
  this.zeroBase = true;
  this.appliesTo = false;
  this.startx = false;
  this.endx = false;
  this.prev = false;
  this.next = false;
  this.domObj = false;
};

// If we're adding graphing visualisations below the staff, we need to
// add space for this. Here's a hacky way to do it. Ultimately,
// visualisationSpace will iterate through the list of visualisations
// and calculate the height requirements.
// advance() overrides the normal system spacing calculation.
Tablature.prototype.visualisationSpace = function(){
  return 4*ld;
};
function advance(){
  return (4+lines)*ld + TabCodeDocument.visualisationSpace();
}

// Global for averaging values etc in node output
var node_barCount = 0;
var chordCosts = [];
var barCostSum = 0;
var incrementBarNo = false;

// Calls supplied function on each chord in a piece and returns the
// result. It's possible to build things that use a larger context
// with this, but it might want rewriting. If no function is supplied,
// a random value is generated, for testing purposes.
function applyChordFunctionGraph(doc, fn, name){
  if(!doc) doc = TabCodeDocument;
  if(!fn) fn = function(w) { return Math.round(Math.random()*100);};
  var visp = false;
  var first = false;
  var fRange = new range();
  var chordIndex = 0;
  
  for(var i=0; i<doc.TabWords.length; i++){
    if(visp && !visp.endx && doc.TabWords[i].xpos){
      visp.endx = doc.TabWords[i].xpos;
    }
    // if(doc.TabWords[i].tType==="Chord" && !doc.TabWords[i].featureValues){
    if(doc.TabWords[i].tType==="Chord"){
      var word = doc.TabWords[i];
      var value = fn.call(document, word);
      chordCosts[chordIndex] = value;
      chordIndex++;
      if(value || value===0){
        var visn = new simpleNumericValue();
        visn.range = fRange;
        visn.value = value;
        if(word.featureValues) word.featureValues.push(visn);
            else word.featureValues = [visn];
        fRange.update(value);
        visn.appliesTo = word;
        visn.startx = word.xpos;
        if(name) visn.feature = name;
        if(visp){
          visp.next = visn;
          visn.prev = visp;
//        visp.endx = visn.startx;
        } else {
          first = visn;
        }
        visp = visn;
      }
	incrementBarNo = true;
    }
    if(doc.TabWords[i].tType==="Barline"){
    	if(incrementBarNo) {
			node_barCount++;
			this.barnumber = node_barCount;
		}
		incrementBarNo = false;
    }
  }
  return first;
}

////////////////////////////////
//
// Feature functions

// These functions take a musical object and return a thing that's
// used to make a value. In the one case here, it's a value suitable
// for use in simpleNumericValue.

function noteCount(chord){
  // How many notes are playing in this chord?
  var count = 0;
  for(var i=0; i<chord.mainCourses.length; i++){
    if(chord.mainCourses[i]&&(chord.mainCourses[i].fret!=="-")) count++;
  }
//  return count+chord.bassCourses.length;
//  console.log(count.toString()+" notes");
  return count;
}
function chordStretch(chord){
  var highest = false;
  var lowest = false;
  for(var i=0; i<chord.mainCourses.length; i++){
    if(chord.mainCourses[i]){
      var upness = letterPitch(chord.mainCourses[i].fret);
      if(upness){
        if (!lowest || upness<lowest[0]){
          lowest = [upness, [chord.mainCourses[i]]];
        } else if(lowest && lowest[0]===upness){
          lowest[1].push(chord.mainCourses[i]);
        }
        if (!highest || upness>highest[0]){
          highest = [upness, [chord.mainCourses[i]]];
        } else if(highest && highest[0]===upness){
          highest[1].push(chord.mainCourses[i]);
        }
      }
    }
  }
  if(highest && lowest && highest[0]!==lowest[0]){
    return highest[0]-lowest[0];
  } else return 0;
}
function simpleChordTransition(chord){
  var score = 0;
  var prev = chord.prev;
  while(prev && prev.tType!="Chord"){
    prev = prev.prev;
  }
  if(!prev) return false;
  for(var i=0; i<chord.mainCourses.length; i++){
	 	if((chord.mainCourses[i]) && (chord.mainCourses[i].fret!=="a")&&(chord.mainCourses[i].fret!=="-")) {
        score += Math.abs(letterPitch(chord.mainCourses[i].fret)-letterPitch(prev.mainCourses[i].fret));
    }
  }
  return score;
}
function chordStretch_both(chord){
  var highest = false;
  var lowest = false;
  var top_course = 100;
  var bottom_course = 0;
  for(var i=0; i<chord.mainCourses.length; i++){
    if(chord.mainCourses[i]){
      if((chord.mainCourses[i].fret!=="a")&&(chord.mainCourses[i].fret!=="-")) {
      	top_course = Math.min(chord.mainCourses[i].course,top_course);
      	bottom_course = Math.max(chord.mainCourses[i].course,bottom_course);
     }
      var upness = letterPitch(chord.mainCourses[i].fret);
      if(upness){
        if (!lowest || upness<lowest[0]){
          lowest = [upness, [chord.mainCourses[i]]];
        } else if(lowest && lowest[0]===upness){
          lowest[1].push(chord.mainCourses[i]);
        }
        if (!highest || upness>highest[0]){
          highest = [upness, [chord.mainCourses[i]]];
        } else if(highest && highest[0]===upness){
          highest[1].push(chord.mainCourses[i]);
        }
      }
    }
  }
  if(highest && lowest){
    return  highest[0]-lowest[0] + bottom_course - top_course;
  } else return 0;
}

var nnw = 1.5;  // weighting for number of notes in chord
var acrossw = 1; // weighting for stretch across strings
var alongw = 1; // weighting for stretch along fingerboard
var extw = 1; // weighting if an extension is required
var durw = 0.8; // (inverse) weighting for duration (fast notes cost more)

function across_stretch(chord) {
	 var top_course = 100;
	 var bottom_course = -1;
	 for(var i=0; i<chord.mainCourses.length; i++) {
	 	if((chord.mainCourses[i]) && (chord.mainCourses[i].fret!=="a")&&(chord.mainCourses[i].fret!=="-")) {
	 		bottom_course = Math.max(bottom_course,i+1);
	 		top_course = Math.min(top_course,i+1);
	 	}
	 }
	 for(var i=0; i<chord.bassCourses.length; i++) {
	 	if((chord.bassCourses[i]) && (chord.bassCourses[i].fret!=="a")&&(chord.bassCourses[i].fret!=="-")) {
//	console.log("Bass at " + chord.bassCourses[i].fret + " changes bottom_course "+bottom_course);
	 		bottom_course += 7 + i;
//	console.log(" to "+bottom_course);
	 	}
	 }
	 if((top_course == 100)||(bottom_course == -1)) return 0;
	 else {
		var score = bottom_course - top_course;
//		console.log("across: "+score.toString());
		return score;
	 }
}
function along_stretch(chord) {
	 var top_fret = -1;
	 var bottom_fret = 100;
	 for(var i=0; i<chord.mainCourses.length; i++) {
	 	if((chord.mainCourses[i]) && (chord.mainCourses[i].fret!=="a")&&(chord.mainCourses[i].fret!=="-")) {
	 		bottom_fret = Math.min(bottom_fret,letterPitch(chord.mainCourses[i].fret));
	 		top_fret = Math.max(top_fret,letterPitch(chord.mainCourses[i].fret));
	 	}
	 }
	 for(var i=0; i<chord.bassCourses.length; i++) {
	 	if((chord.bassCourses[i]) && (chord.bassCourses[i].fret!=="a")&&(chord.bassCourses[i].fret!=="-")) {
	 		bottom_fret = Math.min(bottom_fret,letterPitch(chord.bassCourses[i].fret));
	 		top_fret = Math.max(top_fret,letterPitch(chord.bassCourses[i].fret));
	 	}
	 }
	if((top_fret == -1)||(bottom_fret == 100)) return 0;
	else {
		score = top_fret - bottom_fret;
//		console.log("along: "+score.toString());
		return score;
	 }
}
function need_extension(chord) {
	 var top_fret = 0;
	 var bottom_fret = 200;
	 for(var i=0; i<chord.mainCourses.length; i++) {
	 	if((chord.mainCourses[i]) && (chord.mainCourses[i].fret!=="a")&&(chord.mainCourses[i].fret!=="-")) {
	 		bottom_fret = Math.min(bottom_fret,letterPitch(chord.mainCourses[i].fret));
	 		top_fret = Math.max(top_fret,letterPitch(chord.mainCourses[i].fret));
	 	}
	 }
	 for(var i=0; i<chord.bassCourses.length; i++) {
	 	if((chord.bassCourses[i]) && (chord.bassCourses[i].fret!=="a")&&(chord.bassCourses[i].fret!=="-")) {
	 		bottom_fret = Math.min(bottom_fret,letterPitch(chord.bassCourses[i].fret));
	 		top_fret = Math.max(top_fret,letterPitch(chord.bassCourses[i].fret));
	 	}
	 }
	 if((top_fret == 0)||(bottom_fret == 200)) return 0;
	 else {
			var score = top_fret - bottom_fret;
//			console.log("Test extension: "+score.toString());
			if(score > 3) {
//				console.log("Needs extension!");
				return 1;
			}
	 	else return 0;
	 	}
}

function totalChordCost(chord) {
	var score = ((nnw * noteCount(chord)) + (acrossw * across_stretch(chord)) + (alongw * along_stretch(chord)) + (extw * need_extension(chord)) + (durw * dur_cost_abs(chord)));
	realTotalCost+=score;
	barCostSum += score;
	return score;
}

function simpleChordTransitionPlusNotes(chord){
  var score = 0;
  var prev = chord.prev;
  while(prev && prev.tType!="Chord"){
    prev = prev.prev;
  }
  if(!prev) return false;
  for(var i=0; i<chord.mainCourses.length; i++){
	 	if(chord.mainCourses[i] && (chord.mainCourses[i].fret!=="a")&&(chord.mainCourses[i].fret!=="-")) {
        score += Math.abs(letterPitch(chord.mainCourses[i].fret)-letterPitch(prev.mainCourses[i].fret));
    }
  }
  return score  + noteCount(prev);
}
/**/

function dur_cost_rel(chord){
  var score = 0;
  var prev = chord.prev;
  while(prev && prev.tType!="Chord"){
    prev = prev.prev;
  }
  if(!prev) return false;
  var dur_ratio = prev.dur/chord.dur;
  if(dur_ratio) score = 128 / dur_ratio;
  return score;
}

function dur_cost_abs(chord){
  if(chord.dur) {
	  var score =  128 / chord.dur;
//	  console.log ("dur cost: "+ score);
	  return score;
  }
  else return false;
}
function both_stretch_plus_dur(chord) {
	return dur_cost_abs(chord) + chordStretch_both(chord);
}
/*
function simChordtransPlusNotesPlusStretch(chord){
  var prev = chord.prev;
  while(prev && prev.tType!="Chord"){
    prev = prev.prev;
  }
  if(!prev) return noteCount(chord) + chordStretch_both(chord);
  else return simpleChordTransition(prev) + noteCount(chord) + chordStretch_both(chord) + dur_cost(chord);
}
*/

/////////////////////////////////
//
// Visualisation functions
//

// Two graphing functions, both, effectively, bar graphs.

function drawBar(value, yOffset, colour, height){
  if(!yOffset) yOffset = 0;
  var prop = value.zeroBase ? value.value/value.range.max : ((value.value-value.range.min)/value.range.max);
  var drawy = value.appliesTo.ypos+yOffset+((1.5 + lines)*ld)+height-height*prop;
  value.domObj = svgRect(TabCodeDocument.SVG, value.startx, drawy,
    value.endx ? value.endx-value.startx : ld, prop*height, "simpleGraphBox "+colour, false);
  value.domObj.setAttributeNS(null, 'title', (value.feature ? value.feature+": " : "")
                              +"value: "+value.value + "(average: "+value.range.mean()+")");
}
function drawGraphLine(value, yOffset, colour, height){
  if(!yOffset) yOffset = 0;
  var prop = value.zeroBase ? value.value/value.range.max : ((value.value-value.range.min)/value.range.max);
  var drawy = value.appliesTo.ypos+yOffset+((1.5 + lines)*ld)+height-height*prop;
  value.domObj = svgLine(TabCodeDocument.SVG, value.startx, drawy,
    value.endx ? value.endx : value.startx+ld, drawy, "simpleGraphLine "+colour, false);
  value.domObj.setAttributeNS(null, 'title', (value.feature ? value.feature+": " : "")
                              +" value: "+value.value + "(average: "+value.range.mean()+")");
}

function drawBarWithLabel(value, yOffset, colour, height){
  if(!yOffset) yOffset = 0;
  var prop = value.zeroBase ? value.value/value.range.max : ((value.value-value.range.min)/value.range.max);
  var drawy = value.appliesTo.ypos+yOffset+((1.5 + lines)*ld)+height-height*prop;
  value.domObj = svgRect(TabCodeDocument.SVG, value.startx, drawy,
    value.endx ? value.endx-value.startx : ld, prop*height, "simpleGraphBox "+colour, false);
  var labelTextHeight =  value.appliesTo.ypos+yOffset+((1.5 + lines)*ld) +45;
  value.domObj = svgText(TabCodeDocument.SVG, value.startx, labelTextHeight, "barlabel ", false, false, value.value);
  value.domObj.setAttributeNS(null, 'title', (value.feature ? value.feature+": " : "")
                              +"value: "+value.value + "(average: "+value.range.mean()+")");

}
function drawGraphLineWithLabel(value, yOffset, colour, height){
  if(!yOffset) yOffset = 0;
  var prop = value.zeroBase ? value.value/value.range.max : ((value.value-value.range.min)/value.range.max);
  var drawy = value.appliesTo.ypos+yOffset+((1.5 + lines)*ld)+height-height*prop;
  value.domObj = svgLine(TabCodeDocument.SVG, value.startx, drawy,
    value.endx ? value.endx : value.startx+ld, drawy, "simpleGraphLine "+colour, false);
  var labelTextHeight =  value.appliesTo.ypos+yOffset+((1.5 + lines)*ld) +45;
  value.domObj = svgText(TabCodeDocument.SVG, value.startx-3, labelTextHeight+20, "label "+colour, false, false, value.value.toFixed(0));
  value.domObj.setAttributeNS(null, 'title', (value.feature ? value.feature+": " : "")
                              +" value: "+value.value + " (max: "+Math.round(value.range.max*100)/100+"; avge: "+Math.round(value.range.mean()*100)/100+")");
}

function drawLabelAlone(value, yOffset, colour, height){
  if(!yOffset) yOffset = 0;
  var prop = value.zeroBase ? value.value/value.range.max : ((value.value-value.range.min)/value.range.max);
  var drawy = value.appliesTo.ypos+yOffset+((1.5 + lines)*ld)+height-height*prop;
  var labelTextHeight =  value.appliesTo.ypos+yOffset+((1.5 + lines)*ld) +45;
  value.domObj = svgText(TabCodeDocument.SVG, value.startx-3, labelTextHeight-10, "label "+colour, false, false, Math.round(value.value * 100)/100);
  value.domObj.setAttributeNS(null, 'title', (value.feature ? value.feature+": " : "")
                              +" value: "+value.value + "(average: "+value.range.mean()+")");
}

// Calling functions for whole value sets
function drawBarGraph(head, yOffset, colour, height){
  drawBar(head, yOffset, colour, height);
  while((head=head.next)){
    drawBar(head, yOffset, colour, height);
  }
}
function drawLineGraph(head, yOffset, colour, height){
  drawGraphLine(head, yOffset, colour, height);
  while((head=head.next)){
    drawGraphLine(head, yOffset, colour, height);
  }
}

function drawBarGraphWithLabel(head, yOffset, colour, height){
  drawBarWithLabel(head, yOffset, colour, height);
  while((head=head.next)){
    drawBarWithLabel(head, yOffset, colour, height);
  }
}
function drawLineGraphWithLabel(head, yOffset, colour, height){
  drawGraphLineWithLabel(head, yOffset, colour, height-20);
  while((head=head.next)){
    drawGraphLineWithLabel(head, yOffset, colour, height-20);
  }
}
function drawAllLabels(head, yOffset, colour, height){
  drawLabelAlone(head, yOffset, colour, height);
  while((head=head.next)){
    drawLabelAlone(head, yOffset, colour, height);
  }
}

////////////////////////////
//
// Refresh function wrappers.
//
  var realTotalCost = 0;
  var maxScore = 0; hardestChord = 0;

function calculateAndDrawFeatures(){
	realTotalCost = 0;
	barCount = 0;
  /*
  var rand = applyChordFunctionGraph();
  var countedNotes = applyChordFunctionGraph(false, noteCount, "noteCount");
  var stretchy = applyChordFunctionGraph(false, chordStretch, "chordStretch");
  var both_stretchy = applyChordFunctionGraph(false, chordStretch_both, "chordStretch");
  var chordTrans = applyChordFunctionGraph(false, simpleChordTransition, "chordTransition");
  var durcost = applyChordFunctionGraph(false, dur_cost_rel, "durcost");
//  var bothStretchPlusDur = applyChordFunctionGraph(false, both_stretch_plus_dur, "stretchplusdurcost");
  var chordTransPlusNotes = applyChordFunctionGraph(false, simpleChordTransitionPlusNotes, "chordTrans+Notes");
*/

  var totalChordStretch = applyChordFunctionGraph(false, totalChordCost, "totalChordCost");

//  var chordtransPlusNotesPlusStretch  = applyChordFunctionGraph(false, simChordtransPlusNotesPlusStretch, "chordTransition+notes+stretch");
//  drawBarGraph(chordTrans, 0, "red", 2*ld);
//  drawLineGraph(chordTransPlusNotes, 0, "blue", 2*ld);
//  drawBarGraphWithLabel(durcost, 10, "red", 2*ld);
//  drawAllLabels(durcost, -10, "red", 2*ld);

//  drawLineGraph(countedNotes, 0, "yellow", 2*ld);
//  drawLineGraph(rand, 0, "gray", 2*ld);
//  drawLineGraph(stretchy, 0, "green", 2*ld);
//  drawLineGraph(both_stretchy, -8, "blue", 2*ld);
//  drawAllLabels(both_stretchy, 4, "blue", 2*ld);
//  drawLineGraphWithLabel(bothStretchPlusDur, 4, "green", 5*ld);


  drawLineGraphWithLabel(totalChordStretch, 4, "green", 5*ld);
  console.log("TOTAL: "+ realTotalCost.toFixed(2));
  console.log("NORM TOTAL ("+barCount+" bars): "+ (realTotalCost.toString()/barCount).toFixed(2));
  var chordNum = 0;
  for(var x=0;x<=chordCosts.length;x++) {
  	if(chordCosts[x]) {
		console.log(chordNum+". "+chordCosts[x].toFixed(2));
		if(chordCosts[x]>maxScore) {
			maxScore=chordCosts[x];
			hardestChord = chordNum;
		}
		chordNum++;
  	}
  }
  console.log("Hardest chord is "+hardestChord+" score "+maxScore.toFixed(2));
  chordCosts.length = 0;
  barCostSum = 0;
//  drawLineGraphWithLabel(chordTrans, 0, "red", 2*ld);
//  drawLineGraph(chordTransDurCost, 0, "red", 2*ld);

}

function updatePageWFeatures(){
  updatePage();
  // Here's the extra bit
//  calculateAndDrawFeatures();
}
function parseTCDoc2(TC){
  parseTCDoc(TC);
  // Here's the extra bit
  if(node){
    var totalChordStretch = applyChordFunctionGraph(false, totalChordCost, "totalChordCost");
    var car = totalChordStretch;
    var car_sum = 0;
    console.log("foo");
    console.log(car.value);
    car_sum += car.value;
    while((car=car.next)){
      console.log("This chord: "+car.value);
      car_sum += car.value;
    }
    console.log("TOTAL: "+car_sum.toFixed(2));
    console.log("NORM TOTAL ("+barCount+" bars): "+ (car_sum.toString()/barCount).toFixed(2));
  } else {
//    calculateAndDrawFeatures();
  }
}

// And override existing refresh functions to ensure this code happens
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
  if(!node){
//    calculateAndDrawFeatures();
  }
  //  parseTCDoc(document.getElementById('code').value);
}
function refresh2(){
  curBeams = 0;
  var newTC = new Tablature($("#code")[0].value, TabCodeDocument.SVG, curParams);
  var newdiff = new NW(TabCodeDocument.TabWords, newTC.TabWords);
  if(newdiff.setCosts()>0){
    TabCodeDocument = newTC;
    TabCodeDocument.draw();
    if(editable) updatePageWFeatures();
  } else {
    TO = setTimeout(function(){parseTCDoc2($("#code")[0].value);}, 1000);
  }
}
