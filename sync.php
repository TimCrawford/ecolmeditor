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
             "system"        => (file_exists("saves/david-2.state") ?
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
             "system"        => (file_exists("saves/david-14.state") ?
                                 file_get_contents("saves/david-14.state") :
                                 0));
$assignments = array("david"=> array($mya, $myb));
$user = $_POST['username'];
$password = md5($_POST['password']);
/* file_put_contents("log.txt", $assignment["id"]"-".$_POST['id']); */
if($users[$user] == $password){
  foreach($assignments[$user] as $assignment){
    /* file_put_contents("log.txt", $assignment["id"]"-".$_POST['id']); */
    if($assignment["id"]==$_POST['id']){
      file_put_contents("log.txt", "saved");
      file_put_contents("saves/".$user."-".$_POST['id'].".tc", $_POST['tabcode']);
      file_put_contents("saves/".$user."-".$_POST['id'].".state", 1);
      if($_POST['submit'] == 1){
        file_put_contents("saves/".$user."-".$_POST['id'].".state", 2);
      }
      break;
    }
  }
  echo "done";
}

?>