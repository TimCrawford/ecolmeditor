function sort(array){
  // Based on rosettacode.org/wiki/Sorting_algorithms/Quicksort#JavaScript
  function swap(i, j){
    var t = array[i];
    array[i] = array[j];
    array[j] = t;
  }
  function insertionSort(left, right){
    for (var i=left; i<=right; i++){
      var k = array[i];
      for(var j=i; j>0 && (k[0]<array[j-1][0] 
                           || (k[0]===array[j-1][0] && k[1]<array[j-1][1])); j--){
        array[j] = array[j-1];
      }
      array[j] = k;
    }
  }
  function quicksort(left, right) {
    if(left<right){
      // Still have partition to sort
      var pivot = array[left+Math.floor((right-left)/2)];
      var leftNew = left;
      var rightNew = right;
      do {
        while(array[leftNew][0] < pivot[0]
              || (array[leftNew][0]===pivot[0] 
                  && array[leftNew][1]<pivot[1])) {
          leftNew+=1;
        }
        while(pivot[0] < array[rightNew][0]
              || (pivot[0]===array[rightNew][0] 
                  && pivot[1]<array[rightNew][1])) {
          rightNew-=1;
        }
        if(leftNew <= rightNew){
          swap(leftNew, rightNew);
          leftNew += 1;
          rightNew -= 1;
        }
      } while (leftNew<=rightNew);
      if(rightNew-left<10){
        insertionSort(left, rightNew);
      } else {
        quicksort(left, rightNew);
      }
      if(right-leftNew<10){
        insertionSort(leftNew, right);
      } else {
        quicksort(leftNew, right);
      }
    }
    return array;
  }
  quicksort(0, array.length-1);
  return array;
}
function searchSetWithSort (needle, haystack, threshold) {
  var vectorTable = new Array(needle.length*haystack.length);
  if(threshold) var minCount = Math.max(threshold * needle.length);
  var index = 0;
  for(var i=0;i<needle.length; i++){
    for(var j=0; j<haystack.length; j++){
      vectorTable[index] = vectorDiff(needle[i], haystack[j]);
      index++;
    }
  }
  sort(vectorTable);
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
      if(threshold){
        if(count >= minCount){
          if(bestCount){
            bestCount.push(count);
            bestVectors.push(vectorTable[i-1]);
          } else {
            bestCount = [count];
            bestVectors = [vectorTable[i-1]];
          } 
        }
      } else {
        if(!bestCount || count>bestCount){
          bestCount = count;
          bestVectors = [vectorTable[i-1]];
        } else if(count===bestCount){
          bestVectors.push(vectorTable[i-1]);
        }
      }
      count = 0;
    }
    count++;
  }
  return [bestCount, bestVectors];
}
var masterMotiveName = function(path){
  var dir = path.lastIndexOf("/");
  path = path.substring(dir+1);
  return path.split("_")[0];
};
var isMajor = function(path){
  var dir = path.lastIndexOf("/");
  path = path.substring(dir+1);
  return path.indexOf('major.')>-1;
};
var isMinor = function(path){
  var dir = path.lastIndexOf("/");
  path = path.substring(dir+1);
  return path.indexOf('minor.')>-1;
};
var writeResult=function(file, q, qfile, target, scores, vectors, num, den){
  var submotive=JSON.stringify(q);
  var motive = masterMotiveName(qfile);
  for(var i=0; i<scores.length; i++){
    var out = new Array(motive, submotive, target, 
      isMajor(qfile) ? 1 : 0, isMinor(qfile) ? 1 : 0, num ? num : 1, den ? den : 1,
      scores[i], q.length, vectors[i][0], vectors[i][1]);
    fs.appendFileSync(file, out.join("\t")+"\n");
  }
};
