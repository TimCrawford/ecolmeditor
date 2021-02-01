<?php

// working directory for files - change if necessary
$file_dir = "midis/";

$events = $_POST["events"];
$tempo = $_POST["tempo"];
$ticks = $_POST["ticks"];
if((!isset($_POST["UID"])||($_POST["UID"]==false))) {
	$UID = substr(md5(rand()),0,7);
}
else {
	$UID = $_POST["UID"];
}

echo $UID."<br>";

if(!isset($_POST("ticks"))) {
	$ticks = "192";
}
if(!isset($_POST("tempo"))) {
	$tempo = "1";
}

// General housekeeping: delete files more than a day old
// PROBLEM - error messages interfere
/*
$dir = opendir($file_dir);
if ($dir) {
   // Read directory contents
   while (false !== ($f = readdir($dir))) {
      if (filemtime($f) < (time() - (3600*24))) {
        unlink($f);
      }
   }
}
*/

// Clear previously created music files with this UID
system("rm ".$file_dir.$UID."/*");

// Build midifile text string from events array:
$events_arr = json_decode ($events);
$timebase = $ticks * $tempo;
$out_str = "MFile 0 1 " . $timebase . "\n";
$out_str .= "MTrk\n";
foreach($events_arr as $out) {
if($out[2]==1) {
	$kind = "On";
}
else {
	$kind = "Off";
}
$out_str .= $out[0]." ".$kind." ch=1 n=".$out[1]." v=127";
$out_str .= "\n";
}
$out_str .= $out[0]." Meta TrkEnd\n";
$out_str .= "TrkEnd\n";

// write to file - filename based on UID
$file=fopen($file_dir.$UID.".txt","w+");
$num=fwrite ( $file, $out_str);
fclose($file);

// do audio conversions
system("t2mf ".$file_dir.$UID.".txt ".$file_dir.$UID.".mid;");
system("../bin/TiMidity++-2.14.0/timidity/timidity -L ../bin/ -idqq -Ow -o ".$file_dir.$UID.".wav ".$file_dir.$UID.".mid;");
system("chmod a+rwx ".$file_dir.$UID.".*;");
system("/usr/local/bin/sox ".$file_dir.$UID.".wav  ".$file_dir.$UID.".mp3;");
system("/usr/local/bin/sox ".$file_dir.$UID.".wav  ".$file_dir.$UID.".ogg;");
system("chmod a+rwx ".$file_dir.$UID.".*;");
// report UID
?>
