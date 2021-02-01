<?php
	$Gerbode_files = file("Gerbode_files.txt", FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
	$found = false;
	foreach($Gerbode_files as $thing) {
		if(strpos($thing,$_POST["lookup"]) !== false) {
			$found = true;
			break;
		}
	}
	if($found === true) {
		$item = explode("\t",$thing);
		$bits = explode("/",$item[1]."\t".$in);
		echo json_encode($bits);
	}
	else echo $_POST["lookup"]." NOT FOUND!";
?>