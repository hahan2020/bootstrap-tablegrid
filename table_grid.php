<?php

	function getParameter($para, $default_value) {
		$value = ($_GET[$para] == null) ? $_POST[$para] : $_GET[$para];
		if (!isset($value)) {
			$value = $default_value;
		}
		return $value;
	}

$pageSize = 10;
$pageTotal = 11;
$total = 104;
$page = getParameter('page', 1);
if ($page != 11) {
?>
{	
		"pageTotal": <?php echo $pageTotal;?>
	,	"page" : <?php echo $page;?>
	,	"total" : <?php echo $total;?>
	,	"root": [
				{"b1": "<?php echo $page ?>", 	"b2": "b2", 	"b3":"b3"}
			,	{"b1": "b11",	"b2": "b22",	"b3": "b33"}
			,	{"b1": "b11",	"b2": "b22",	"b3": "b33"}
			,	{"b1": "b11",	"b2": "b22",	"b3": "b33"}
			,	{"b1": "b11",	"b2": "b22",	"b3": "b33"}
			,	{"b1": "b11",	"b2": "b22",	"b3": "b33"}
			,	{"b1": "b11",	"b2": "b22",	"b3": "b33"}
			,	{"b1": "b11",	"b2": "b22",	"b3": "b33"}
			,	{"b1": "b11",	"b2": "b22",	"b3": "b33"}
			,	{"b1": "b11",	"b2": "b22",	"b3": "b33"}
		]
}
<?php
} else {
?>
{	
		"pageTotal": <?php echo $pageTotal;?>
	,	"page" : <?php echo $page;?>
	,	"total" : <?php echo $total;?>
	,	"root": [
				{"b1": "b1", 	"b2": "b2", 	"b3":"b3"}
			,	{"b1": "b11",	"b2": "b22",	"b3": "b33"}
			,	{"b1": "b11",	"b2": "b22",	"b3": "b33"}
			,	{"b1": "b11",	"b2": "b22",	"b3": "b33"}
		]
}
<?php
}
?>