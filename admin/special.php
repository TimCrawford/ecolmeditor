<?php
$administrators = array("t.crawford@gold.ac.uk", "d.lewis@gold.ac.uk");
$pwd = file_get_contents($_SERVER['DOCUMENT_ROOT']."/../CGI-Executables/ecolmpwd.txt");
// N.B. I've set up this account so that it can be accessed from
// outside. Ultimately we probably want to use port 3306 (so that it's
// only visible from within the firewall). We can also restrict the
// account so that it can only connect from rvw or whichever computer
// this script runs on.
$db = $pwd ? new mysqli("igor.gold.ac.uk", "ecolm_contrib", trim($pwd), "ecolmIII", 65041) : false;
$maxAlloc = 2;
$pref = "all";
$maxOpen = 1;
function tellAdmins($subject, $content){
  global $administrators;
  for($i=0; $i<count($administrators); $i++){
    $header = "From: ECOLM admin <admin@rvw.doc.gold.ac.uk>";
    mail($administrators[$i], $subject, $content, $header);
  }
}

function user_assignments_super($user){
  global $db;
  $records = array();
  $query = "SELECT description, classmark, imageNumber, part,
       u.systemNumber systemNumber, u.prevUnit prevUnit, u.duration ctxdur, 
       u.tuning ctxTuning, u.font ctxFont, 
       u.tabtype ctxTabtype, u.ocr_tabcode ocr_tabcode, u.imagePath imagePath,
       name, state, Alloc.allocID id, history,
       Alloc.duration duration, Alloc.tuning tuning, Alloc.font font, 
       Alloc.tabtype tabtype, tabcode, prev.finalFlag prevFlag, Alloc.allocDate allocDate,
       Alloc.editDate editDate, Alloc.submitDate submitDate, Alloc.message message,
       Alloc.messageType messageType
     FROM Allocation AS Alloc LEFT JOIN Contributor AS User USING (username)
            LEFT JOIN Unit u USING (unitID) LEFT JOIN Face USING (faceID)
            LEFT JOIN Batch USING (batchID) 
            LEFT JOIN Unit prev ON u.prevUnit = prev.unitID
     WHERE username='$user' and approved=1
     ORDER BY Alloc.allocDate DESC;";
  $result = $db->query($query);
  // Potentially, there are three sets of global variables for context
  // flag, etc -- one from the previous system's (OTR) tabcode, one
  // from the general defaults (specified per system, just in case we
  // have prior knowledge, though we could do it on a per-source
  // basis) and one from the current editor. At later stages, we will
  // also have corrected tabcode.
  //FIXME: check command name
  $i = $result->num_rows;
  while($row=$result->fetch_assoc()){
    $record = array();
    $record['num'] = $i;
    $record['description'] = $row['description'];
    $record['classmark'] = $row['classmark'];
    $record['imageURL'] = $row['imagePath'] . ($_POST['colour'] ? "" : "_gray").".png";
    $record['tabcode'] = $row['tabcode'] ? $row['tabcode'] : $row['ocr_tabcode'];
    $record['contextDur'] = ($row['duration'] ?
                             $row['duration'] : 
                             ($row['prevFlag'] ? 
                              $row['prevFlag'] :
                              ($row['ctxdur'] ? $row['ctxdur'] : "Q")));
    $record['contextTuning'] = json_decode($row['tuning'] ? $row['tuning'] : $row['ctxTuning']);
    $record['tabType'] = $row['tabtype'] ? $row['tabtype'] : $row['ctxTabtype'];
    $record['fontName'] = $row['font'] ? $row['font'] : $row['ctxFont'];
    $record['id'] = $row['id'];
    $record['history'] = $row['history'];
    $record['description'] = $row['description'];
    $record['classmark'] = $row['classmark'];
    $record['state'] = $row['state'];
    $record['allocated'] = $row['allocDate'];
    $record['submitted'] = $row['submitDate'];
    $record['edited'] = $row['editDate'];
    $record['message'] = $row['message'];
    $record['messageType'] = $row['messageType'];
    $records[] = $record;
    $i--;
  }
  return $records;
}

function sync_assignment_super($user, $id, $dur, $tuning, $font, $tabtype, $tabcode, $finalFlag, $state, $history, $state, $submit){
  global $db;
  $query = "UPDATE Allocation LEFT JOIN Contributor USING (username)
    SET duration='$dur', tuning='".json_encode($tuning)."', font='$font', tabtype='$tabtype',
        tabcode='$tabcode', state='$state', finalflag='$finalFlag', history='$history',
        editDate=NULL ".(($state=="2" AND $submit) ? ", submitDate=NULL " : " ").
    "WHERE allocID=$id AND username='$user'";
  $ret = $db->query($query);
  if($state==2){
    random_allocation($user, 2, "all");
  }
  return $ret;
}

function review_applications(){
  global $db;
  $records = array();
  $result = $db->query("SELECT name, username, country, email FROM Contributor WHERE approved=0;");
  while($row=$result->fetch_assoc()){
    $records[]= $row;
  }
  return $records;
}

function all_allocations_please(){
  global $db;
  $records = array();
  $result = $db->query("SELECT unitID SysID, tabcode tc, state status
     FROM Allocation;");
  while($row=$result->fetch_assoc()){
    $records[]= $row;
  }
  return $records;
}

function survey_users(){
  global $db;
  $records = array();
  $result = $db->query("SELECT name, u.username username, country, email, approved, 
        MAX(TIMESTAMP(login)) AS lastlog, TO_DAYS(NOW())-TO_DAYS(MAX(DATE(submitDate))) submissionlag, 
        allocations
    FROM Contributor u LEFT JOIN Access a USING (username) LEFT JOIN Allocation al USING (username) 
            LEFT JOIN (SELECT username, COUNT(*) as allocations 
                            FROM Allocation 
                            GROUP BY username) AS al2 USING (username) 
    GROUP BY name;");
  while($row=$result->fetch_assoc()){
    $records[] = $row;
  }
  return $records;
}

function approve_application($uname, $em){
  global $db, $maxAlloc;
  if($db->query("SELECT * FROM Contributers WHERE username='$uname' AND approved=1")->field_count > 0) return;
  $db->query("UPDATE Contributor SET approved=1 WHERE username='$uname'");
  random_allocation($uname, $maxAlloc, "all");
  $header = "From: ECOLM admin <admin@rvw.doc.gold.ac.uk>";
  mail($em, "ECOLM Contributor Registration", "Your account has now been activated, and you can start editing at http://rvw.doc.gold.ac.uk/ecolmeditor/\n".
       "\n Thank you once again for volunteering to help us to correct our editions. \n".
       "\nProf. Tim Crawford\nPrincipal Investigator, ECOLM Project\nGoldsmiths, University of London",
       $header);
  tellAdmins("User application approved", "The user $uname has had his application to be a corrector approved.");
}

function add_batch($description, $classmark){
  global $db;
  echo "<code>INSERT INTO Batch (description, classmark) VALUES ('$description', '$classmark')</code>";
  echo $db->connect_error;
  $foo = $db->query("INSERT INTO Batch (description, classmark) VALUES ('$description', '$classmark')");
  return $db->insert_id;
}

function add_face($bid, $part, $imgno){
  global $db;
  $db->query("INSERT INTO Face (batchID, part, imageNumber) VALUES ($bid, '$part', '$imgno')");
  return $db->insert_id;
}

function add_unit($fid, $sys, $prev, $tuning, $font, $tabtype, $ocr, $imgPath, $finalFlag) {
  global $db;
  $db->query("INSERT INTO Unit (faceID, systemNumber, prevUnit, tuning, font, tabtype, ocr_tabcode, imagePath, finalFlag)
    VALUES ($fid, '$sys', ".($prev ? $prev : "NULL").", '$tuning', '$font', '$tabtype', '$ocr', '$imgPath', '$finalFlag')");
  return $db->insert_id;
}

function reset_password($username){
  global $db;
  file_put_contents("/tmp/file.txt", "UPDATE Contributor SET password='".md5($username)."' WHERE username='$username'");
  $db->query("UPDATE Contributor SET password='".md5($username)."' WHERE username='$username'");
  return "ok";
}

function all_units(){
  global $db;
  $result = $db->query("SELECT COUNT(*) FROM Unit;");
  return $result->fetch_row()[0];
}
function all_submitted_units_in_book($batchid){
  global $db;
  $result = $db->query("SELECT * FROM unit NATURAL JOIN face WHERE batchID=$batchid");
}
function all_submitted_units(){
  global $db;
  $result = $db->query("SELECT COUNT(*) FROM Allocation WHERE state='2' GROUP BY unitID;");
  return $result->fetch_row()[0];
}
function all_submitted_allocations(){
  global $db;
  $result = $db->query("SELECT COUNT(*) FROM Allocation WHERE state='2';");
  return $result->fetch_row()[0];
}
?>
