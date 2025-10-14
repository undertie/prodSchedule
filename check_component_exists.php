<?php
include_once("/etc/apache2/dbConfig/enterprise/enterpriseConfig.php");

$job = $_POST['job'];
$component = $_POST['component'];

// Log the received values
//error_log("check_component_exists.php - Job: " . $job . ", Component: " . $component);

$sql = "SELECT COUNT(*) as count FROM ProductionScheduleInfoECW WHERE JobNumber = ? AND ComponentNumber = ?";
$params = array($job, $component);
$stmt = sqlsrv_query($conn, $sql, $params);

if ($stmt === false) {
    $errors = sqlsrv_errors();
    error_log("SQL Error in check_component_exists: " . print_r($errors, true));
    die(json_encode(['exists' => false, 'error' => 'Query failed']));
}

$row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
$count = $row['count'];

//error_log("check_component_exists.php - Count: " . $count);

echo json_encode(['exists' => $count > 0, 'count' => $count]);

sqlsrv_free_stmt($stmt);
?>