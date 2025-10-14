<?php
include_once("/etc/apache2/dbConfig/enterprise/enterpriseConfig.php");

$job = $_POST['job'];
$component = $_POST['component'];
$field = $_POST['field'];
$value = $_POST['value'];

// Log received data
//error_log("UPSERT - Job: $job, Component: $component, Field: $field, Value: $value");

// Validate field to prevent SQL injection
$allowedFields = ['Select_Main_Process', 'Select_Department'];
if (!in_array($field, $allowedFields)) {
    die(json_encode(['success' => false, 'message' => 'Invalid field']));
}

try {
    // First try to update
    $updateSql = "UPDATE ProductionScheduleInfoECW SET $field = ? WHERE JobNumber = ? AND ComponentNumber = ?";
    $updateParams = array($value, $job, $component);
    $updateStmt = sqlsrv_query($conn, $updateSql, $updateParams);
    
    if ($updateStmt === false) {
        $errors = sqlsrv_errors();
        error_log("Update failed: " . print_r($errors, true));
        throw new Exception('Update failed');
    }
    
    $rowsAffected = sqlsrv_rows_affected($updateStmt);
    sqlsrv_free_stmt($updateStmt);
    
    // If no rows were updated, try to insert
    if ($rowsAffected === 0 || $rowsAffected === false) {
        error_log("No rows updated, attempting insert...");
        
        $insertSql = "INSERT INTO ProductionScheduleInfoECW (JobNumber, ComponentNumber, $field) VALUES (?, ?, ?)";
        $insertParams = array($job, $component, $value);
        $insertStmt = sqlsrv_query($conn, $insertSql, $insertParams);
        
        if ($insertStmt === false) {
            $errors = sqlsrv_errors();
            error_log("Insert failed: " . print_r($errors, true));
            
            // If it's a duplicate key error, try update again
            if (isset($errors[0]) && $errors[0]['code'] == 2627) {
                error_log("Duplicate key detected, retrying update...");
                
                // Retry the update
                $updateStmt2 = sqlsrv_query($conn, $updateSql, $updateParams);
                if ($updateStmt2 === false) {
                    throw new Exception('Both update and insert failed');
                }
                $rowsAffected = sqlsrv_rows_affected($updateStmt2);
                sqlsrv_free_stmt($updateStmt2);
                
                if ($rowsAffected > 0) {
                    echo json_encode(['success' => true, 'action' => 'updated_on_retry']);
                } else {
                    throw new Exception('Update retry also failed');
                }
            } else {
                throw new Exception('Insert failed with unknown error');
            }
        } else {
            sqlsrv_free_stmt($insertStmt);
            echo json_encode(['success' => true, 'action' => 'inserted']);
        }
    } else {
        echo json_encode(['success' => true, 'action' => 'updated', 'rows' => $rowsAffected]);
    }
    
} catch (Exception $e) {
    error_log("UPSERT Exception: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>