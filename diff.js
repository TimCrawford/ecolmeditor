function History(){
  this.back = [];
  this.forward = [];
  this.undo = function() {
    var operation = this.back.pop();
    if(operation){
      operation.undo();
      this.forward.push(operation);
      refresh();
    }
  };
  this.redo = function() {
    var operation = this.forward.pop();
    if(operation){
      operation.redo();
      this.back.push(operation);
      refresh();
    }
  };
  this.revert = function(){
    while(this.back.length){
      this.undo();
    }
  };
  this.add = function(operation){
    this.back.push(operation);
    this.forward = [];
    refresh();
  };
  this.toJSON = function(){
    return {back: this.back, forward: this.forward};
  };
}

function Modify(index, from, to, textField, objType){
  this.index = index;
  this.to = to + ""; // coerce numbers to strings
  this.source = textField;
  this.from = from + "";
  this.type = objType;
  if(!index && index!=0) alert("aaah!");
  this.source.value = this.source.value.substring(0, index)
      +this.to+this.source.value.substring(index+this.from.length);
  this.undo = function(){
    this.source.value = this.source.value.substring(0, index)
      +this.from+this.source.value.substring(index+this.to.length);
  };
  this.redo = function(){
    this.source.value = this.source.value.substring(0, index)
      +this.to+this.source.value.substring(index+this.from.length);
  };
  this.toJSON = function(){
    return {dtype: "modify", index:this.index, to:this.to, from:this.from, obj:this.type};
  };
}

function compoundModify(changes, textField, type){
  this.changes = changes;
  this.type = type;
  this.source = textField;
  // Make changes from last to first to avoid losing track of positions
  this.changes.sort(function(a,b){return b[0]-a[0];});
  var mod;
//  for(var i=this.changes.length-1; i>=0; i--){
  for(var i=0; i<this.changes.length; i++){
    mod = changes[i];
    this.source.value = this.source.value.substring(0, mod[0])
                          + mod[2] + this.source.value.substring(mod[0]+mod[1].length);
  }
  this.undo = function(){
    var mod;
//     for(var i in this.changes){
     for(var i=this.changes.length-1; i>=0; i--){
      mod = this.changes[i];
      this.source.value = this.source.value.substring(0, mod[0])
                            + mod[1] + this.source.value.substring(mod[0]+mod[2].length);
    }
  };
  this.redo = function(){
    var mod;
//     for(var i=this.changes.length-1; i>=0; i--){
    for(var i in this.changes){
      mod = changes[i];
      this.source.value = this.source.value.substring(0, mod[0])
                            + mod[2]
                            + this.source.value.substring(mod[0]+mod[1].length);
    }
  };
  this.toJSON = function(){
    return {dtype: "compound", changes: this.changes, obj: this.type};
  };
}

function replaceContextFlag(params, to){
  this.params = params;
  this.from = this.params.contextDur;
  this.to = to;
  this.params.contextDur = to;
  this.undo = function(){
    this.params.contextDur = this.from;
  };
  this.redo = function(){
    this.params.contextDur = this.to;
  };
  this.toJSON = function(){
    return {dtype: "cflag", from: this.from, to: this.to};
  };
}

function replaceContextTuning(params, to){
  this.params = params;
  this.from = this.params.contextTuning;
  this.to = to;
  this.params.contextTuning = to;
  this.undo = function(){
    this.params.contextTuning = this.from;
  };
  this.redo = function(){
    this.params.contextTuning = this.to;
  };
  this.toJSON = function(){
    return {dtype: "ctuning", from: this.from, to: this.to};
  };
}

function importHistory(jstring){
  var his = new History();
  try {
    var jobj = JSON.parse(jstring);
    if(jobj){
      his.back = jobj.back.map(importDiff);
      his.forward = jobj.forward.map(importDiff);
    }
  } catch (e){
    // There is a problem here (to do with escaped braces, I think)
  }
  return his;
}

function importDiff(jobj){
  if(jobj){//FIXME: add identity diff
    var par = curParams;
    var textField = document.getElementById('code');
    switch(jobj.dtype){
      case "modify":
        return new Modify(jobj.index, jobj.from, jobj.to, textField, jobj.obj);
      case "compound":
        return new compoundModify(jobj.changes, textField, jobj.obj);
      case "cflag":
        var diff = new replaceContextFlag(par, jobj.to);
        diff.from = jobj.from;
        return jobj;
    }
  }
}
