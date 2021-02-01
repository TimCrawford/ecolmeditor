<?php
require('ecolm-db.php');
if($_POST['apply']) {
  echo json_encode(application_for_user($_POST['username'], $_POST['fullname'], $_POST['password'],
                            $_POST['country'], $_POST['e-mail']));
} else if ($_POST['check']){
  echo json_encode(check_username($_POST['username']));
} else if ($_POST['review']){
  echo json_encode(review_applications());
} else if ($_POST['approve']){
  echo json_encode(approve_application($_POST['approve']));
} else if ($_POST['username'] && $_POST['password']){
  echo json_encode(add_user($_POST['username'], $_POST['fullname'], $_POST['password'],
                            $_POST['country'], $_POST['e-mail']));
  random_allocation($_POST['username'], 2, "all");
} else if ($_POST['pathname']){
  $out = $_POST['pathname']; //"../output/";
  echo "Searching...<br/>";
  $dirs = glob($out."*");
  echo "Found ".count($dirs)." directories.<br/>";
  if($dirs){
    $unit = false;
    $batch = 0;
    $face = 0;
    for($i=0; $i<count($dirs); $i++){
      $dir=$dirs[$i];
      echo "<p>$dir</p>";
      if(substr($dir,-1) != "."){
        $batch = add_batch("", pathinfo($dir,PATHINFO_BASENAME));
        echo "Batch $batch added";
        $unit = false;
        $faces = glob($dir."/*_part_*");
        for($f=0; $f<count($faces); $f++){
          $facedir = $faces[$f];
          $facefullname = pathinfo($facedir,PATHINFO_BASENAME);
          $first_ = strpos($facefullname, "_");
          $second_ = strpos($facefullname, "_", $first_+1);
          $face = add_face($batch, substr(strrchr($facefullname, "_"), 1), 
                           substr($facefullname, $first_+1, $second_-$first_-1));
          $datadir = $facedir."/out/";
          $tcs = glob($datadir."*.tc");
          if($tcs){
            usort($tcs, "nogt");
            for($u=0; $u<count($tcs); $u++){
              $tcpath = $tcs[$u];
              $unitbase = unitbase($tcpath);
              $tc = file_get_contents($tcpath);
              $lastflag = lastflag($tc);
              $tuning = json_encode(array(67, 62, 57, 53, 48, 43, 41, 40, 38, 36, 35, 33, 31));
              $font = "Varietie";
              $tabtype = "Italian";
              $prev_unit=$unit;
              echo "$prev_unit";
              $unit = add_unit($face, $unitbase, $prev_unit, $tuning, $font, $tabtype, $tc, substr($tcpath, 0, -3), $lastflag);
            }
          }
        }
      }
    }
  }
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