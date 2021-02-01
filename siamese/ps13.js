// This is based on lisp code by David Meredith, later used as part of
// the amuse suite of tools. See also DM's various papers and his PhD.

var ps13 = function(sortedOCPList, KPre, KPost, justDiatonicNumber,
     dupes, fileName, bothStages, sillyPitch){
  // sortedOCPList is a time-ordered list of tuples representing notes. The
  // exact details of the structure are irrelevant, but the second element
  // of each tuple should be chromatic pitch. If sillyPitch is not set, then
  // chromatic pitch is assumed to be MIDI pitch, otherwise, it's the one DM
  // uses. KPre and KPost are context sizes.
  // N.B. Ordering matters in this implementation, including pitches within
  // chords. That's probably avoidable, but I'm not about to fix that now.
  var n = sortedOCPList.length;
  if(!sillyPitch){
    // pitch numbers are MIDI (rather than the ones in DM's OCP)
    var newOCP = new Array(n);
    for(var i=0; i<n; i++){
      newOCP[i] = [];
      for(var j=0; j<sortedOCPList[i].length; j++){
        if(j===1) newOCP[i].push(sortedOCPList[1]-21);
        else newOCP[i].push(sortedOCPList[i][j]);
      }
    }
    sortedOCPList = newOCP;
  }
  var chromaL = chromaList(sortedOCPList, n);
  var chromaVL = chromaVectorList(chromaL, KPre, KPost, n);
  var morphs;
  // Stage 1
  var morphs = dupes ?
    morphListWithDupes(chromaL, chromaVL, n, sortedOCPList, fileName) :
    morphList(chromaL, chromaVL, n);
  // Stage 2
  if(bothStages){
    var OCMChords = OCMChordList(sortedOCPList, chromaL, morphs, n);
    var chordCount = OCMChords.length;
    OCMChords = fixNeighbours(OCMChords, chordCount);
    OCMChords = fixPassingNotesDesc(OCMChords, chordCount);
    OCMChords = fixPassingNotesAsc(OCMChords, chordCount);
    morphList = morphListFromChordList(OCMChords, chordCount);
  }
  // Finalise
  var morpheticPitches = morpheticPitchList(sortedOCPList, morphList, n);
  return OPNList(sortedOCPList, morpheticPitches, n, justDiatonicNumber);
}

var chromaList = function (sortedOCPList, n){
  var chromaL = new Array(n);
  for(var i=0; i<n; i++){
    chromaL[i] = sortedOCPList[i][1] % 12;
  }
  return chromaL;
}

var chromaVL = function (chromaL, KPre, KPost, n){
  var thisVector = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for(var i=0; i<Math.min(n, KPost); i++){
    thisVector[chromaL[i]] = thisVector[chromaL[i]]+1;
  }
  var chromaVL = new Array(n);
  chromaVL[0] = thisVector.slice();
  for(var i=1; i<n; i++){
    if(i+KPost<=n){
      thisVector[chromaL[i+KPost-1]] = thisVector[chromaL[i+KPost-1]]+1;
    }
    if (i - KPre>0){
      thisVector[chromaL[i+KPost-1]] = thisVector[chromaL[i+KPost-1]]-1;
    }
    chromaVL[i] = thisVector.slice();
  }
  return chromaVL;
}

var morphListWithDupes = function(chromaL, chromaVL, n, sortedOCPList, fileName){
  var morphL = [];
  var initMorph = [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6];
  var c0 = chromaL[0];
  var m0 = initMorph[c0];
  var morphInt = [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6];
  var mtct0 = new Array(12);
  for(var ct=0; ct<12; ct++){
    mtc0[ct] = (m0 - morphInt[(12+c0-ct) % 12]) % 7;
  }
  var mctj = new Array(12);
  var ctmj = new Array(7);
  var smj = new Array(7);
  for(var j=0; j<n; j++){
    for(ct=0; ct<12; ct++){
      mctj[ct] = (7+morphInt[(12+chromaL[j]-ct)%12] + mtct0[ct]) % 7;
    }
    for(var m=0; m<7; m++){
      for(ct=0; ct<12; ct++){
        if(mctj[ct]===m){
          ctmj.unshift(ct);
        }
      }
    }
    for(m=0; m<7; m++){
      smj[m] = 0;
      var thing = ctmj[m];
      for(var i; i<thing.length; i++){
        smj[m] += chromaVL[j][thing[i]];
      }
    }
    var maxStrength = Math.max.apply(Math, smj);
    var mostStronglyImpliedMorphs = [];
    for(m=0; m<7; m++){
      if(maxStrength===smj[m]){
        mostStronglyImpliedMorphs.push(m);
      }
    }
    // Not sure this is *actually* w dupes...
    morphL[j] = mostStronglyImpliedMorphs[0];
  }
  return morphL;
}

var morphList = function(chromaL, chormaVL, n){
  var morphL = new Array(n);
  var initMorph = [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6];
  var c0 = chromaL[0];
  var m0 = initMorph[c0];
  var morphInt = [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6];
  var mtct0 = new Array(12);
  for(var ct=0; ct<12; ct++){
    mtct0[ct] = (7 + m0 - morphInt[(12+c0-ct) % 12]) % 7;
  }
  var mctj = new Array(12);
  var ctmj = new Array(7);
  var smj = new Array(7);
  for(var j=0; j<n; j++){
    for(ct=0; ct<12; ct++){
      mctj[ct] = (7+morphInt[(12+chromaL[j]-ct)%12] + mtct0[ct]) % 7;
    }
    for(var m=0; m<7; m++){
      ctmj[m] = new Array();
      for(ct=0; ct<12; ct++){
        if(mctj[ct]===m){
          ctmj[m].unshift(ct);
        }
      }
    }
    for(m=0; m<7; m++){
      smj[m] = 0;
      var thing = ctmj[m];
      for(var i=0; i<thing.length; i++){
        smj[m] += chromaVL[j][thing[i]];
      }
    }
    morphL[j] = smj.indexOf(Math.max.apply(Math, smj));
  }
  return morphL;
}

var morpheticPitchList = function (sortedOCPList, morphL, n){
  var morpheticPitches = new Array(n);
  for(i=0; i<n; i++){
    var chromaticP = sortedOCPList[i][1];
    var morph = morphL[i];
    var morphOct1 = Math.floor(chromaticP/12);
    var morphOct2 = morphOct1 + 1;
    var morphOct3 = morphOct1 - 1;
    var mp1 = morphOct1 + (morph / 7);
    var mp2 = morphOct2 + (morph / 7);
    var mp3 = morphOct3 + (morph / 7);
    var chroma = (chromaticP + 12) % 12;
    var cp = morphOct1 + (chroma/12);
    var diffL = [Math.abs(cp - mp1), Math.abs(cp-mp2), Math.abs(cp-mp3)];
    var morphOctList = [morphOct1, morphOct2, morphOct3];
    var bestMorphOct = morphOctList[diffL.indexOf(Math.min.apply(Math, diffL))];
    var bestMorphPitch = morph+(7*bestMorphOct);
    morpheticPitchList[i] = bestMorphPitch;
  }
  return morpheticPitchList;
}

var OPNList = function(sortedOCPList, morpheticPitches, n, justDiatonicNumber){
  var OPNl = new Array(n);
  for(var i=0; i<n; i++){
    if(justDiatonicNumber){
      OPNl[i] = [sortedOCPList[i][0], morpheticPitchList[i]];
    } else {
      OPNl[i] = [sortedOCPList[i][0], p2pn(sortedOCPList[i][1], morpheticPitchList[i])];
    }
  }
  return OPNl;
}

var p2pn = function(cp, mp){
  var letterNames = "ABCDEFG";
  var letterName = letterNames[mp%7];
  var undisplacedChromas = [0, 2, 3, 5, 7, 8, 10];
  var undisplacedChroma = undisplacedChromas[mp%7];
  var ASAOctaveNo = Math.floor(mp/7);
  var displacement = cp - (12 * ASAOctaveNo) - undisplacedChroma;
  var accidental = "";
  if(displacement>0){
    for(var d=0; d<displacement; d++){
      accidental+="s";
    }
  } else if(displacement<0){
     for(d=0; d>displacement; d--){
       accidental+="f";
     }
  } else {
    accidental = "n";
  }
  if(mp%7>1) ASAOctaveNo++;
  return {"name": letterName, "accidental": accidental, "octave": ASAOctaveNo};
}
