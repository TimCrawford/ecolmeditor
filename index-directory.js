// var dir = require('node-dir');
// var rr = require('recursive-readdir');
//var ds = require('diveSync');
var rrs = require('recursive-readdir-sync');
var outputVectors = [];
var outputFilename = false;
var vectorsFromTabcodeFile = function(error, code, filename, next){
  console.log(filename);
  console.log(code);
  var tab = new Tablature(code, false, 
                          new Parameters(false, code, 'Q', ren_G, 
                                         'French', 'Varietie', new History()));
  outputVectors.push([filename, vectorizeTabcodeObject(tab, ren_G), tab.getDuration()/4]);
};
var writeOutputVectors = function(){
  fs.writeFileSync(outputFilename, JSON.stringify(outputVectors), 'utf8');
};
var readFileArray = function(fileArray){
  var vex = [];
  for(var i=0; i<fileArray.length; i++){
    if(/.*\.tc/.test(fileArray[i])){
      var tc = fs.readFileSync(fileArray[i], 'utf8');
      var tab = new Tablature(tc, false, new Parameters(false, tc, 'Q', ren_G, 
        'French', 'Varietie', new History()));
      vex.push([fileArray[i], vectorizeTabCodeObject(tab, ren_G), tab.getDuration()/4]);
    }
  }
  fs.writeFileSync(outputFilename, JSON.stringify(vex), 'utf8');
};
var readDirectory = function(directory, outpath){
  outputFilename = outpath;
  console.log(directory);
  console.log(outputFilename);
  var files = rrs(directory);
  readFileArray(files);
};
var useCorpus = function(filename){
  var corpusText = fs.readFileSync(filename, 'utf8');
  return JSON.parse(corpusText);
};
