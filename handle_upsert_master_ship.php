<?php
include_once("/etc/apache2/dbConfig/enterprise/enterpriseConfig.php");

header('Content-Type: application/json');

// Get POST data
$job = $_POST['job'] ?? '';
$component = $_POST['component'] ?? '';
$field = $_POST['field'] ?? '';
$value = $_POST['value'] ?? '';

// Validate input
if (empty($job) || empty($component) || empty($field)) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

// Log the received values for debugging
//error_log("handle_upsert.php - Job: $job, Component: $component, Field: $field, Value: " . substr($value, 0, 100));

try {
    // First check if the record exists
    $checkSql = "SELECT COUNT(*) as count FROM ProductionScheduleInfoECW WHERE JobNumber = ? AND ComponentNumber = ?";
    $checkParams = array($job, $component);
    $checkStmt = sqlsrv_query($conn, $checkSql, $checkParams);
    
    if ($checkStmt === false) {
        throw new Exception('Check query failed: ' . print_r(sqlsrv_errors(), true));
    }
    
    $row = sqlsrv_fetch_array($checkStmt, SQLSRV_FETCH_ASSOC);
    $exists = $row['count'] > 0;
    
    sqlsrv_free_stmt($checkStmt);
    
    if ($exists) {
        // UPDATE existing record
        $sql = "UPDATE ProductionScheduleInfoECW SET $field = ? WHERE JobNumber = ? AND ComponentNumber = ?";
        $params = array($value, $job, $component);
        $action = 'updated';
    } else {
        // INSERT new record
        $sql = "INSERT INTO ProductionScheduleInfoECW (JobNumber, ComponentNumber, $field) VALUES (?, ?, ?)";
        $params = array($job, $component, $value);
        $action = 'inserted';
    }
    
    // Execute the query
    $stmt = sqlsrv_query($conn, $sql, $params);
    
    if ($stmt === false) {
        throw new Exception('UPSERT query failed: ' . print_r(sqlsrv_errors(), true));
    }
    
    sqlsrv_free_stmt($stmt);
    
    echo json_encode([
        'success' => true,
        'action' => $action,
        'exists' => $exists
    ]);
    
} catch (Exception $e) {
    error_log("handle_upsert.php Error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>