// Attempt at Needleman-Wunsch for two tabcode objects

function filter(seq){
  //strip comments
  var newseq = [];
  for(var i=0; i<seq.length; i++){
    if(seq[i].tType!=="Comment" && seq[i].tType!=="ruleset") newseq.push(seq[i]);
  }
  return newseq;
}
function dist(w1, w2){
  if(w1.tType!==w2.tType) return 1;
  switch (w1.tType){
    case "SystemBreak":
    case "PageBreak":
    case "PieceBreak":
    case "Barline":
      // ignore differences in detail
      return true;
    case "Meter":
      return meterDiff(w1, w2);
    case "Chord":
      return chordDiff(w1, w2);
    default:
      alert(w1.tType);
      return 0;
  }
}

function meterDiff(m1, m2){
  // FIXME: for now
  return this.code===this.code ? 0 : 1;
}
function chordDiff(m1, m2){
  var cost = 0;
  var max = 0;
  if(m1.flag || m2.flag){
    max++;
    if(m1.flag!==m2.flag) cost++;
  }
  if(m1.dotted || m2.dotted){
    max++;
  }
  if(m1.beamed || m2.beamed){
    max++;
    if(m1.beamed!==m2.beamed) cost++;
  }
  for(var i=0; i<m1.mainCourses.length; i++){
    if(m1.mainCourses[i] || m2.mainCourses[i]){
      max++;
      if(!m1.mainCourses[i] || !m2.mainCourses[i]){
        cost++;
      } else {
        if(m1.mainCourses[i].fret!==m2.mainCourses[i].fret) cost++;
      }
    }
  }
  for(i=0; i<m1.bassCourses.length; i++){
    if(m1.bassCourses[i] || m2.bassCourses[i]){
      max++;
      if(!m1.bassCourses[i] || !m2.bassCourses[i]){
        cost++;
      } else {
        if(m1.bassCourses[i].fret!==m2.bassCourses[i].fret) cost++;
      }
    }
  }
  return cost/max;
}

function NW (seq1, seq2){
  this.s1 = filter(seq1);
  this.s2 = filter(seq2);
  this.a=new array(this.s1.length);
  function setCosts(){
    var dist, del, ins;
    for(var i=0; i<this.s1.length; i++){
      this.a[i].push(new array(this.s2.length));
      for(var j=0; j<this.s2.length; j++){
        if(!i) {
          this.a[i][j]=j;
        } else if(!j) {
          this.a[i][j]=i;
        } else {
          dist = dist(this.s1[i], this.s2[i]);
          del = this.a[i-1][j]+1;
          ins = this.a[i][j-1]+1;
          this.a[i][j] = Math.min(dist, del, ins);
        }
      }
    }
    return this.a[this.s1.length-1][this.s2.length-1];
  }
}

 // SystemBreak
 // PageBreak
 // Comment
 // Chord
 // TabNote
 // bassNote
 // Barline
 // Meter
