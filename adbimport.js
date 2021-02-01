/****** Utilities *******/

function freq2midi(f) {
	var a_pitch = 440;
	var midi = 69 + (12*Math.log(f/a_pitch)/(Math.log(2)));
	return Math.round(midi);
}

function DOMTextEl(tag, cname, id, content){
  var el = document.createElement(tag);
  if(cname) el.className = cname;
  if(id) el.id = id;
  if (content) {
    if(typeof(content)=="string"){
      el.appendChild(document.createTextNode(content));
    } else {
      el.appendChild(content);
    }
  }
  return el;  
}

function AddRowNo(row, n){
  row.id="r"+n;
  var rows = table.children;
  for(var i=0; i<rows.length; i++){
    if(Number(rows[i].id.substring(1)) > n){
      table.insertBefore(row, rows[i]);
      return;
    }
  }
  table.appendChild(row);
}

/***********************/

var context = new webkitAudioContext();
var table = false;
var ie = false;

$(document).ready(function(){
  table = document.getElementById('results');
});
// Check for the various File API support.
if (window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem) {
  // Great success! All the File APIs are supported.
} else {
  alert('The File APIs are not fully supported in this browser.');
}

function changeHandler(inputElement){
  // Fired when inputElement's list of files changes.
  // Reads each file and runs load_handler on it.
  ie = inputElement;
  window.setTimeout(handleFiles, 500);
}

function handleFiles(){
  var inputElement = ie;
  var fileReader = new FileReader();
  var fileList = inputElement.files;
  var count = fileList.length;
  var log = document.getElementById("log1");
  var div;
  log.appendChild(DOMTextEl("p", false, false, count+" files:"));
  for(var n=0; n<count; n++){
    fileReader = new FileReader();
    div = DOMTextEl("div", "indented", false,
      DOMTextEl("span", "no", false, n+": "));
    div.appendChild(DOMTextEl("span", "no", false, fileList[n].name));
    log.appendChild(div);
    fileReader.readAsArrayBuffer(fileList[n]);
    fileReader.onload=makeLoadHandler(fileList[n].name, n);
  }
}

function makeLoadHandler(filename, n){
  return function(event){
    loadHandler(event, filename, n);
  };  
}

function doServerStuff(analysis, eTime, filename, n){
  analysis.fname = filename;
  analysis.time = eTime;
  $.post("str2feat3.php", analysis,
    function(row){ addRowNo(results, n);});
}

function loadHandler(event, filename, n){
  var timeStart = new Date().getTime();
  var buffer = event.target.result;
  var analysis = process(buffer);
  var elapsedTime = new Date().getTime() - timeStart;
  doServerStuff(analysis, elapsedTime, filename);
}

function process(data){
  var feat_str = "";
  var audioSource = context.createBufferSource();
	var frames_per_sec = 4;
	var fftSize = 16384;
	var sampled = [];
	audioSource.buffer = context.createBuffer(data,true);
	var sampleBuffer = audioSource.buffer.getChannelData(0);
	var duration = (sampleBuffer.length/44100).toFixed(0);
	audioSource.connect(context.destination);
	var sampleRate = context.sampleRate;
	var hopSize = sampleRate/frames_per_sec;

	for(var start_sample=0; start_sample<= sampleBuffer.length-fftSize;) {
		for(var z=start_sample; z<=start_sample+(fftSize)-1;z++) {
			if(sampled.length==fftSize) sampled.shift();
			sampled.push(sampleBuffer[z]);
		}
	
		var fft = new FFT(fftSize, sampleRate);
		fft.forward(sampled);
	
		var p_cs = [0,0,0,0,0,0,0,0,0,0,0,0];
		var fs = 44100; var fBinCount = (fft.spectrum.length/2)-1;
		for(f = 1; f <= fft.spectrum.length; f++) { // omit bin 0
			var m_p =freq2midi(f*fs/fBinCount) % 12;
			var sp = fft.spectrum[f];
			if(!isNaN(sp)) {
				p_cs[m_p] += -1e4 * sp;
			}
		}
	
		document.getElementById("log2").innerHTML+= "";
		var total=0;
		var garbage = false;
		for(var g=0;g<p_cs.length;g++) {
		  // Tim: This adds to total before checking for NaN. Is that the intention?
		  // What I mean is that if a one-off value being nonsense is acceptable,
		  // you could do:
		  // if(isNaN(p_cs[g])){
		  //   garbage = true;
		  //   continue;
		  // }
		  // total += p_cs[g];
		  // Failing that, if garbage being true means this should all be zero,
		  // why keep on with the loop?
			total += p_cs[g];
			if (isNaN(p_cs[g])) garbage = true;
		}
		if(total == 0) garbage = true;		
		if(!garbage) {
		  for(var g=0;g<p_cs.length;g++) {
			  feat_str += (p_cs[g]/total).toFixed(6)+" ";
		  }
		} else for(var g=0;g<p_cs.length;g++) {
			feat_str += 0.0+" ";
		}
		feat_str +=" "
		start_sample += hopSize;
	}
	return {vals: feat_str, dir: "test", fps: frames_per_sec, duration: duration};
}
