function longestIncreasingSubsequence(X){
  // based on Wikipedia article
  var N=X.length;
  X.unshift();
  var M=new Array(X.length+1);
  var P=new Array(X.length + 1);
  var L=0;
  for(var i=0; i<=N; i++){
    var j;
    if(L==0 || X[M[1]] >= X[i]){
      j = 0;
    } else {
      var lo = 1;
      var hi = L+1;
      while(lo<hi-1){
        var mid = Math.ceil((lo+hi)/2);
        if(X[M[mid]]<X[i]){
          lo = mid;
        } else {
          hi = mid;
        }
      }
      j = lo;
    }
    P[i] = M[j];
    if(j==L || X[i] < X[M[j+1]]){
      M[j+1] = i;
      L = Math.max(L, j+1);
    }
  }
  X.shift();
  return L;
  // var output = [];
  // var pos = M[L];
  // while(L>0){
  //   output.push(X[pos]);
  //   pos = P[pos];
  //   L--;
  // }
  // output.reverse();
  // return output;
}

function arrayDimension(axis, arr){
  arr.map(function(a){return a[axis];});
}
function first(array){
  return array[0];
}
function orderedNGramResultCompare(a, b){
  if(a[1]<b[1]){
    return -1;
  } else if (a[1]>b[1]){
    return 1;
  } else if (a[0]>b[0]) {
    return -1;
  } else if (a[0]<b[0]) {
    return 1;
  }
  return 0;
}
function findOrderedMatches(piecewiseHits){
  // piecewiseHits is in the form <pieceID, ngramNo, <results>>
  // where <results> ::= <hitCount, <hits>>
  // and   <hits>    ::= <<time, pitch>*>
  var results = [];
  for(var i=0; i<piecewiseHits.length; i++){
    var seq1 = [];
    for(var j=0; j<piecewiseHits[i].length; j++){
      if(typeof(piecewiseHits[i][j])!=='undefined'
          && piecewiseHits[i][j].length){
        var hits = piecewiseHits[i][j][1];
        for(var k=0; k<hits.length; k++){
          seq1.push([j, hits[k][0]]);
        }
      }
    }
    seq1.sort(orderedNGramResultCompare);
    var seq = seq1.map(first);
    results[i] = longestIncreasingSubsequence(seq);
  }
  return results;
};
