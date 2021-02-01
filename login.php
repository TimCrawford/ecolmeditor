<?php
$users =array();
$users["david"] = md5("password");
$mya = array();
$mya["imageURL"] = "images/deCrema1546_fA2r_4.png";
$mya = array("imageURL" => "images/deCrema1546_fA2r_4.png",
             "tabcode" => (file_exists("saves/david-2.tc") ?
                           file_get_contents("saves/david-2.tc") :
                           file_get_contents("tabcodes/deCrema1546_fA2r_4.tc")),
             "contextDur"    => "Q",
             "contextTuning" => array(67, 62, 57, 53, 48, 43, 41, 40, 38, 36, 35, 33, 31),
             "tabType"       => "Italian",
             "fontName"      => "Varietie",
             "id"            => 2,
             "source"        => "IOAN MARIA DA CREMA",
             "title"         => "Stuff",
             "system"        => 5,
             "state"         => (file_exists("saves/david-2.state") ?
                                 file_get_contents("saves/david-2.state") :
                                 0));
$myb = array("imageURL" => "images/Besard1603_f2v_4.png",
             "tabcode" => (file_exists("saves/david-14.tc") ?
                           file_get_contents("saves/david-14.tc") :
                           file_get_contents("tabcodes/Besard1603_f2v_4.tc")),
             "contextDur"    => "Q",
             "contextTuning" => array(67, 62, 57, 53, 48, 43, 41, 40, 38, 36, 35, 33, 31),
             "tabType"       => "French",
             "fontName"      => "Varietie",
             "id"            => 14,
             "source"        => "Besard, Thesarus Harmonicus (1603)",
             "title"         => "A title",
             "system"        => 2,
             "state"         => (file_exists("saves/david-14.state") ?
                                 file_get_contents("saves/david-14.state") :
                                 0));
$assignments = array("david"=> array($mya, $myb));
file_put_contents("log.txt", print_r($assignments['david'],true));
$user = $_POST['username'];
$password = md5($_POST['password']);
if($users[$user] == $password){
  // SELECT `SystemEdition Text` tc, `SystemEdition Modified` mod,
  //     `SystemEdition Flagged` flaged, `SystemEdition Paused` pause, 
  //     `SystemEdition ContextFlag` flag, `SystemEdition Pitch` pitch,
  //     CONCAT_WS(" ", `Tuning Interval1` c1, `Tuning Interval2` c2, `Tuning Interval3`, c3
  //     `Tuning Interval4` c4, `Tuning Interval5` c5, `BassTuning Interval1` c6, 
  //     `BassTuning Interval2`, `BassTuning Interval3`, `BassTuning Interval4`, 
  //     `BassTuning Interval5`, `BassTuning Interval6`, `BassTuning Interval7`), 
  //     `SystemEdition Font`, 
  //     `SystemEdition Notation` 
  // FROM Users u NATURAL JOIN System_Editions 
  //       NATURAL JOIN Tuning NATURAL JOIN Bass_Tuning
  // WHERE se.`User Name`='$user' AND Password='$password'
  //    
  echo json_encode($assignments[$user]);
} 

?>