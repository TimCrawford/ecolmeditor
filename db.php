<?php
require('ecolm-db.php');
// FIXME: escape data from $_POST
if ($_POST['add_user']){
  echo json_encode(add_user($_POST['username'], $_POST['fullname'], $_POST['password']));
  random_allocation($_POST['username'], 2, "all");
} elseif($_POST['newpassword']){
  echo json_encode(change_password($_POST['username'], $_POST['password'], $_POST['newpassword']));
} elseif($_POST['message'] OR $_POST['messageType']){
  echo json_encode(add_message($_POST['username'], $_POST['password'], 
                               $_POST['id'], $_POST['message'], $_POST['messageType']));
} elseif($_POST['revert']){
  echo json_encode(revert_assignment($_POST['username'], $_POST['password'], $_POST['revert']));
} elseif($_POST['id']) {
  echo json_encode(sync_assignment($_POST['username'], $_POST['password'], $_POST['id'],
                                   $_POST['duration'], $_POST['tuning'], $_POST['font'],
                                   $_POST['tabtype'], $_POST['tabcode'], $_POST['finalFlag'],
                                   $_POST['state'], $_POST['history'], $_POST['state']));
} elseif($_POST['username']) {
  file_put_contents("/tmp/specialLog.txt", 
                    "================\nConnection From: ".$_POST['agent']."\n", FILE_APPEND);
  file_put_contents("/tmp/specialLog.txt", 
                    "  * Identified as ".$_POST['username']
                    ." by ".$_POST['password']."\n", FILE_APPEND);
  echo json_encode(user_assignments($_POST['username'], $_POST['password'], $_POST['agent']));
} elseif($_POST['lookup']){
  echo json_encode(get_ecolm_data($_POST['lookup']));
} else if($_POST['fullIndex']){
  /* echo json_encode(all_tabcode_data()); */
  echo json_encode(all_tabcode_data_one_per_piece());
} else if($_POST['newIndex']){
  write_index($_POST['newIndex']);
} else {
  /* $out = "../output/"; */
  /* echo "Searching...<br/>"; */
  /* $dirs = glob($out."*"); */
  /* echo "Found ".count($dirs)." directories.<br/>"; */
  /* if($dirs){ */
  /*   $unit = false; */
  /*   $batch = 0; */
  /*   $face = 0; */
  /*   for($i=0; $i<count($dirs); $i++){ */
  /*     $dir=$dirs[$i]; */
  /*     echo "<p>$dir</p>"; */
  /*     if(substr($dir,-1) != "."){ */
  /*       $batch = add_batch("", pathinfo($dir,PATHINFO_BASENAME)); */
  /*       echo "Batch $batch added"; */
  /*       $unit = false; */
  /*       $faces = glob($dir."/\*_part_*"); */
  /*       for($f=0; $f<count($faces); $f++){ */
  /*         $facedir = $faces[$f]; */
  /*         $facefullname = pathinfo($facedir,PATHINFO_BASENAME); */
  /*         $first_ = strpos($facefullname, "_"); */
  /*         $second_ = strpos($facefullname, "_", $first_+1); */
  /*         $face = add_face($batch, substr(strrchr($facefullname, "_"), 1),  */
  /*                          substr($facefullname, $first_+1, $second_-$first_-1)); */
  /*         $datadir = $facedir."/out/"; */
  /*         $tcs = glob($datadir."*.tc"); */
  /*         if($tcs){ */
  /*           usort($tcs, "nogt"); */
  /*           for($u=0; $u<count($tcs); $u++){ */
  /*             $tcpath = $tcs[$u]; */
  /*             $unitbase = unitbase($tcpath); */
  /*             $tc = file_get_contents($tcpath); */
  /*             $lastflag = lastflag($tc); */
  /*             $tuning = json_encode(array(67, 62, 57, 53, 48, 43, 41, 40, 38, 36, 35, 33, 31)); */
  /*             $font = "Varietie"; */
  /*             $tabtype = "Italian"; */
  /*             $prev_unit=$unit; */
  /*             echo "$prev_unit"; */
  /*             $unit = add_unit($face, $unitbase, $prev_unit, $tuning, $font, $tabtype, $tc, substr($tcpath, 0, -3), $lastflag); */
  /*           } */
  /*         } */
  /*       } */
  /*     } */
  /*   } */
  /* } */
}

function unitbase($tcpath){
  // Gives the system number (as a string) from a full tabcode file
  // path of the form /foo/bar/baz/systemn.tc
  return substr(pathinfo($tcpath, PATHINFO_BASENAME), 6, -3);
}

function nogt($patha, $pathb){
  return intval(unitbase($patha)) > intval(unitbase($pathb));
}

function lastflag($string){
  // Very crude
  // First remove comments
  $string = preg_replace('/\{[^}]*\}/', "", $string);
  $words = preg_split('/\s+/', $string);
  if($words){
    for($i=count($words)-1; $i>=0; $i--){
      if(strpos("ZYTSEQHWBF", substr($words[$i], 0, 1))){
        return substr($words[$i], 0, 1);
      }
    }
  }
  return "";
}

?>