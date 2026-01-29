<?php
set_time_limit(100);
header('Access-Control-Allow-Origin: https://aadideepchand25.github.io');
$scene = $_GET['scene'];
$func = $_GET['func'];
$data = $_GET['data'] ?? "";

if($func != null && $scene != null) {
  if($func == "0") {
    $content = file("./scenes/" . $scene . ".bef");
    if($content != null) {
       $odata = implode("<br>",$content);
        echo $odata; 
    } else {
      echo "invalid";
    }
  } else if($func == "1") {
    addToDatabase($scene, $data);
    echo "recieved";
  } else if($func == "2") {
    unlink("./scenes/" . $scene . ".bef");
    echo "complete";
  }
}

if($func != null) {
  if($func == "3") {
    $sceneList = glob("./scenes/*.bef");
    foreach($sceneList as $value) {
      echo $value . "<br>";
    }
  }
}

//Function disabled in actual server to avoid unauthorised users pushing files
function addToDatabase($key, $value) {
  //$temp = fopen("./scenes/" . $key . ".bef", "a");
  //fwrite($temp,$value);
  //fclose($temp);
}
?>