function ornamentbox(note){
  this.note = note;
  this.fingering = new Array();
  this.fingering["l"] = getfingering(note, "l"); // Really
  this.fingering["r"] = getfingering(note, "r"); // necessary?
  this.ornset = false;
  this.setHand = function (fingering){
    this.fingering[fingering.ornament.hand] = fingering.ornament;
    for(var i=0; i<this.ornset.length; i++){
      if(this.ornset[i].ornament.eType=="Fingering" &&
          this.ornset[i].ornament.hand==fingering.ornament.hand){
        this.ornset[i].selected = this.ornset[i]==fingering;
        this.ornset[i].updateButton();
      }
    }
  };
  this.accept = function(){
    var tc = "";
    for(var i=0; i<this.ornset.length; i++){
      if(this.ornset[i].selected){
        tc += this.ornset[i].ornament.TCString();
      }
    }
    TabCodeDocument.parameters.history.add(new Modify(this.note.starts+2, 
      this.note.TC, tc, document.getElementById('code'), "extras"));
    clearButtons();
  };
  this.acceptfunction = function(thing){
    return function(){
      thing.accept();
    };
  };
  this.clearfunction = function(thing){
    return function(){
      TabCodeDocument.parameters.history.add(new Modify(thing.note.starts+2, 
        thing.note.TC, "", document.getElementById('code'), "extras"));
      clearButtons();
    };
  };
  this.buttons = function(){
    var buttons = new Array(this.ornset.length);
    for (var i=0; i<buttons.length; i++){
      buttons[i] = this.ornset[i].button;
    }
    return buttons;
  };
  this.draw = function(x, y){
    buttonBox(this.buttons(), x, y, 
      [textButton("OK", "OrnOK", this.acceptfunction(this), "Ok",false),
      textButton("clearall", "ornclear", this.clearfunction(this), "Remove all", false)]);
  };
  this.ornset = ornamentset(note, this);
}

function getfingering(note, hand){
  for(var i=0; i<note.extras.length; i++){
    if(note.extras[i].eType=="Fingering" && note.extras[i].hand==hand){
      return note.extras[i];
    }
  }
  return false;
}

function ornamentset(note, box){
  var buttons = new Array(allOrnaments.length);
  for(var i=0; i<allOrnaments.length; i++){
    buttons[i] = new ornbutton(allOrnaments[i], note, box);
  }
  return buttons;
}
//dOB(id, class, callback, obj, selected)
function ornbutton(ornament, note, box){
  this.parent = box;
  this.ornament = ornament;
  this.note = note;
  this.selected = false;
  this.ornamentPresent = function(){
    var checkDetails = this.ornament.eType=="Fingering" 
      && (this.ornament.type=="dotFingering" 
          || this.ornament.type == "numberFingering");
    for(var i=0; i<this.note.extras.length; i++){
      if(this.note.extras[i].type == this.ornament.type){
        if(checkDetails){
          if ((typeof(this.ornament.count) != "undefined" 
               && this.note.extras[i].count == this.ornament.count)
              || (typeof(this.ornament.number) != "undefined" 
                && this.note.extras[i].number == this.ornament.number)){
            return true;
          }
        } else{
          return true;
        }
      }
    }
    return false;
  };
  this.select = function(thing){
    return function(){
      thing.selected = !thing.selected;
      if(thing.selected && thing.ornament.eType == "Fingering"){
        thing.parent.setHand(thing);
      }
      thing.updateButton();
    };
  };
  this.updateButton = function(){
    if(this.selected){
      $(this.button).addClass("selected");
    } else {
      $(this.button).removeClass("selected");
    }    
  };
  if(typeof(this.ornament.htmlObj) != "function") alert(JSON.stringify(this.ornament));
  this.selected = this.ornamentPresent();
  this.button = DOMObjectButton("buttonfor"+this.ornament.type, 
    "ornbutton "+this.ornament.eType+
      (this.ornament.eType=="Fingering" ? " Fingering"+this.ornament.hand:""),
    this.select(this),
    this.ornament.htmlObj(),
    this.ornamentPresent());
}