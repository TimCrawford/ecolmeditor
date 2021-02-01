var boxes = false;
var cursorColour = "#B0E0E6";

function BBox(x1, y1, x2, y2, owner){
  this.owner = owner;
  this.bottom = Math.round(Math.max(y1, y2));
  this.top = Math.max(0, Math.floor(Math.min(y1, y2)));
  this.left = Math.max(0, Math.floor(Math.min(x1, x2)));
  this.right = Math.round(Math.max(x1, x2));
  this.width = this.right - this.left;
  this.height = this.bottom - this.top;
  this.draw = function(lcontext){
    this.owner.highlight(lcontext);
  };
  this.addToIndex = function(set){
    var index = set.index;
    var slices = set.slices;
    for(var x=this.left; x<= Math.min(this.right, index.length-1); x++){
      if(!slices[x]){
        // This is a slightly weak way of doing things -- effectively,
        // the idea of slices is to help make a single
        // insertion/interaction point wherever the cursor is. For
        // simplicity, I'm requiring this to mean one event only at a
        // time. This may need refinement later...
        slices[x] = this;
      }
      for(var y=this.top; y<= Math.min(this.bottom, index[x].length-1); y++){
        if(index[x][y]){
          index[x][y].push(this);
        } else {
          index[x][y] = [this];
        }
      }
    }
    return index;
  };
  this.click = function(x, y){
    this.owner.click(x,y);
//    selectObject(this.owner);
  };
  this.insertIn = function (x, y, pageX, pageY){
    var chord = (this.owner.tType == "Chord" && this.owner) || this.owner.chord;
    var sysPos = sysPosY(y);
    var set;
    switch(sysPos){
      case "flag":
        chord.click(pageX, pageY, chord);
        // if(chord.lbeams==0 && chord.rbeams == 0){
        //   set = rhythmButtonSet(pageX, pageY, chord);
        //   genericSelector(set, pageX, pageY, []);
        // } else {
        //   beamTable()
        // }
        break;
      case "bass":
        break;
      default:
        // is a fret
        var course;
        if(currentTabType == "Italian"){
          course = 6-sysPos;
        } else {
          course = sysPos+1;
        }
        var insertPoint = chord.insertPoint(course);
        set = (currentTabType=="Italian"
                   && italianTabSet(pageX, pageY, [course, insertPoint, false, false]))
              || frenchTabSet(pageX, pageY, [course, insertPoint, false, false]);
        genericSelector(set, pageX, pageY, []);
        break;
    }
  };
  this.insertAfter = function(x, y, pageX, pageY){
    var chord = (this.owner.tType == undefined && this.owner.chord) || this.owner;
    var sysPos = sysPosY(y);
    var set;
    switch(sysPos){
      case "flag":
        set = rhythmButtonSet(pageX, pageY, [chord.finishes, true, false]);
        genericSelector(set, pageX, pageY, []);
        break;
      case "bass":
        break;
      default:
        var course;
        if(currentTabType == "Italian"){
          course = 6-sysPos;
        } else {
          course = 1+sysPos;
        }
        set = (currentTabType=="Italian"
                   && italianTabSet(pageX, pageY, [course, chord.finishes, true, false]))
              || frenchTabSet(pageX, pageY, [course, chord.finishes, true, false]);
        genericSelector(set, pageX, pageY, []);
        break;
    }
  };
  this.cursor = function(x, y, ctx){
    if(this.owner.tType == "chord"){
      this.drawCursor(x, y, this.owner, ctx);
    } else if(this.owner.tType == undefined) {
      // a tabNote
      this.drawCursor(x, y, this.owner.chord, ctx);
    }
  };
  this.drawCursor = function(x, y, chord, ctx) {
    var ypos = chord.ypos;
    var sysPos = sysPosY(y);
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = cursorColour;
    ctx.lineWidth = 2;
    if(sysPos == "flag"){
      if(!chord.flag){
        ctx.strokeRect(this.left, Math.max(0, Extract.flagy(ypos)-90), this.width, ypos+10);
      }
    } else if (typeof(sysPos) == "number"){
      if((currentTabType == "Italian" && !chord.mainCourses[5-sysPos])
          ||(currentTabType != "Italian" && !chord.mainCourses[sysPos])){
        ctx.strokeRect(this.left, ypos+12.5 + sysPos*15, this.width, 15);
//        ctx.fillText(step, x, y);
      }
    }
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  };
}

function BBoxSet(cont, canv){
  this.context = cont;
  this.canvas = canv;
  this.index = new Array(this.canvas.width+1);
  this.slices = new Array(this.canvas.width+1);
  this.currentBoxes = [];
  for(var x=0; x<=this.canvas.width; x++){
    this.index[x] = new Array(this.canvas.height+1);
  }
  this.add = function(BBox){
    // Adds a Bounding shape to the pixel index
    //this.index = BBox.addToArray(this.index); // This would probably work
                                       // without the assignment
    BBox.addToIndex(this);
  };
  this.highlight = function(x, y){
    // Given a mouse coordinate draws all bounding regions registered
    // for that pixel.
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
//    document.getElementById('debug').innerHTML = x+", "+ y;
    if(!this.index.every(function(v,i,a) {return typeof(v)!="undefined";})){
  // commented out because messes up StructuredComment
  //    alert(this.index);
    } 
//    var matches = this.index[x][y];
    if(typeof(this.index[x][y]) == 'undefined' || !this.index[x][y].length){
      this.cursor(x, y);
    } else {
      var matches = this.index[x][y];
      for(var i=0; i<matches.length; i++){
        matches[i].draw(this.context);
      }
    }
  };
  this.click = function(x, y, e){
    var matches = this.index[x][y];
    if(matches == undefined){
      this.insert(x, y, e);
      return;
    } else {
      matches[0].click(e.pageX, e.pageY, this.context);
      // for(var i=0; i<matches.length; i++){
      //   matches[i].click(e.pageX, e.pageY, this.context);
      // }
    }
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  };
  this.insert = function(x, y, e){
    if(this.slices[x]){
      this.slices[x].insertIn(x, y, e.pageX, e.pageY);
    } else {
      for(var x2=x; x2>=0; x2--){
        if(this.slices[x2]){
          this.slices[x2].insertAfter(x, y, e.pageX, e.pageY);
          return;
        }
      }
      insertAtStart(x,y,e.pageX,e.pageY);
    }
  };
  this.cursor = function(x, y){
    var slice = this.slices[x];
    if(slice){
      slice.cursor(x, y, this.context);
    } else {
      this.cursorLine(x);
    }
  };
  this.cursorLine = function(x){
    var mainctx = context;
    context.save();
    context = this.context;
    context.strokeStyle = cursorColour;
    // FIXME: need system register
    drawBarline(x, cury);
    context.restore();
    context = mainctx;
  };
}

function emptyCourses (chord){
  return chord.mainCourses.reduce(function(acc, el, i, a){if(!el) acc.push(i); return acc;}, []);
}

function sysRelY (y) {
  // System-relative y position (N.B. assumes no top margin)
  return y%leading;
}

function sysPosY (y){
  // position on nearest staff. Possible values: "flag","bass", [0-5]
  y= y%leading;
  if(y<17.5){
    return "flag";
  } else if(y> 17.5 + (15*6) ){
    return "bass";
  } else {
    return Math.floor((y - 17.5)/15);
  }
}

function insertAtStart(x, y, pageX, pageY){
  var sysPos = sysPosY(y);
  var set;
  switch(sysPos){
    case "flag":
      set = rhythmButtonSet(pageX, pageY, [0, false, true]);
      genericSelector(set, pageX, pageY, []);
      break;
    case "bass":
      break;
    default:
      var course;
      if(currentTabType == "Italian"){
        course = 6-sysPos;
      } else {
        course = 1+sysPos;
      }
      set = (currentTabType=="Italian"
              && italianTabSet(pageX, pageY, [course, 0, false, true]))
            || frenchTabSet(pageX, pageY, [course, 0, false, true]);
      genericSelector(set, pageX, pageY, []);
      break;
    }
}
