<?php
$db = false;

function eConnect(){
  global $db;
  $pwd = prompt_silent();
  $db = $pwd ? new mysqli("igor.gold.ac.uk", "ecolm", $pwd, "ecolm", 3307) : false;
}
function getSources($min){
  global $db;
  $sourceQuery = "SELECT s.`Source ID` as ID, `Source Title` as Source, `Source Location` AS Location
     FROM Sources s NATURAL JOIN Pieces p NATURAL JOIN Piece_Editions
     WHERE `Edition ID` IS NOT NULL 
     GROUP BY `Source ID` HAVING Count(`Piece ID`) >=$min;";
  $result = $db->query($sourceQuery);
  return $result->fetch_all(MYSQLI_ASSOC);
}
function getPieces($SID){
  global $db;
  $pieceQuery = "SELECT `Piece ID` AS ID, `Piece Title` AS Title, `Piece NumberInSource` AS No
    FROM Pieces WHERE `Source ID`= $SID ORDER BY No ASC;";
  $result = $db->query($pieceQuery);
  return $result->fetch_all(MYSQLI_ASSOC);
}

function pieceList($SID){
  $pieces = getPieces($SID);
  $string = "<ul>";
  for($i=0; $i<count($pieces); $i++){
    $string .= "<li class='pieceListing'><a href='http://www.doc.gold.ac.uk/isms/ecolm/database/index?type=41&ID="
      .$pieces[$i]['ID']."'>";
    $string .=$pieces[$i]['Title']? $pieces[$i]['Title'] : "[untitled]";
    $string .="</a></li>\n";
  }
  return $string."</ul>";
}
function sourceList(){
  $sources = getSources(4);
  $string = "<div id='accordion'>\n";
  for($i=0; $i<count($sources); $i++){
    $string .= "\t<h3>".$sources[$i]['Source']." "
      .($sources[$i]['Location']?"(".$sources[$i]['Location'].")" : "")
      ."</h3>\n\t\t<div>".pieceList($sources[$i]['ID'])."</div>";
  }
  return $string."</div>\n";
}
function prompt_silent($prompt = "Enter Password:") {
  if (preg_match('/^win/i', PHP_OS)) {
    $vbscript = sys_get_temp_dir() . 'prompt_password.vbs';
    file_put_contents(
      $vbscript, 'wscript.echo(InputBox("'
      . addslashes($prompt)
      . '", "", "password here"))');
    $command = "cscript //nologo " . escapeshellarg($vbscript);
    $password = rtrim(shell_exec($command));
    unlink($vbscript);
    return $password;
  } else {
    $command = "/usr/bin/env bash -c 'echo OK'";
    if (rtrim(shell_exec($command)) !== 'OK') {
      trigger_error("Can't invoke bash");
      return;
    }
    $command = "/usr/bin/env bash -c 'read -s -p \""
      . addslashes($prompt)
      . "\" mypassword && echo \$mypassword'";
    $password = rtrim(shell_exec($command));
    echo "\n";
    return $password;
  }
}
eConnect();
echo(sourceList());
?>