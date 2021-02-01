///////////////////
// 
// In this file, the basics for managing multiple extracts
//
function offlineUser(){
  this.assignments = [{imageURL: false, 
    tabcode: " ", contextDur: "Q", contextTuning: ren_G,
    tabType: "Italian", fontName: "Varietie", history: false,
    id: false, num: false, allocated: false, submitted: false,
    edited: false, message: false, messageType: false,
    state: 0}];
  this.getDBAssignments = function(){
    edit(this.assignments[0]);
  };
  this.refreshAssignments = function (){
    this.getDBAssignments();
  };
  this.getAssignmentById = function(id){
    //
  };
  this.dbSynchronise = function(doc, submit){
    //
  };
  this.commitMessage = function(id, types, message){
    //
  };
  this.changePwd=function(){
    //
  };
  this.nextAssignmentFn = function(backn){
    //
  };
  this.prevAssignmentFn = function(forwardn){
    //
  };
  this.latest = function(){
    //
  };
  this.earliest = function(){
    //
  };
  this.refreshAssignments();
}
