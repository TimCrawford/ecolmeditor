<?php
$src = $_POST['source'];

function sourcepath(){
  return "../output/$src/";
}
function syspath(){
  global $src;
  return newpath($src, $_POST['page'], $_POST['part']);
}
function newurl($pageno, $part, $system){
  global $src;
  return "?batch=$src&no=$pageno&part=$part&system=$system";
}
function newpath($source, $pageno, $part){
  return "../output/".$source."/".$source."_".$pageno."_part_".$part."/out/";
}
function pno(){
  return intval($_POST['page']);
}
function nop($n){
  return str_pad($n, 3, "0", STR_PAD_LEFT);
}
function syscount(){
  return count(glob(syspath()."system*.tc"));
}
function nextpagestart(){
  global $src;
  if($_POST['part']=="b"){
    $page = nop(pno()+1);
    $part = "a";
  } else {
    $page = $_POST['page'];
    $part = "b";
  }
  if(file_exists(newpath($src, $page, $part))){
    return newurl($page, $part, 1);
  } else {
    return false;
  }
}
function prevpageend(){
  global $src;
  if($_POST['part']=="b"){
    $page = $_POST['page'];
    $part = "a";
  } else {
    $page = nop(pno()-1);
    $part = "b";
  }
  $path = newpath($src, $page, $part);
  if(file_exists($path)){
    return newurl($page, $part, count(glob($path."system*.tc")));
  } else {
    return false;
  }
}
function nextsyspath(){
  if($_POST['system']<syscount()){
    return newurl($_POST['page'], $_POST['part'], $_POST['system']+1);
  } else {
    return nextpagestart();
  }
}
function prevsyspath(){
  if($_POST['system']>1){
    return newurl($_POST['page'], $_POST['part'], $_POST['system']-1);
  } else {
    return prevpageend();
  }
}
$params = array();
$prefix = syspath()."system".$_POST['system'];
if($_POST['colour']){
  $params['imageurl'] = $prefix.".png";
} else {
  $params['imageurl'] = $prefix."_gray.png";
}
$params['tabcode'] = file_get_contents("$prefix.tc");
$params['contextDur'] = "Q"; //FIXME
$params['contextTuning'] = array(67, 62, 57, 53, 48, 43, 41, 40, 38, 36, 35, 33, 31);
$params['tabType'] = "Italian";
$params['fontName'] = "Varietie";
if($_POST['colour']) {
  $params['nexturl'] = nextsyspath()."&color=1";
  $params['prevurl'] = prevsyspath()."&color=1";
} else {
  $params['nexturl'] = nextsyspath();
  $params['prevurl'] = prevsyspath();
}

echo json_encode($params);

?>