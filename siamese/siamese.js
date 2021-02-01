function vectorDiff(v1, v2){
  // a general version would be .map minus
  return [v2[0]-v1[0], v2[1]-v1[1]];
}

function generalVectorDiff(v1, v2){
  return v2.map(function(val, i){return val-v1[i];});
}
var vectorEqual = function (array, array2) {
  for (var i = 0, l=array.length; i < l; i++) {
    if (array[i] != array2[i]) return false;
  }
  return true;
}
function generalSIAMESE(needle, haystack){
  var vectorTable = new Array(needle.length * haystack.length);
  var index = 0;
  for(var i=0; i<needle.length; i++){
    for(var j=0; j<haystack.length; j++){
      vectorTable[index] = generalVectorDiff(needle[i], haystack[j]);
      index++;
    }
  }
  vectorTable = vectorTable.sort();
  var prevVector = false;
  var count = 0;
  var bestCount = false;
  var bestVectors = false;
  var l = vectorTable.length;
  for(i=0; i<=l; i++){
    if(i && i<l && vectorEqual(vectorTable[i], vectorTable[i-1])){
      // same as prev
    } else {
      if(!bestCount || count>bestCount){
        bestCount = count;
        bestVectors = [vectorTable[i-1]];
      } else if(count===bestCount){
        bestVectors.push(vectorTable[i]);
      }
      count=0;
    }
    count++;
  }
  return [bestCount, bestVectors];
}


function searchSet (needle, haystack) {
  var vectorTable = new Array(needle.length*haystack.length);
  var index = 0;
  for(var i=0;i<needle.length; i++){
    for(var j=0; j<haystack.length; j++){
      vectorTable[index] = vectorDiff(needle[i], haystack[j]);
      index++;
    }
  }
  vectorTable = vectorTable.sort();
  var prevVector = false;
  var count = 0;
  var bestCount = false;
  var bestVectors = false;
  var l = vectorTable.length;
  for(i=0; i<=l; i++){
    if(i && i<l
       && vectorTable[i][0]===vectorTable[i-1][0]
        && vectorTable[i][1]===vectorTable[i-1][1]){
      // same as prev
    } else {
      if(!bestCount || count>bestCount){
        bestCount = count;
        bestVectors = [vectorTable[i-1]];
      } else if(count===bestCount){
        bestVectors.push(vectorTable[i-1]);
      }
      count = 0;
    }
    count++;
  }
  return [bestCount, bestVectors];
}

function flattenIndex(indices, range){
  var index = 0;
  var dimension = (range*2)+1;
  for(var i=0; i<indices.length; i++){
    index += (indices[i] + range) * Math.pow(dimension, i);
  }
  return index;
}
function intervalsFromBackwardsPitchList(list){
  var backwardsIntervals=[];
  for(var i=0; i<list.length-1; i++){
    backwardsIntervals.push(list[i]-list[i+1]);
  }
  return backwardsIntervals;
}
function explainNGram(table, range, n){
  var dimension = (range*2) + 1;
  for(var i=0; i<table.length; i++){
    var index = i;
    var coords = [];
    for(var j=n-1; j>=0; j--){
      var pow = Math.pow(dimension, j);
      var div = Math.floor(index / pow);
      index = i % pow;
      coords.push(div - range);
    }
    if(table[i]){
      console.log(coords, table[i] ? table[i] : 0);
    }
  }
}

function getNGram (index, piece, timestep, n, soFar, table, range, strict){
  var target = piece[index][0]+timestep;
  for(var i=index+1; i<piece.length && piece[i][0]<=target; i++){
    if(piece[i][0]===target && Math.abs(piece[i][1]-soFar[soFar.length-1])<=range){
      if(n===0){
        var ngramindex = flattenIndex(intervalsFromBackwardsPitchList(soFar.concat(piece[i][1])), range);
        table[ngramindex] = table[ngramindex] ? table[ngramindex]+1 : 1;
      } else {
        getNGram(i, piece, timestep, n-1, soFar.concat(piece[i][1]), table, range, strict);
      }
    } else if (strict && piece[i][0]!==piece[index][0] && piece[i][0]!==target){
      return;
    }
  }
}
function getSequenceNGram(index, piece, n, soFar, table, range){
  // ngram based on successive chords/tabwords
  var now = piece[index][0];
  var current = false;
  for(var i=index+1; i<piece.length && (!current || piece[i][0]==current); i++){
    if(piece[i][0]!==now){
      current = piece[i][0];
      if(Math.abs(piece[i][1]-soFar[soFar.length-1])<=range){
        if(n===0){
          var ngramindex = flattenIndex(intervalsFromBackwardsPitchList(soFar.concat(piece[i][1])),
            range);
          table[ngramindex] = table[ngramindex] ? table[ngramindex]+1 : 1;
        } else {
          getSequenceNGram(i, piece, n-1, soFar.concat(piece[i][1]), table, range);
        }
      }
    }
  }
}

function corpusNGrams(corpus, timestep, n, range, strict, seq){
  if(!range) range=12;
  if(!n) n=2;
  var dimension = (range * 2) + 1;
  var slots = new Array(Math.pow(dimension, n));
  for(var i=0; i<corpus.length; i++){
    var piece = corpus[i][1];
    for(var j=0; j<piece.length; j++){
      var note = piece[j];
      if(seq){
        getSequenceNGram(j, piece, n-1, [note[1]], slots, range, strict);
      } else {
        getNGram(j, piece, timestep, n-1, [note[1]], slots, range, strict);
      }
    }
  }
  explainNGram(slots, range, n);
  return slots;
}

function searchCorpus(needle, haystackVector, cutOff){
  cutOff = cutOff || 2;
  var results = [];
  var result = false;
  for(var i=0; i<haystackVector.length; i++){
    result = searchSet(needle, haystackVector[i]);
    if(result[0]>=cutOff) results.push([i, result[0], result[1]]);
  }
  return results.sort();
}
function secondSort(v1, v2){
  return v2[1]-v1[1];
}

function sortByHitLocation(v1, v2){
  return v1[2][0][0]-v2[2][0][0];
}


function searchCorpusWithIDs(needle, haystackVector, cutOff){
  cutOff = cutOff || 2;
  var results = [];
  var result = false;
  for(var i=0; i<haystackVector.length; i++){
    result = searchSet(needle, haystackVector[i][1]);
    if(result[0]>=cutOff) results.push([haystackVector[i][0], result[0], result[1]]);
  }
//  return results.sort(secondSort);
  return results.sort(sortByHitLocation);
}

function vectorizeTabCodeObject(TCO, initialTuning){
  var words = TCO.TabWords;
  curTuning = initialTuning;
  var vectors = [];
  var now = 0;
  for(var i=0; i<words.length; i++){
    if(words[i].tType==="Chord"){
      var dur = words[i].duration()/4;
      var notes = words[i].pitches(true);
      for(var j=0; j<notes.length; j++){
        vectors.push([now, notes[j]]);
      }
      now+=dur;
    } else if (words[i].tType==="Ruleset"){
      words[i].getTuning();
      words[i].draw();
    }
  }
  if(!TCO.duration) {
    TCO.duration=now*4;
  }
  return vectors;
}
function getFromCorpusById(id, corpus){
  // No requirement for sorted corpus, so O(N) rather than O(log N).
  // Probably this is only an issue where there are many results.
  // Also, would perhaps have made more sense for ID to be an array index...
  for(var i=0; i<corpus.length; i++){
    if(corpus[i][0]==id) return corpus[i];
  }
  return false;
}
function getPointGivenTimeMatch(index, pitch, piece){
  // binary search has got us a point with a matching time. Now we know that
  // we're in a contiguous block of points, it may be faster to iterate to find
  // the match. Possibly, though, this actually slows things down, but it
  // does save me trusting the order of pitches in the piece at a given
  // timepoint.
  var t=piece[index][0];
  for(var i=index; i>=0 && piece[i][0]==t; i--){
    if(piece[i][1]==pitch) return i;
  }
  for(i=index+1; i<piece.length && piece[i][0]==t; i++){
    if(piece[i][1]==pitch) return i;
  }
  return false;
}
function getPoint(timepoint, pitch, piece, low, high, mid){
  if(high<=low) return false;
  if(typeof(mid)==='undefined' || (!mid && mid!==0)) mid = Math.floor((low+high)/2);
  // Complication here, because there can be multiple points with the same time.
  var midTime = piece[mid][0];
  if(piece[mid][0]==timepoint){
    return getPointGivenTimeMatch(mid, pitch, piece);
  } else if (piece[mid][0]>timepoint){
    return getPoint(timepoint, pitch, piece, low, mid-1);
  } else {
    return getPoint(timepoint, pitch, piece, mid+1, high);
  }
}
function reconstructPointMatches(results, needle, corpus, writer){
  // Given the original query components and the results, generate pointlists
  for(var i=0; i<results.length; i++){
    // Each result consists of a result id, a score and a list of translation vectors
    var pieceID = results[i][0];
    var piece = getFromCorpusById(pieceID, corpus)[1];
    var score = results[i][1];
    var translations = results[i][2];
    var pointsets = [];
    for(var transi=0; transi<translations.length; transi++){
      // For each vector, test for matching points
      var pointset = [];
      var deltaT = translations[transi][0];
      var deltaP = translations[transi][1];
      var suggestedMid=false, suggestedLow=0, suggestedHigh=piece.length-1;
      for(var notei=0; notei<needle; notei++){
        var noteMatch = getPoint(needle[notei][0]+deltaT,
          needle[notei][1]+deltaP, piece, suggestedLow, suggestedHigh, suggestedMid);
        if(noteMatch){
          pointset.push(piece[noteMatch]);
          suggestedMid = noteMatch; // may actually slow things a little.
        }
      }
      pointsets.push(pointset);
      if(typeof(writer)!='undefined') {
        writer.addTriple({});
      }
    }
  }
}
