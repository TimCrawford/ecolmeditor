var vectors = [];
var rawData = false;
var editable = false;
function currentStatus(id, status, message){
  var parent = document.getElementById(id);
  if(!parent) return;
  var stat = $(parent).find('.status')[0];
  stat.innerHTML = message;
  stat.className = "status "+status;
}
function parseDatum(i, dummySVG){
  if(!rawData[i].Tabcode){
    logger.log("no tabs for ",rawData[i].ID);
    return;
  }
  var tab = new Tablature(rawData[i].Tabcode, dummySVG ? dummySVG : svg(1, 1), 
                          new Parameters(false, rawData[i].Tabcode, 'Q', ren_G, 'French', 
                                         'Varietie', new History()));
//  tab.draw();
  vectors.push([Number(rawData[i].ID), vectorizeTabCodeObject(tab, ren_G), tab.getDuration()/4]);
  currentStatus('parse', 'running', Math.floor((100 * vectors.length / rawData.length)) + "% parsed");
}
function parseData(){
  var done = [];
  for(var i=0; i<rawData.length; i++){
    if(done.indexOf(rawData[i].ID)===-1){
      parseDatum(i);
      done.push(rawData[i].ID);
    }
  }
  currentStatus('parse', 'done', 'Complete');
}
function uploadResults(){
  currentStatus('upload', 'running', 'Connecting and uploading...');
  $.ajax({
    type: 'POST',
    async: true,
    url: '../db.php',
    datatype: 'json',
    data: { newIndex:   JSON.stringify(vectors) },
    contentType: "application/x-www-form-urlencoded;charset=UTF-8",
    failure: function(){
      logger.log("Upload failed");
    },
    success: function(){
      currentStatus('upload', 'done', 'Complete (probably)');
    }
  });
}
function indexEverything(){
  currentStatus('load', 'running', 'Loading...');
  $.ajax({
    type: 'POST',
    async: true,
    url: '../db.php',
    datatype: 'json',
    data: { fullIndex:   true },
    contentType: "application/x-www-form-urlencoded;charset=UTF-8",
    failure: function(){
      logger.log("Retrieval failed");
    },
    success: function(data){
      if(!data) alert("Query returned no data");
      rawData = JSON.parse(data);
      currentStatus('load', 'done', 'Complete');
      currentStatus('parse', 'running', 'starting...');
      parseData();
      uploadResults();
    }
  });

}