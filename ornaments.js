function ShorthandExtra(character){
	switch (character){
	  case ",":
		  return new backfall(1, 5);
	  case "<":
		  return new forefall2(4);
	  case "#":
      return new bebung1(7);
	  case "x":
      return new martellement(3);
	  case "~":
      return new bebung2(7);
	  case "u":
		  return new forefall1(7);
	  case ":":
      return new dotFingering(2, 7);
	  case "!":
      return new thumbLine(7);
    case "*":
      return new starTenuto(0);
	  case "-":
	  case '"':
		  return false;
    default:
      return false;
	};
}

function ParseFullExtra(code, note) {
	var limit = code.length - 1;
	var i=0;
	if(i>limit){
		return false;
	}
	var curchar = code.charAt(i);
	if(curchar == "O"){
		i++;
		if(i>limit) return false;
		curchar = code.charAt(i);
		var type = curchar;
		var subtype = 0; //default
		var position = false;
		i++;
		if(i>limit) return false;
		curchar = code.charAt(i);
		if(curchar != ":" && curchar != ")"){
			subtype = Number(curchar);
			i++;
			if(i>limit) return false;
			curchar = code.charAt(i);
		}
		if(curchar == ":") {
			i++;
			if(i>limit) return getOrnament(type, subtype, false);
			curchar = code.charAt(i);
			if(Number(curchar))
				position = Number(curchar);
		}
		return getOrnament(type, subtype, position);
	} else if(curchar == "F") {
		var finger = false;
		var position = false;
    var hand = false;
    var obj;
		i++;
		if(i>limit) return false;
		curchar = code.charAt(i);
		if(curchar == "l" || curchar == "r"){
			// could keep this info, but it makes no difference to
			// display
      hand = curchar;
			i++;
			if(i>limit) return false;
			curchar = code.charAt(i);
		}
		if(curchar == "."){
			// dot is a special case
			finger = 0;
			while (curchar == "."){
				finger++;
				i++;
				if(i>limit) return new dotFingering(finger, 7);
				curchar = code.charAt(i);
			}
			obj = new dotFingering(finger, 7);
		} else if(curchar == "1" || curchar == "2" ||
				  curchar == "3" || curchar == "4") {
			obj = new numberFingering(curchar, 3);
		} else {
			obj = new symbolFingering(curchar, 7);
		}
    if(hand) obj.hand = hand;
    return obj;
	} else if(curchar == "C") {
		// var finger = false;
		// var position = false;
    // var hand = false;
    let line, id;
		i++;
		if(i>=limit) {
			// this is a straight line to the next symbol (C)
			line = new ConnectingLine(code, false);
			line.startNote = note;
			return line;
		}
		curchar = code.charAt(i);
		if(curchar==='-'){
			// Retrieve existing line – we're closing it now
			i++;
			if(i>=limit) return false;
			id = code.substr(i).match(/^[0-9]+/);
			if(id){
				// retrieve line from Tablature lines array;
				line = TabCodeDocument.numberedLines[Number(id[0])-1];
				if(!line) {
					console.log("Close without opening for line number", id);
					return;
				}
				line.endNote = note;
				line.endCode = code;
				i += id[0].length;
				if(i>=limit) return line;
				// Get Position
				i++;
				if(i>=limit) return line;
				curchar = code.charAt(i);
				if(isNaN(Number(curchar))) return line;
				line.endPosition = Number(curchar);
				return line;
			}
		} else if(curchar==='d' || curchar==='u'){
			line = new ConnectingLine(code, false);
			line.startNote = note;
			line.direction = curchar;
			return line;
		} else {
			// Make new line
			// i++;
			// if(i>limit) return false;
			id = code.substr(i).match(/^[0-9]+/);
			if(id){
				// retrieve line from Tablature lines array;
				line = new ConnectingLine(code, Number(id[0])-1);
				line.startNote = note;
				// get direction & Position
				i += id[0].length;
				if(i>=limit) return line;
				// Get Position
				if(code.charAt(i) !==':') console.log("Broken connecting line "+code+" at char "+i);
				i++;
				if(i>=limit) return line;
				curchar = code.charAt(i);
				if(curchar==='-'){
					line.direction="d";
					i+=2;
					if(i>=limit) return line;
				} else if (curchar==='d' || curchar==='u'){
					line.direction = curchar;
				} else if (i<limit-1){
					line.direction="u";
				} 
				i++;
				if(i>=limit) return line;
				if(/^[1-8]+/.test(code.charAt(i))) line.startPosition = Number(code.charAt(i));
				return line;
			}
		}
		if(curchar == "l" || curchar == "r"){
			// could keep this info, but it makes no difference to
			// display
      hand = curchar;
			i++;
			if(i>limit) return false;
			curchar = code.charAt(i);
		}
		if(curchar == "."){
			// dot is a special case
			finger = 0;
			while (curchar == "."){
				finger++;
				i++;
				if(i>limit) return new dotFingering(finger, 7);
				curchar = code.charAt(i);
			}
			obj = new dotFingering(finger, 7);
		} else if(curchar == "1" || curchar == "2" ||
				  curchar == "3" || curchar == "4") {
			obj = new numberFingering(curchar, 3);
		} else {
			obj = new symbolFingering(curchar, 7);
		}
    if(hand) obj.hand = hand;
    return obj;
	}
	return false;
}

function dotFingering(count, position) {
  // FIXME: Crazy constants, magic numbers
	this.count = count;
	this.position = position;
  this.nullfret = false;
  this.tType = false;
  this.eType = "Fingering";
  this.type = "dotFingering";
  this.hand = "r";
  this.dx = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else if (this.tType == "Italian"){
      return (this.count-1) * -2 + 2.5;
    } else {
      return (this.count-1) * -3.5 + 2.5;
    }
  };
  this.dy = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else if (this.tType == "Italian"){
      return 6;
    } else {
      return 8;
    }
  };
  this.eq = function(o2){
    return this.eType===o2.eType && this.type===o2.type
      && this.count===o2.count 
      && this.position===o2.position;
  };
  this.textString = function(){
    return new Array(this.count+1).join(".");
  };
  this.htmlObj = function(){
    return DOMDiv("fingering fdots", "fdotselector", this.textString());
  };
  this.TCString = function(){
    switch(this.count) {
      case 1:
        if(this.hand == "r" && this.position == 7){
          return ".";
        } else {
          return "(F"+this.hand+".:"+this.position+")";
        }
      case 2:
        if(this.hand == "r" && this.position == 7){
          return ":";
        } else {
          return "(F"+this.hand+"..:"+this.position+")";
        }
      default:
        return "(F"+this.hand+this.textString()+":"+this.position+")";
    }
  };
	this.draw = function(xpos, ypos, svgel, note) {
    this.tType = curTabType;
    var el = svgText(svgel, xpos + this.dx(), ypos+this.dy(), "extra fingering fdots", 
        false, false, this.textString());
    $(el).data("word", note);
	};
}

function ConnectingLine(code, number){
	this.startCode = code;
	this.number = number;
	this.startNote = false;
	this.startPosition = false;
	this.endNote = false;
	this.endPosition = false;
	this.endCode = false;
	this.direction = false;
	this.tType = false;
	this.eType = "Line";
	this.type = "conectingLine";
	if(this.number || this.number===0) {
		if(TabCodeDocument.numberedLines[this.number]) {
			console.log("ERROR: DUPLICATE ID...OVERWRITING", this.number);
		}
		TabCodeDocument.numberedLines[this.number] = this;
	} else {
		TabCodeDocument.unnumberedLines.push(this);
	}
	this.draw = function(){
	}
}
function numberFingering(number, position) {
	this.number = number;
	this.position = position;
  this.nullfret = false;
  this.tType = false;
  this.eType = "Fingering";
  this.type = "numberFingering";
  this.hand = "l";
  this.dx = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else if (this.tType == "Italian"){
      return 9;
    } else {
      return 7;
    }
  };
  this.dy = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else if (this.tType == "Italian"){
      return -9;
    } else {
      return -6;
    }
  };
  this.eq = function(o2){
    return this.eType===o2.eType && this.type===o2.type
      && this.count===o2.count 
      && this.position===o2.position;
  };
  this.htmlObj = function(){
    return DOMDiv("fingering numbered", "fnumselector", this.number);
  };
  this.TCString = function(){
    return "(F"+this.hand+this.number+":"+this.position+")";
  };
	this.draw = function(xpos, ypos, svgel, note){
    this.tType = curTabType;
    var el = svgText(svgel, xpos+this.dx(), ypos-this.dy(), 
      "extra fingering numbered", false, false, this.number);
    $(el).data("word", note);
	};
}

function symbolFingering(symbol, position) {
  // FIXME: This is nonsense
	this.symbol = symbol;
	this.position = position;
  this.nullfret = false;
  this.tType = false;
  this.eType = "Fingering";
  this.type = "symbolFingering";
  this.hand = "r";
  this.dx = function (){
    // FIXME: ignoring this.position
    return 0;
  };
  this.dy = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else {
      return 5;
    } 
  };
  this.eq = function(o2){
    return this.eType===o2.eType 
      && this.symbol===o2.symbol
      && this.position===o2.position;
  };
  this.htmlObj = function(){
    return DOMDiv("extra fingering symbol "+this.hand, "fsymbolselector", this.symbol);
  };
  this.TCString = function(){
    return "(F"+this.hand+this.symbol+":"+this.position+")";
  };
	this.draw = function(xpos, ypos, note){
    this.tType = curTabType;
    var el = svgText(svgel, xpos, ypos+5, "extra fingering symbol", false, false, this.symbol);
    $(el).data("word", note);
	};
}

function getOrnament(type, subtype, position){
	switch(type){
	case "a":
		return new backfall(Number(subtype), position);
		break;
	case "c":
		if(subtype=="2")
			return new forefall2(position);
		else
			return new forefall1(position);
		break;
	case "d":
		return new etoufment(position);
		break;
	case "e":
		return new bebung1(position);
		break;
	case "f":
		return new mordent(position);
	};
	return false;
}

function backfall(count, position){
	this.count = count;
	this.position = position;
  this.nullfret = false;
  this.tType = false;
  this.eType = "Ornament";
  this.type = "backfall";
  this.dx = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else {
      return 10;
    }
  };
  this.dy = function (){
    // FIXME: ignoring this.position
    return 0;
  };
  this.htmlObj = function(){
    return DOMDiv("orn backfall", "ornselector",")");
  };
  this.eq = function(o2){
    return this.eType===o2.eType && this.type===o2.type
      && this.count===o2.count 
      && this.position===o2.position;
  };
  this.TCString = function(){
    if(this.position == 5) {
      return ",";
    } else {
      //FIXME: not true
      return "(Oa"+this.count+":"+this.position+")";
    }
  };
	this.draw = function(xpos, ypos, svgel, note) {
    this.tType = curTabType;
    var el = svgText(svgel, xpos+this.dx(), ypos+this.dy(), "extra orn backfall", false, false, new Array(1+this.count).join(")"));
    $(el).data("word", note);
    return xpos+this.dx() + el.getBBox().width;
	};
}

function forefall1(position){
	this.position = position;
  this.nullfret = false;
  this.tType = false;
  this.eType = "Ornament";
  this.type = "forefall1";
  this.dx = function (){
    // FIXME: ignoring this.position
    return 0;
  };
  this.dy = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else {
      return ld/5;
    }
  };
  this.eq = function(o2){
    return this.eType===o2.eType && this.type===o2.type
      && this.position===o2.position;
  };
  this.htmlObj = function(){
    return DOMDiv("orn textforefall", "ornselector","˘");
  };
  this.TCString = function(){
    if(this.position == 7) {
      return "u";
    } else {
      return "(Oc1:"+this.position+")";
    }
  };
	this.draw = function(xpos, ypos, svgel, note){
    this.tType = curTabType;
    var el = svgPath(svgel, 
      ["M "+xpos+","+(ypos+this.dy())+" A 6, 5, 0, 0, 0, "
          + (xpos+ld/1.8)+","+(ypos+this.dy())]
      ,"extra orn forefall", false);
    $(el).data("word", note);
    return xpos+ld/1.8;
	};
}

function forefall2(position){
	this.position = position;
  this.nullfret = false;
  this.tType = false;
  this.eType = "Ornament";
  this.type = "forefall2";
  this.dx = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else {
      return -5;
    }
  };
  this.dy = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else {
      return 0;
    }
  };
  this.eq = function(o2){
    return this.eType===o2.eType && this.type===o2.type
      && this.position===o2.position;
  };
  this.htmlObj = function(){
    return DOMDiv("ornament textforefallii", "ornselector", "(");
  };
  this.TCString = function(){
    if(position == "4"){
      return "<";
    } else {
      return "(Oc2:"+position+")";
    }
  };
	this.draw = function(xpos, ypos, svgel, note){
    this.tType = curTabType;
    var el = svgText(svgel, xpos+this.dx(), ypos+this.dy(), 
      "extra orn forefallii", false, false, "(");
    $(el).data("word", note);
    return xpos+this.dx() + el.getBBox().width;
	};
}

function etoufment(position){
	this.position = position;
  this.nullfret = false;  
  this.tType = false;
  this.eType = "Ornament";
  this.type = "etoufment";
  this.dx = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else {
      return ld/3;
    }
  };
  this.dy = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else {
      return -ld/3;
    }
  };
  this.eq = function(o2){
    return this.eType===o2.eType && this.type===o2.type
      && this.position===o2.position;
  };
  this.htmlObj = function(){
    return DOMDiv("ornament textetoufment", "ornselector", "//");
  };
  this.TCString = function(){
    return "(Od:"+position+")";
  };
	this.draw = function(xpos, ypos, svgel, note){
    this.tType = curTabType;
    var step = ld/3;
    var el = svgLine(svgel, xpos+this.dx(), ypos+this.dy, 
      xpos+this.dx()+step, ypos+this.dy()+2*step, 
      "extra orn etoufment", false);
    $(el).data("word", note);
    return xpos+this.dx() + el.getBBox().width;
	};
}

function bebung1(position){
	this.position = position;
  this.nullfret = false;
  this.tType = false;
  this.eType = "Ornament";
  this.type = "bebung1";
  this.dx = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return -ld/5;
    } else {
      return 2 * ld/3;
    }
  };
  this.dy = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return ld/6;
    } else {
      return -ld/2;
    }
  };
  this.eq = function(o2){
    return this.eType===o2.eType 
      && this.position===o2.position;
  };
  this.htmlObj = function(){
    return DOMDiv("ornament textbebung", "ornselector", "#");
  };
  this.TCString = function(){
    if((!this.nullfret && this.position == "3") || 
        (this.nullfret && this.position == 0)){
      return "#";
    } else {
      return "(Oe:"+position+")";
    }
  };
	this.draw = function(xpos, ypos, svgel, note){
    this.tType = curTabType;
    var el = svgText(svgel, xpos+this.dx(), ypos+this.dy(), 
      "extra orn bebungi", false, false, "#");
    $(el).data("word", note);
    return xpos+this.dx()+el.getBBox().width;
	};
}

function starTenuto(position){
	this.position = position;
  this.nullfret = false;
  this.tType = false;
  this.eType = "Ornament";
  this.type = "starTenuto";
  this.dx = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return -ld/30;
    } else {
      return -ld/30;
    }
  };
  this.dy = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return ld/4;
    } else {
      return ld/4;
    }
  };
  this.eq = function(o2){
    return this.eType===o2.eType 
      && this.position===o2.position;
  };
  this.htmlObj = function(){
    return DOMDiv("ornament textstartenuto", "ornselector", "*");
  };
  this.TCString = function(){
    if(this.position == 0){
      return "*";
    } else {
      //FIXME
      return "(O*:"+position+")";
    }
  };
	this.draw = function(xpos, ypos, svgel, note){
    this.tType = curTabType;
    var el = svgText(svgel, xpos+this.dx(), ypos+this.dy(), 
      "extra orn startenuto", false, false, "*");
    $(el).data("word", note);
    return xpos+this.dx()+el.getBBox().width;
	};
}

function martellement(position){
	this.position = position;
  this.nullfret = false;
  this.tType = false;
  this.eType = "Ornament";
  this.type = "martellement";
  this.dx = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else {
      return 2*ld/3;
    }
  };
  this.dy = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else {
      // HACKHACK
      if(this.tType == "Italian"){
        return -ld/2;
      } else {
      // return -2*ld/3;
        return 0;
      }
    }
  };
  this.eq = function(o2){
    return this.eType===o2.eType 
      && this.position===o2.position;
  };
  this.htmlObj = function(){
    return DOMDiv("ornament textmartellement martellement", "ornselector", "x");
  };
  this.TCString = function(){
    if((!this.nullfret && this.position==3) 
      || (this.nullfret && this.position==0)){
      return "x";
    } else {
      return "(Of:"+position+")";
    }
  };
	this.draw = function(xpos, ypos, svgel, note){
    this.tType = curTabType;
    var el = svgText(svgel, xpos+this.dx(), ypos+this.dy(), 
      "extra orn martellement", false, false, "*");
    $(el).data("word", note);
    return xpos+this.dx()+el.getBBox().width;
	};
}

function mordent(position){
	this.position = position;
  this.nullfret = false;
  this.tType = false;
  this.eType = "Ornament";
  this.type = "mordent";
  this.dx = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else {
      return 2*ld/3;
    }
  };
  this.dy = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else {
      return 2*ld/3;
    }
  };
  this.eq = function(o2){
    return this.eType===o2.eType 
      && this.position===o2.position;
  };
  this.htmlObj = function(){
    return DOMDiv("ornament textmordent mordent", "ornselector", "x");
  };
  this.TCString = function(){
    return "(Og:"+position+")";
  };
	this.draw = function(xpos, ypos, svgel, note){
    this.tType = curTabType;
    var el = svgText(svgel, xpos+this.dx(), ypos+this.dy(), 
      "extra orn mordent", false, false, "x");
    $(el).data("word", note);
    return xpos+this.dx()+el.getBBox().width;
	};
}

function bebung2(position){
	this.position = position;
  this.nullfret = false;
  this.tType = false;
  this.eType = "Ornament";
  this.type = "bebung2";
  this.dx = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else {
      return ld/3;
    }
  };
  this.dy = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else {
      return ld/3;
    }
  };
  this.eq = function(o2){
    return this.eType===o2.eType 
      && this.position===o2.position;
  };
  this.htmlObj = function(){
    return DOMDiv("ornament textbebungii bebungii", "ornselector", "~");
  };
  this.TCString = function(){
    if(position==3){
      return "~";
    }else {
      return "(Oh:"+position+")";
    }
  };
	this.draw = function(xpos, ypos, svgel, note){
    this.tType = curTabType;
    var el = svgText(svgel, xpos+this.dx(), ypos+this.dy(), 
      "extra orn bebungii", false, false, "~");
    $(el).data("word", note);
    return xpos+this.dx()+el.getBBox().width;
	};
}

function thumbLine(position){
	this.position = position;
  this.nullfret = false;
  this.tType = false;
  this.eType = "Fingering";
  this.type = "thumbLine";
  this.hand = "r";
  // FIXME: Isn't this a fingering??
  this.dx = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else {
      return 3*ld/10;
    }
  };
  this.dy = function (){
    // FIXME: ignoring this.position
    if(this.nullfret) {
      return 0;
    } else if (this.tType == "Italian"){
      return 2*ld/5;
    } else {
      return 3*ld/4;
    }
  };
  this.eq = function(o2){
    return this.eType===o2.eType 
      && this.position===o2.position;
  };
  this.htmlObj = function(){
    return DOMDiv("ornament textthumbline", "ornselector", "|");
  };
  this.TCString = function(){
    if(position==7){
      return "!";
    }else {
      return "(F"+(this.hand=="r" ? "" : "l")+"!:"+position+")";
    }
  };
	this.draw = function(xpos, ypos, svgel, note) {
    this.tType = curTabType;
    var el = svgLine(svgel, xpos+this.dx(), ypos+this.dy(), xpos+this.dx(), 
      ypos+this.dy()+3*ld/5-1, "extra fingering thumb", false);
    // if (curTabType == "Italian") {
    //   var el = svgLine(svgel, xpos+(3*ld/10), ypos+(2*ld/5), xpos+(3*ld/10), ypos+ld-1,
    //     "fingering thumb", false);
    // } else {
    //   var el = svgLine(svgel, xpos+(3*ld/10), ypos+(4*ld/5), xpos+(4*ld/3), ypos+ld-1,
    //     "fingering thumb", false);
    // }
    $(el).data("word", note);
    return xpos+(3*ld/10)+el.getBBox().width;
	};
}

allOrnaments = [new backfall(1,5), new forefall2(4), 
  new bebung1(7), new martellement(3), new bebung2(7), new forefall1(7),
  new dotFingering(1,7), new dotFingering(2,7), new dotFingering(3,7),
  new thumbLine(7), new starTenuto(0)];

// function ornamentPresent(orntype, sequence){
//   for(var i=0; i<sequence.length; i++){
//     if(orntype==sequence.type) return true;
//   }
//   return false;
// }

function selectOrnament(htmlobj, orn, current){
  if(orn.eType=="Fingering"){
    $(".selector.fingering "+orn.hand).parents("selected").removeClass("selected");
    htmlobj.addClass("selected");
  }
}
