var ticksPerCrotchet = 128;
var pitches = [[0, 1], [2], [3, 4], [5, 6], [7, 8], [8, 9], [10,11]];
var diatonicPitches = [0, 2, 4, 5, 7, 9, 11];
var minorDiatonicPitches = [[0], [2], [3], [5], [7], [8, 9], [10, 11]];
var possiblePitches = function (noteName, octave){
  return (octave * 7) + pitches[nameToPitchClassNumber(noteName)];
};
var possiblePitchesGivenMoreInfo = function (pc1, cp1, interval){
  // So, we have a pitch class number and chromatic number, say 2, 3 (which is Eb).
  // We also have an interval (say +2)
  // That deterministically gives a pitch class (here 4, which is G)
  // and gives options of a chromatic pitch (here, 7, 8 – G and G#. We
  // should probably notice that Eb-G# is not a real interval at this
  // time, but I'll not try that yet.
  var pc2 = (((pc1+interval) % 7)+7)%7;
  var optionalPitches = pitches[pc2];
  if(interval!=0){
    var op = optionalPitches;
    optionalPitches = [];
    for(var i=0; i<op.length; i++){
      if(op[i]!=cp1) {
        optionalPitches.push(op[i]);
      }
    }
  }
  return optionalPitches;
};
var pitchFromOptionOld = function(cp1, relInt, pcInt){
  if(pcInt>=0){
    return cp1+relInt;
  } else {
    return cp1+relInt-12;
  }
};
var pitchFromOption = function(cp1, cp2, pcInt){
  if(pcInt>=0){
    while(cp2<cp1){
      cp2+=12;
    }
  } else {
    while(cp2+12<cp1){
      cp2+=12;
    }
  }
  return cp2;
};
var pitchOptionsForNode = function(notesSoFar, node){
  var noteNo = notesSoFar.length;
//  console.log(node.length, node, notesSoFar);
  for(var i=0; i<node.length; i++){
    var newNotesSoFar = notesSoFar.slice();
    newNotesSoFar.push(pitchFromOption(notesSoFar[noteNo-1], node[i][0],
                                       this.notes[noteNo].diatonicInterval()));
    if(noteNo+1===this.notes.length || !node[i][1].length){
      this.permutationArray.push(newNotesSoFar);
      if(node[i][1].length && node[i][1][0]){
        if(node[i][1][0]==="major" || node[i][1][0]==="either"){
          this.diatonicPaths.push(this.permutationArray.length-1);
        } 
        if (node[i][1][0]==="minor" || node[i][1][0]==="either"){
          this.minorDiatonicPaths.push(this.permutationArray.length-1);
        } 
      }
    } else {
     this.pitchOptionsForNode(newNotesSoFar, node[i][1]);
    }
  }
};
var realisePitchOptions = function(){
  if(!this.optionTree || !this.optionTree.length) this.getOptions();
  this.permutationArray = [];
  for(var i=0; i<this.optionTree.length; i++){
    this.pitchOptionsForNode([60], this.optionTree[i][1]);
  }
  return this.permutationArray;
};
var nameToPitchClassNumber = function(name){
  return 'cdefgab'.indexOf(name);
};
var CodeNoteDiatonicPitchClass = function(shift){
  if(shift){
    return ((('cdefgab'.indexOf(this.name)+shift) % 7)+7)%7;
  } else {
    return 'cdefgab'.indexOf(this.name);
  }
};
var CodeNoteDiatonicPitch = function(){
  return this.octave*7+((nameToPitchClassNumber(this.name)+2)%7);
//  return this.octave*7+nameToPitchClassNumber(this.name);
};
var diatonicInterval = function(){
  if(this.previous){
    return this.diatonicPitch() - this.previous.diatonicPitch();
  } else return false;
};
var diatonicSignedInterval = function(){
  if(this.previous){
    var p = this.diatonicPitch() - this.previous.diatonicPitch();
    if(this.octave>this.previous.octave){
      return p+7;
    } else if(this.octave<this.previous.octave){
      return p-7;
    } else return p;
  } else return false;
  if(this.previous){
    var p = this.diatonicPitch() - this.previous.diatonicPitch();
    if(this.octave>this.previous.octave){
      return p+7;
    } else if(this.octave<this.previous.octave){
      return p-7;
    } else return p;
  } else return false;
};
var addToOptionTreeOld = function(optionArray){
  if(!this.optionTree) this.optionTree = [];
  var node = this.optionTree;
  for(var i=0; i<optionArray.length; i++){
    var val = optionArray[i];
    var found = false;
    for(var j=0; j<node.length; j++){
      if(node[j][0]===val) {
        found = true;
        node = node[j][1];
        break;
      }
    }
    if(!found){
      var newNode = [val, []];
      node.push(newNode);
      node = newNode[1];
    }
  }
};
var addToOptionTree = function(optionArray, diatonic){
  if(!this.optionTree) this.optionTree = [];
  var offset = optionArray[0];
  var node = this.optionTree;
  for(var i=0; i<optionArray.length; i++){
    var val = optionArray[i]-offset;
    if(val<0) val+=12;
    var found = false;
    for(var j=0; j<node.length; j++){
      if(node[j][0]===val) {
        found = true;
        node = node[j][1];
        break;
      }
    }
    if(!found){
      var newNode = [val, []];
      node.push(newNode);
      node = newNode[1];
    }
    if(i===optionArray.length-1 && diatonic){
      if(node.length) {
        node[0]= diatonic;
      } else {
        node.push(diatonic);
      }
    }
  }
};
var nextOptions = function(noteNo, prevPitch, optionArray, shift, diatonic){
  var options, pc, optionIsDiatonic;
//  console.log(noteNo, prevPitch, optionArray);
  if(noteNo){
    var prevPc = this.notes[noteNo-1].diatonicPitchClass(shift);
    var interval = this.notes[noteNo].diatonicInterval();
    options = possiblePitchesGivenMoreInfo(prevPc, prevPitch, interval);
    pc = (((prevPc+interval)%7)+7)%7;
  } else {
    pc = this.notes[0].diatonicPitchClass(shift);
    options = pitches[pc];
  }
  prevPitch = 0;
 // console.log(options);
  for(var i=0; i<options.length; i++){
    var newOptions = optionArray.slice();
    newOptions.push((((options[i]-prevPitch) % 12) + 12) % 12);
    if(diatonic==="major"){
      optionIsDiatonic = (options[i]===diatonicPitches[pc]) ? "major" : false;
    } else if(diatonic==="minor"){
       optionIsDiatonic = (minorDiatonicPitches[pc].indexOf(options[i])!=-1) ? "minor" : false;
    } else if (diatonic==="either") {
      var majority = (options[i]===diatonicPitches[pc]) ? "major" : false;
      var minority = (minorDiatonicPitches[pc].indexOf(options[i])!=-1) ? "minor" : false;
      optionIsDiatonic = (minority && majority) 
                           ? "either" 
                           : (minority ? "minor" : (majority ?  "major" : false));
    } 
    if(noteNo+1<this.notes.length){
      this.nextOptions(noteNo+1, options[i], newOptions, shift, optionIsDiatonic);
    } else {
      this.addToOptionTree(newOptions, optionIsDiatonic);
    }
  }
};
var checkTonality = function(pointList){
  
};
var exportPieceOptions = function(path){
  for(var i=0; i<this.permutationArray.length;i++){
    var pitches = this.permutationArray[i];
    var intervals = [];
    var filename = this.name;
    for(var p=1; p<pitches.length; p++){
      intervals.push(pitches[p]-pitches[p-1]);
    }
    filename+= "_"+intervals.join("_")+".";
    if(this.diatonicPaths.indexOf(i)>-1){
      filename += "major.";
    }
    if(this.minorDiatonicPaths.indexOf(i)>-1){
      filename += "minor.";
    }
    filename += "json";
    var outArray = [];
    var time = 0;
    for(var j=0; j<pitches.length; j++){
      outArray.push([time, pitches[j]]);
      time += this.notes[j].duration*ticksPerCrotchet;
    }
    fs.writeFileSync(path+filename, JSON.stringify(outArray));
  }
};
var Piece = function(){
  this.notes = false;
  this.optionTree = false;
  this.diatonicPaths = [];
  this.minorDiatonicPaths = [];
  this.name = false;
  this.permutationArray = [];
  this.addToOptionTree = addToOptionTree;
  this.nextOptions = nextOptions;
  this.exportOptions = exportPieceOptions;
  this.getOptions = function(){
    for(var i=0; i<8; i++){
     this.nextOptions(0, false, [], i, "either");
    }
    return this.optionTree;
  };
  this.pitchOptionsForNode = pitchOptionsForNode;
  this.realiseOptions = realisePitchOptions;
};
var CodeNote = function(){
  this.name = false;
  this.octave = false;
  this.duration = false;
  this.previous = false;
  this.next = false;
  this.diatonicPitchClass = CodeNoteDiatonicPitchClass;
  this.diatonicPitch = CodeNoteDiatonicPitch;
  this.diatonicInterval = diatonicInterval;
  this.diatonicSignedInterval = diatonicSignedInterval;
};
var parseCode = function(code){
  var currentOctave = 1;
  var currentNote = false;
  var newNote = false;
  var currentRhythm = false;
  var notes = [];
  var tie = false;
  for(var i=0; i<code.length; i++){
    if(code.charAt[i]==='t'){
      tie = true;
    } else if('TSEQHW'.indexOf(code[i])>-1){
      currentRhythm = Math.pow(2, 'TSEQHW'.indexOf(code[i])-3);
      if(tie) {
        currentNote.duration += currentRhythm;
        tie = false;
      }
    } else if(code[i]==='-'){
      currentOctave=0;
    } else if(code[i]==='+'){
      currentOctave=1;
    } else if(nameToPitchClassNumber(code[i])>-1){
      if(tie){
        tie = false;
      } else {
        newNote = new CodeNote();
        newNote.name=code[i];
        newNote.octave=currentOctave;
        newNote.duration = currentRhythm;
        newNote.previous = currentNote;
        currentNote.next = newNote;
        notes.push(newNote);
        currentNote = newNote;
      }
    }
  }
  return notes;
};
var processLine = function(line, outpath, prefix){
  if(!line.length || line[0]==="[" || line[0]==="(") return;
  var fields = line.split(/\s/);
  var name = fields[0];
  var code = fields[1];
  if(!line.length || !name.length || !code.length || code[0]==="=") return;
  if(prefix) name = prefix+name;
  console.log(line, name, code);
  var notes = parseCode(code);
  var piece = new Piece();
  piece.notes = notes;
  piece.name = name;
  piece.realiseOptions();
  piece.exportOptions(outpath);
};
var processFile = function(data, outpath){
  var lines = data.split(/[\f\n\r]+/);
  var prefix = false;
  console.log(lines.length);
  if(!/\/$/.test(outpath)) outpath += "/";
  for(var i=0; i<lines.length; i++){
    if(lines[i].length){
      if(lines[i][0]==="("){
        var end = lines[i].indexOf(")");
        prefix = lines[i].substr(1, end-1);
      } else if(lines[i][0]!=="["){
        processLine(lines[i], outpath, prefix);
      }
    }
  }
};
