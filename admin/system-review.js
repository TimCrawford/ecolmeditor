var system, completed;

function SystemSet(row){
  this.id = row['SysID'];
  this.tc1 = row['tc'];
  this.doc1 = false;
  this.status1 = row['status'];
  this.tc2 = false;
  this.doc2 = false;
  this.status2 = false;
  this.diff = false;
  this.score = false;
  this.addRow = function (row){
    this.tc2 = row['tc'];
    this.status2 = row['status'];
  };
  this.compare = function(){
    if(this.tc1 && this.tc2){
      this.doc1 = new Tablature(this.tc1, svg(1000,1000), {imageURL: false, 
    tabcode: this.tc1, contextDur: "Q", contextTuning: ren_G,
    tabType: "Italian", fontName: "Varietie", history: false,
    id: false, num: false, allocated: false, submitted: false,
    edited: false, message: false, messageType: false,
    state: 0});
      this.doc2 = new Tablature(this.tc2, false, {imageURL: false, 
    tabcode: this.tc2, contextDur: "Q", contextTuning: ren_G,
    tabType: "Italian", fontName: "Varietie", history: false,
    id: false, num: false, allocated: false, submitted: false,
    edited: false, message: false, messageType: false,
    state: 0});
      if(this.doc1.TabWords.length && this.doc2.TabWords.length){
        this.diff = new NW(this.doc1.TabWords, this.doc2.TabWords);
        this.score = this.diff.setCosts();
      }
    } 
  };
}

function getSystems(){
  $.ajax({
    type: 'POST',
    async: false,
    url: "admin.php",
    datatype: 'json',
    data: {"sysCheck": true},
    contentType: "application/x-www-form-urlencoded;charset=UTF-8",
    failure: function(){
      alert("Connection failure -- ask David about this (if you really are connected)");
    },
    error: function(a, b, c){
      alert(a.statusText+" "+b+" "+c);
    },
    success: function(data){
      var results=JSON.parse(data);
      system = [];
      completed = [];
      var differ = [];
      var sysid;
      for(var i=0; i<results.length; i++){
        sysid = results[i]['SysID'];
        if(system[sysid]){
          system[sysid].addRow(results[i]);
          system[sysid].compare();
          completed.push(system[sysid]);
          if(system[sysid].score===0) differ.push(system[sysid]);
        } else {
          system[sysid] = new SystemSet(results[i]);
        }
      }
      document.body.appendChild(DOMTextEl('p', "pre", "pre",
        completed.length+" systems have been allocated twice (another "+
            (results.length - completed.length)+" only once)"));
      document.body.appendChild(DOMTextEl('p', "pre", "pre2",
        "Of those, "+differ.length+" differ in some vaguely significant way"));
    }
  });
}
