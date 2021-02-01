<?php
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
$administrators = array("t.crawford@gold.ac.uk", "d.lewis@gold.ac.uk");

function user_assignments($user, $password, $agent){
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
     Where username='$user' AND password='".md5($password)."' and approved=1
     ORDER BY Alloc.allocDate DESC;";
  file_put_contents("/tmp/specialLog.txt", $query."\n", FILE_APPEND);
  $result = $db->query($query);
  // Potentially, there are three sets of global variables for context
  // flag, etc -- one from the previous system's (OTR) tabcode, one
  // from the general defaults (specified per system, just in case we
  // have prior knowledge, though we could do it on a per-source
  // basis) and one from the current editor. At later stages, we will
  // also have corrected tabcode.
  //FIXME: check command name
  $i = $result->num_rows;
  file_put_contents("/tmp/specialLog.txt", "  --> Returned $i rows\n", FILE_APPEND);
  $t = "";
  $firstTime = true;
  while($row=$result->fetch_assoc()){
    if($i<5){
      if($firstTime){
        file_put_contents("/tmp/specialLog.txt", print_r($row, true)."\n", FILE_APPEND);
        $firstTime = false;
      }
    }
    $t .=$row['tuning'] ." -- " . $row['ctxTuning'] ."\n";
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
    $record['contextTuning'] = json_decode($row['tuning'] ? $row['tuning'] : $row['ctxTuning']); //?!?
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
  file_put_contents("/tmp/t.txt", $t);
  if(count($records)>0){
    $db->query("INSERT INTO Access (username, login, agent) VALUES ('$user', NULL, '$agent')");
  }
  return $records;
}

function add_message($user, $password, $id, $message, $messagetype){
  global $db;
  $setstring = "";
  if($message) $setstring .= "message='$message'".($messagetype ? ", " : "");
  if($messagetype) $setstring .= "messageType='$messagetype'";
  $query = "UPDATE Allocation LEFT JOIN Contributor USING (username)
            SET $setstring
            WHERE allocID=$id AND username='$user' AND password='".md5($password)."'";
  file_put_contents("/tmp/argh", $query);
  return $db->query($query);
}

function sync_assignment($user, $password, $id, $dur, $tuning, $font, $tabtype, $tabcode, $finalFlag, $state, $history, $state, $submit){
  global $db;
  $query = "UPDATE Allocation LEFT JOIN Contributor USING (username)
    SET duration='$dur', tuning='".json_encode($tuning)."', font='$font', tabtype='$tabtype',
        tabcode='$tabcode', state='$state', finalflag='$finalFlag', history='$history',
        editDate=NULL".(($state=="2" AND $submit) ? ", submitDate=NULL " : " ").
    "WHERE allocID=$id AND username='$user' AND password='".md5($password)."'";
  file_put_contents("/tmp/sync.txt", $query);
  $ret = $db->query($query);
  if($state==2){
    random_allocation($user, 2, "all");
  }
  return $ret;
}

function revert_assignment($user, $password, $id){
  global $db;
  $query = "UPDATE Allocation a LEFT JOIN Contributor c USING (username) LEFT JOIN Unit
              SET a.duration=NULL, a.tuning=NULL, a.font=NULL, a.tabtype=NULL, 
                  a.finalflag=NULL, a.history=NULL, a.message=NULL, a.state=0,
                  a.tabcode=ocr_tabcode
              WHERE allocID=$id AND c.username=$user AND password='".md5($password)."'";
  $ret = $db->query($query);
  return $ret;
}

function check_username($username){
  global $db;
  return($db->query("SELECT * FROM Contributor WHERE username='$username'")->num_rows);
}

function application_for_user($username, $fullname, $password, $country, $email){
  global $db, $administrators;
  // check that username not already allocated
  if($db->query("SELECT * FROM Contributor WHERE username='$username'")->num_rows > 0){
    return false;
  } else {
    for($i=0; $i<count($administrators); $i++){
      $header = "From: ECOLM admin <admin@rvw.doc.gold.ac.uk>";
      mail($administrators[$i], "New user", "A user has applied to become a contributor under the username $username.", $header);
    }
    return $db->query("INSERT INTO Contributor (name, username, password, country, email, approved) 
      VALUES ('$fullname', '$username', '".md5($password)."', '$country', '$email', 0)");
  }
}

function change_password($username, $password, $newpassword){
  global $db;
  return $db->query("UPDATE Contributor SET password='".md5($newpassword)."' 
      WHERE username='$username' AND password='".md5($password)."'");
}

function add_user($username, $fullname, $password, $country, $email){
  global $db;
  // check that username not already allocated
  if($db->query("SELECT * FROM Contributers WHERE username='$username'")->field_count > 0){
    return false;
  } else {
    return $db->query("INSERT INTO Contributor (name, username, password, country, email, approved) 
      VALUES ('$fullname', '$username', '".md5($password)."', '$country', '$email', 1)");
  }
}
function allocate_unit($username, $uid) {
  global $db, $maxOpen;
  $q = "SELECT * FROM Allocation WHERE username='$username' AND state<2";
  $r = $db->query($q);
  if($r->num_rows==0){
    $db->query("INSERT INTO Allocation (username, unitID, state, allocDate) VALUES ('$username', $uid, 0, NULL)");
    return $db->insert_id;
  }
}

function exclusions(){
  // First exclusion set is the second half of K1c12, which is a
  // duplicate of K1c13
  global $db;
  $units = array();
  $query = "SELECT * FROM ecolmIII.Face NATURAL JOIN Unit
            WHERE batchID=3 and CONVERT(imageNumber, UNSIGNED INTEGER) > 20;";
  $result = $db->query($query);
  if($result){
    while($row = $result->fetch_assoc()){
      $units[] = $row['unitID'];
    }
  }
  // Secondly, exclude anything that doesn't have a matching 
  // system in the metadata
  // This is quite a complicated looking query (and there's probably
  // a simpler way), but basically we find cases where we have metadata 
  // and then invert the selection to list those without.
  /*
  $query = "SELECT unitID 
             FROM Unit 
             WHERE unitID NOT IN 
                           (SELECT unitID 
                             FROM Unit 
                                  NATURAL JOIN SideFaces 
                                  NATURAL JOIN CatalogueSystems cs 
                                  LEFT JOIN CatalogueWorks cw USING (workID)
                             WHERE cs.WorkID != 'Blank'
                               AND cs.WorkID IS NOT NULL
                               AND systemNumber-1=System);";
  $result = $db->query($query);
  if($result){
    while($row = $result->fetch_assoc()){
      $units[] = $row['unitID'];
    }
  }
  */
  return $units;
}

function random_allocation($username, $max, $priorities="all"){
  global $db;
  return random_allocation_w_priority($username, $max, nearly_done_list());
  // CHECK THIS PROPERLY
  $query = "SELECT u.unitID AS uID, assigned
    FROM Unit u LEFT JOIN
     (SELECT unitID, count(*) assigned
        FROM Allocation
        GROUP BY unitID) as a1 USING (unitID)
    WHERE NOT EXISTS (SELECT * FROM Allocation a 
                      WHERE a.unitID=u.unitID AND username='$username')
      AND (ISNULL(assigned) OR assigned<$max)";
  if($priorities!="all"){
    $query .= " AND (unitID=".implode($priorities, " OR unitID=").")";
  }
  $query .= " ORDER BY rand() LIMIT 1;";
  file_put_contents("/tmp/dubious.txt", "<code>$query</code>");
  //FIXME: add randomness
  $result = $db->query($query);
  $id = $result->fetch_array();
  if(in_array($id[0], exclusions())) {
    return random_allocation($username, $max, $priorities);
  }
  $unit = allocate_unit($username, $id[0]);
  if($unit){
    return $unit;
  } else {
    file_put_contents("/tmp/missed.txt", "$username, ".$id[0]." failed to be allocated\n");
    return random_allocation($username, $max, $priorities);
  }
}

function get_ecolm_data($id){
  // Need *old* ecolm db
  $edb = new mysqli("igor.gold.ac.uk", "basicuser", "basicuser", "ecolm", 3307);
  $edb->set_charset("utf8");
  // FIXME: this query would be easier on the eyes implemented as a
  // view, but that's a risky business in MySQL. Maybe if we ever move to PG
  if(!$edb) file_put_contents("/tmp/error", "fail");
  $query = "SELECT `Piece Title` ptitle, 
                    (SELECT    GROUP_CONCAT(`PieceName Alias` SEPARATOR ', ') 
		                 FROM      Piece_Names pn 
                     WHERE     pn.`Piece ID`=p.`Piece ID` 
                     GROUP BY  pn.`Piece ID`) pieceAliases, 
               	   `Source Title` stitle, 
                   `Source Subtitle` ssubtitle, 
                   `Source ShortTitle` shtitle, `Source Location` shelf,
                    (SELECT    GROUP_CONCAT(`SourceName Alias` SEPARATOR ', ') 
                     FROM      Source_Names sn 
                     WHERE     sn.`Source ID`=p.`Source ID` 
                     GROUP BY  sn.`Source ID`) sourceAliases,
                    (SELECT   `EditionText Text`
                     FROM     Piece_Editions pe 
                              NATURAL JOIN Edition_Texts et 
                     WHERE    pe.`Piece ID`=p.`Piece ID` AND NOT `EditionText Replaced`
                     ORDER BY `EditionText Stage` DESC,
                              `EditionText Date` DESC
                     LIMIT 0,1) Tabcode
             FROM    ecolm.Pieces p
                     NATURAL JOIN Sources s 
             WHERE p.`Piece ID`=".$id;
  file_put_contents("/tmp/q1.txt", $query);
  $result = $edb->query($query);
  $rarr = $result->fetch_assoc();
  return($rarr);
}

function all_tabcode_data(){
  // Need *old* ecolm db
  $edb = new mysqli("igor.gold.ac.uk", "basicuser", "basicuser", "ecolm", 3307);
  $edb->set_charset("utf8");
  $query = "SELECT pe.`Piece ID` ID, 
                   (SELECT     `EditionText Text` 
                    FROM       Edition_Texts et
                    WHERE      NOT `EditionText Replaced`
                               AND et.`Edition ID`=pe.`Edition ID`
                    ORDER BY   `EditionText Stage` DESC,
                               `EditionText Date` DESC
                    LIMIT      0,1) Tabcode
            FROM   Piece_Editions pe";
  $result = $edb->query($query);
  $rarr = $result->fetch_all(MYSQLI_ASSOC);
  return($rarr);
}

function all_tabcode_data_one_per_piece(){
  // Need *old* ecolm db
  $edb = new mysqli("igor.gold.ac.uk", "basicuser", "basicuser", "ecolm", 3307);
  $edb->set_charset("utf8");
  $query = "SELECT  `Piece ID` ID, `EditionText Text` Tabcode
              FROM  Piece_Editions 
                    NATURAL JOIN Edition_Texts 
              WHERE `EditionText Replaced`=0 
            ORDER BY `Piece ID`, `EditionText Stage` DESC, `EditionText Date` DESC;";
  $result = $edb->query($query);
  $rarr = $result->fetch_all(MYSQLI_ASSOC);
  return($rarr);
}

function write_index($data){
  file_put_contents("/tmp/complete-ecolm.json", $data);
}

function get_unit_ids($cat, $work, $sub){
  global $db;
  $query = "SELECT unitID FROM workunits 
    WHERE CatID='$cat' AND WorkID='$work' AND WorkSubID='$sub';";
  $result = $db->query($query);
  $ids = array();
  while($row = $result->fetch_array()){
    $ids[]=$row['unitID'];
  }
  return $ids;
}

function work_id_details_for_unit_id($uid){
  global $db;
  $query = "SELECT CatID, WorkID, WorkSubID FROM workunits WHERE unitID=$uid;";
  $result = $db->query($query);
  $row = $result->fetch_array();
  return $row;
}

function how_near_by_unit($uid){
  $ids = work_id_details_for_unit_id($uid);
  return how_nearly_done($ids['CatID'], $ids['WorkID'], $ids['WorkSubID']);
}

function progress(){
  global $db;
  $progress = array();
  $query = "SELECT COUNT(*) FROM workunits;";
  $result = $db->query($query);
  $row = $result->fetch_row();
  $progress['systems'] = $row[0];
  $query = "SELECT COUNT(*) FROM allocations;";
  $result = $db->query($query);
  $row = $result->fetch_row();
  $progress['allocated'] = $row[0];
  $query = "SELECT COUNT(*) FROM CatalogueWorks;";
  $result = $db->query($query);
  $row = $result->fetch_row();
  $progress['works'] = $row[0];
  $query = 'SELECT CatID, WorkID, WorkSubID, 
        COUNT(u.unitID) target, COUNT(sys.unitID) covered, 
        COUNT(u.unitID)-COUNT(sys.unitID) todo
      FROM CatalogueSystems cs NATURAL JOIN SideFaces sf 
        LEFT JOIN Unit u USING (faceID, systemNumber)
        LEFT JOIN
          (SELECT a1.unitID AS unitID
             FROM Allocation a1 LEFT JOIN Allocation a2 on a1.unitID = a2.unitID
             WHERE a1.allocID < a2.allocID
               AND a1.username != a2.username
               AND a1.tabcode IS NOT NULL
               AND a2.tabcode IS NOT NULL) sys
          USING (unitID)
	    WHERE WorkID != "Blank"
      GROUP BY CatID, WorkID, WorkSubID
      HAVING todo=0';
  $result = $db->query($query);
  $progress['done'] = $result->num_rows();
  return $progress;
}

function assign_collation_without_randomness_or_order($username){
  $assign = finished_and_unassigned();
  file_put_contents("/tmp/collation.txt", "\n------\n", FILE_APPEND);
  if(!$assign) return "fin";
  $cat = $assign[0]['CatID'];
  $work = $assign[0]['WorkID'];
  $sub = $assign[0]['WorkSubID'];
  assign_collation($cat, $work, $sub, $username);
  return retrieve_collation($cat, $work, $sub);
}
function get_current_collation_task($username){
  global $db;
  $query = "SELECT CatID, WorkID, WorkSubID 
    FROM CollationWorks 
    WHERE username='$username' AND state<3;";
  file_put_contents("/tmp/collation.txt", $query."\n", FILE_APPEND);
  $result = $db->query($query);
  if($db->error) {
    file_put_contents("/tmp/collation.txt", "\n".$db->error,  FILE_APPEND);
  }
  file_put_contents("/tmp/collation.txt", "\n".$result->num_rows."\n", FILE_APPEND);
  if($result->num_rows>0){
    $row = $result->fetch_array();
    file_put_contents("/tmp/collation.txt", print_r($row, true), FILE_APPEND);    
    return retrieve_collation($row['CatID'], $row['WorkID'], $row['WorkSubID']);
  } else {
    return assign_collation_without_randomness_or_order($username);
  }
}
function finished_and_unassigned(){
  // Return the work id sets of doubly-corrected works that aren't yet
  // in collation
  global $db;
  $query = "SELECT t.CatID CatID, t.WorkID WorkID, t.WorkSubID WorkSubID
  FROM todo t LEFT JOIN CollationWorks USING (CatID, WorkID, WorkSubID)
  WHERE WorkID != 'Blank'
      AND todo=0 AND username IS NULL";
  $result = $db->query($query);
  return $result->fetch_all(MYSQLI_ASSOC);
}

function assign_collation($cat, $work, $sub, $username){
  // Assign work to $username
  global $db;
  $query = "INSERT INTO CollationWorks 
    (CatID, WorkID, WorkSubId, username, state)
    VALUES ('$cat', '$work', '$sub', '$username', 0);";
  $result = $db->query($query);
  // Now add blank work-system entries
  $query = "SELECT unitID FROM workunits WHERE CatID='$cat'
    AND WorkID='$work' AND WorkSubID='$sub'";
  $result = $db->query($query);
  while($row=$result->fetch_array()){
    $id = $row['unitID'];
    $query = "INSERT INTO Collation SET unitID=$id";
    $db->query($query);
  }
}

function add_correction($id, $row, $array){
  for($i=0; $i<count($array); $i++){
    if($array[$i]['uID']===$id){
      $array[$i]['corrections'][] = $row;
      return $array;
    }
  }
  file_put_contents("/tmp/assign.txt", "failure:\n$id:\n".count($array)."\n".json_encode($array)
                    ."\n".json_encode($row)."\n",
                    FILE_APPEND);    
  return $array;
}

function retrieve_collation($cat, $work, $sub){
  global $db;
  $collquery = "SELECT c.unitID uID, duration, tuning, font, tabtype, tabcode, state,
      finalFlag, history, allocDate, editDate, PosInWork, imagePath
    FROM Collation c NATURAL JOIN workunits wu
    WHERE CatID='$cat' AND WorkID='$work' AND WorkSubID='$sub' ORDER BY PosInWork";
  $corrquery = "SELECT allocID, username, a.unitID uID, duration, tuning, font, tabtype,
      tabcode, state, message, messageType,
      finalFlag, history, allocDate, editDate, submitDate
    FROM Allocation a NATURAL JOIN workunits wu
    WHERE CatID='$cat' AND WorkID='$work' AND WorkSubID='$sub'";
  $collresult = $db->query($collquery);
  $corrresult = $db->query($corrquery);
  $ss = array();
  $i=0;
  while($row = $collresult->fetch_array()){
    $ss[$i] = array();
    $ss[$i]['uID'] = $row['uID'];
    $ss[$i]['edited'] = $row;
    $ss[$i]['edited']['imagePath'] = $row['imagePath'].($_POST['colour'] ?"" : "_gray").".png";
    $ss[$i]['corrections'] = array();
    $i++;
  }
  while($row = $corrresult->fetch_array()){
    $ss = add_correction($row['uID'], $row, $ss);
  }
  $return = array();
  $return['systems'] = $ss;
  $return['workID'] = $work;
  $return['catID'] = $cat;
  $return['workSubID'] = $sub;
  return $return;
}

function allocate_work_if_necessary($catid, $workid, $worksubid){
  global $db;
  $query = "SELECT COUNT(*) FROM Collation NATURAL JOIN workunits 
    WHERE CatID='$catid' AND WorkID='$workid' AND WorkSubID='$worksubid' AND state<2;";
  $result=$db->query($query);
  $c=$result->fetch_row();
  if($c[0]>0) return; // Still some systems to finish
  return assign_collation_without_randomness_or_order($username);
}

function sync_collation_assignment($user, $id, $catid, $workid, $worksubid, 
                                   $dur, $tuning, $font, 
                                   $tabtype, $tabcode, $finalFlag, 
                                   $state, $history, $submit){
  global $db;
  $query = "UPDATE Collation 
    SET duration='$dur', tuning='".json_encode($tuning)."', 
        font='$font', tabtype='$tabtype',
        tabcode='".$db->real_escape_string($tabcode)."', state='$state', finalflag='$finalFlag', 
        history='".$db->real_escape_string($history)."',
        editDate=NULL 
    WHERE unitID=$id";
  $ret = $db->query($query);
  file_put_contents("/tmp/grargh.txt", $query."\n", FILE_APPEND);
    if($db->error) {
    file_put_contents("/tmp/grargh.txt", "\n".$db->error,  FILE_APPEND);
  }
  $query = "UPDATE CollationWorks SET State=$state
      WHERE CatID='$catid' AND WorkID='$workid' AND WorkSubID='$worksubid'";
  $db->query($query);
  //  if($state==2){
    //    allocate_work_if_necessary($workid);
  return get_current_collation_task($user);
    //}
  //return $ret;
}
function how_nearly_done($cat, $work, $sub){
  global $db;
  $query = "SELECT CatID, WorkID, WorkSubID, 
        COUNT(u.unitID) target, COUNT(sys.unitID) covered, 
        COUNT(u.unitID)-COUNT(sys.unitID) todo
      FROM CatalogueSystems cs NATURAL JOIN SideFaces sf 
        LEFT JOIN Unit u USING (faceID, systemNumber)
        LEFT JOIN
          (SELECT a1.unitID AS unitID
             FROM Allocation a1 LEFT JOIN Allocation a2 on a1.unitID = a2.unitID
             WHERE a1.allocID < a2.allocID
               AND a1.username != a2.username
               AND a1.tabcode IS NOT NULL
               AND a2.tabcode IS NOT NULL) sys
          USING (unitID)
	    WHERE WorkID='$work' AND CatID='$cat' AND WorkSubID='$sub'
      GROUP BY CatID, WorkID, WorkSubID";
  $result = $db->query($query);
  $row = $result->fetch_array();
  if($row){
    return $row['todo'];
  } else {
    file_put_contents("/tmp/errors.txt", 
      "How near Error: $cat, $work, $sub\n$query", FILE_APPEND);
    return false;
  }
}

function nearly_done_list(){
  global $db;
  $query = 'SELECT CatID, WorkID, WorkSubID, 
        COUNT(u.unitID) target, COUNT(sys.unitID) covered, 
        COUNT(u.unitID)-COUNT(sys.unitID) todo
      FROM CatalogueSystems cs NATURAL JOIN SideFaces sf 
        LEFT JOIN Unit u USING (faceID, systemNumber)
        LEFT JOIN
          (SELECT a1.unitID AS unitID
             FROM Allocation a1 LEFT JOIN Allocation a2 on a1.unitID = a2.unitID
             WHERE a1.allocID < a2.allocID
               AND a1.username != a2.username
               AND a1.tabcode IS NOT NULL
               AND a2.tabcode IS NOT NULL) sys
          USING (unitID)
	    WHERE WorkID != "Blank"
      GROUP BY CatID, WorkID, WorkSubID
      HAVING todo>0
      ORDER BY todo ASC';
  $result = $db->query($query);
  $todo = 0;
  $priorities = array();
  while($row = $result->fetch_array()){
    $ids = get_unit_ids($row['CatID'], $row['WorkID'], $row['WorkSubID']);
    if($row['todo']===$todo){
      $priorities[count($priorities)-1] = array_merge($priorities[count($priorities)-1], $ids);
    } else {
      $todo = $row['todo'];
      $priorities[] = $ids;
    }
  }
  return $priorities;
}

function random_allocation_w_priority($username, $max, $priorities="all"){
  global $db;
  file_put_contents("/tmp/priority_list.txt", json_encode($priorities));
  // CHECK THIS PROPERLY
  $query = "SELECT u.unitID AS uID, assigned
    FROM Unit u LEFT JOIN
     (SELECT unitID, count(*) assigned
        FROM Allocation
        GROUP BY unitID) as a1 USING (unitID)
    WHERE NOT EXISTS (SELECT * FROM Allocation a 
                      WHERE a.unitID=u.unitID AND username='$username')
      AND (ISNULL(assigned) OR assigned<$max)
    ORDER BY rand();";
  file_put_contents("/tmp/newalloc.txt", "<code>$query</code>");
  $result = $db->query($query);
  while($id = $result->fetch_array()){
    if($priorities=="all"){
      if(in_array($id[0], exclusions())) {
        //        return random_allocation($username, $max, $priorities);
        continue;
      } else {
        return allocate_unit($username, $id[0]);
      }
    } else {
      if(gettype($priorities[0])=="array"){
        if(in_array($id[0], $priorities[0])){
          return allocate_unit($username, $id[0]);
        }
      } else if($id[0]==$priorities[0]){
        return allocate_unit($username, $id[0]);
      }
    }
  }
  if($priorities=="all"){
    file_put_contents("/tmp/error.txt", "No allocation for $username");
    return false;
  } else {
    file_put_contents("/tmp/misses.txt", "missed", FILE_APPEND);
    if(count($priorities)>0){
      return random_allocation_w_priority($username, $max, array_slice($priorities, 1));
    } else {
      return random_allocation_w_priority($username, $max);
    }    
    //return random_allocation_w_priority($username, $max, array_slice($priorities, 1));
  }
}
?>