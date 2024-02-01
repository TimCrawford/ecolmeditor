//var curParams;
var UITuning = 0;
var UIFont = "Varietie";
var stashed = false;
var TO = false;
var corpusVectors = false;
editable = window.location.search.indexOf("readonly=1")==-1;
locPrefix = "../";

var full_query = "";

var selectedChord = 0;
var endChord = 0;
var ng_len = 0;
function goto(){
	selectedChord = parseInt(document.getElementById('chord').value);
	endChord = parseInt(document.getElementById('chord_sel_end').value);
	ng_len = parseInt(document.getElementById('ng_len').value);
	if(endChord<selectedChord) alert("End chord must be >= "+selectedChord);
	else {
 		hilite.length=0; // empty the hilite array
		TabCodeDocument.draw();
		refresh();
		window.scrollTo(0,sel_window_scroll);
    	}
}

function refreshFromTabCode(){
  if(TO) clearTimeout(TO);
  // TO = setTimeout(function(){parseTCDoc($("#code")[0].value);}, 250);
  TO = setTimeout(function(){refresh2();}, 250);
}

/*

function refreshFromTabCode(){
  if(TO) clearTimeout(TO);
  // TO = setTimeout(function(){parseTCDoc($("#code")[0].value);}, 250);
//   TO = setTimeout(function(){refresh2();}, 250);
  TO = setTimeout(function(){refresh();}, 250);
}
*/

function refresh2(){
  curBeams = 0;
  var newTC = new Tablature($("#code")[0].value, TabCodeDocument.SVG, curParams);
  var newdiff = new NW(TabCodeDocument.TabWords, newTC.TabWords);
  if(newdiff.setCosts()>0){
    if(editable) updatePage();
    TabCodeDocument.draw();
    TabCodeDocument = newTC;
    TabCodeDocument.makeMidi();
    if(editable) updatePage();
  } else {
    TO = setTimeout(function(){parseTCDoc($("#code")[0].value);}, 1000);
  }
}
function nextFont(){
  return UIFont == "Varietie" ? "Tabfont" : "Varietie";
}
function defaultFont(){
  if(curParams.tabType == "Italian"){
    document.getElementById("switchTabFont").disabled = true;
    return "Italian";
  } else {
    document.getElementById("switchTabFont").disabled = false;
    return UITuning < 3 ? "Varietie" : "Tabfont";
  }
}

function toggleTabType(field){
  curParams.tabType = curParams.tabType == "Italian" ? "French" : "Italian";
  field.innerHTML = "Type: "+curParams.tabType;
  UIFont = defaultFont();
  document.getElementById("switchTabFont").innerHTML = "Font: "+UIFont;
  refresh();
}

function toggleFont(field){
  UIFont = nextFont();
  field.innerHTML = "Font: "+UIFont;
  curParams.fontName = UIFont;
  refresh();
}

function rotateTuning(field){
  UITuning = (UITuning+1) % tunings.length;
  curParams.contextTuning = tunings[UITuning][1];
  document.getElementById("switchTuning").innerHTML = tunings[UITuning][0];
  refresh();
}
function getCorpus(){
  $.ajax({
   type: 'POST',
   async: true,
   url: '../siamese/complete-ecolm.json',
   datatype: 'json',
   timeout: 5000,
   contentType: "application/x-www-form-urlencoded;charset=UTF-8",
   failure: function(){
     logger.log("Retrieval failed for JSON-data", ID);
   },
   success: function(data){
     corpusVectors = data;
   }
  });
}

function getGerbodeCorpus(){
  $.ajax({
   type: 'POST',
   async: true,
//   url: '../siamese/Gerbode4.json',
   url: '../siamese/new_6675_incipits.json',
   datatype: 'json',
   timeout: 5000,
   contentType: "application/x-www-form-urlencoded;charset=UTF-8",
   failure: function(){
     logger.log("Retrieval failed for JSON-data", ID);
   },
   success: function(data){
     corpusVectors = data;
   }
  });
}

function initialiseTestPage(urlParams){
  // FIXME: This is just for now...

// logger.log(full_query = getTopnoteCode(urlParams.get("tc_path"),false,urlParams.get("window")));

  breaks = true;
  breakOptions = ["System", "Page"];
  if(window.location.search.indexOf('diff')==-1){
    $(document.getElementById('stash')).hide();
    $(document.getElementById('compare')).hide();    
  }
  $(document.getElementById('tcspan')).hide();
  $(document.getElementById('pchange')).hide();
  $(document.getElementById('hideprevbutton')).hide();
  $(document.getElementById('browse')).hide();
  curParams = new Parameters();
  curUser = new offlineUser();
  // tempo slider stuff from  http://loopj.com/jquery-simple-slider/
 	$("[data-slider]").each(function () {
                            var input = $(this);
 		                        $("<span>").addClass("output")
 			                        .insertAfter($(this));
 		                      })
 	                  .bind("slider:ready slider:changed", 
                          function (event, data) {
 		                          $(this).nextAll(".output:first")
 			                               .html(data.value.toFixed(1));
 		                      }); 
  showTempoValue();
  
  var q_text = urlParams.get("query");
  var m_text = urlParams.get("matchcode");
  var q_arr = q_text.split("");
  var m_arr = m_text.split("");
  
  
  const id_node = document.createElement("div");
  const id_textnode = document.createTextNode(urlParams.get("id")+":");
  id_node.style.marginLeft = "20px";
  id_node.appendChild(id_textnode);
  
  const q_node = document.createElement("div");
  q_node.style.marginLeft = "200px";
  const m_node = document.createElement("div");
  m_node.style.marginLeft = "200px";
  const q_textnode = document.createTextNode(" ");
  const m_textnode = document.createTextNode(" ");
  q_node.appendChild(q_textnode);
  m_node.appendChild(m_textnode);
 
 //  for(i=0;i<q_arr.length;i++){
//   	if((q_arr[i]=="x")||(q_arr[i]=="y")) {
// //   		q_node.innerHTML += " <span class='matched'>"+q_arr[i]+"</span>";
//   		q_node.innerHTML += "<span class='matched'>"+q_arr[i]+"</span>";
//   	}
// //   	else q_node.innerHTML += " "+q_arr[i];
//   	else q_node.innerHTML += q_arr[i];
//   }
  
  q_node.innerHTML = compareCodesHiliteToHTML(full_query, m_text);
  
  for(i=0;i<m_arr.length;i++){
  	if((m_arr[i]=="x")||(m_arr[i]=="y")) {
//   		m_node.innerHTML += " <span class='matched'>"+m_arr[i]+"</span>";
  		m_node.innerHTML += "<span class='matched'>"+m_arr[i]+"</span>";
  	}
//   	else m_node.innerHTML += " "+m_arr[i];
  	else m_node.innerHTML += m_arr[i];
  }
  
  
//   m_node.innerHTML = m_arr[0]+ " <span class='matched'>"+m_arr[1]+"</span>";
  document.getElementById("top_fixed_container").appendChild(id_node);
  document.getElementById("top_fixed_container").appendChild(q_node);
  document.getElementById("top_fixed_container").appendChild(m_node);
  
}

function copyParams(params){
  return new Parameters(params.imageURL, params.tabcode, params.contextDur, 
    params.contextTuning, params.tabType, params.fontName, params.history);
}
function stash(){
  if(TabCodeDocument) 
    stashed = new Tablature(TabCodeDocument.code, svg(1000,1000), copyParams(TabCodeDocument.parameters));
}
function compare(){
  if(stashed){
    var diff = new NW(stashed.TabWords, TabCodeDocument.TabWords);
    alert(diff.HumanReadableDiff());
  }
}

