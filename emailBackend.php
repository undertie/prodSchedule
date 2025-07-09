<?php
// Start session to pass messages
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Get form data
        $name = $_POST['name'] ?? '';
        $subject = $_POST['subject'] ?? '';
        $description = $_POST['description'] ?? '';
        $screenshotData = $_POST['screenshotData'] ?? '';
        $redirectTo = $_POST['redirect_to'] ?? 'index.php';
        
        // Validate inputs
        if (empty($name) || empty($subject) || empty($description)) {
            throw new Exception('All fields are required');
        }
        
        // Prepare email
        $emailSubject = 'Bug Report: ' . $subject;
        
        $message = '
        <html>
        <body>        
            <h2>New Bug Report</h2>
            <table>
                <tr><td><strong>Name:</strong></td><td>' . htmlspecialchars($name) . '</td></tr>
                <tr><td><strong>Subject:</strong></td><td>' . htmlspecialchars($subject) . '</td></tr>
                <tr><td><strong>Description:</strong></td><td>' . nl2br(htmlspecialchars($description)) . '</td></tr>
            </table>';
        
        // Handle screenshot if provided
        if (!empty($screenshotData)) {
            $screenshotPath = saveScreenshot($screenshotData);
            if ($screenshotPath) {
                $message .= '<p><strong>Screenshot:</strong></p><img src="cid:screenshot" width="500">';
            }
        }
        
        $message .= '
            <br><hr>
            <span style="font-size: 14px;">
                This bug report was submitted through the system.<br>
                Please contact the reporter directly if you need more information.
            </span>
        </body>
        </html>';
        
        // Set headers similar to your existing format
        $headers = 'Bcc: nathan.overboe@walsworth.com' . "\r\n";
        $headers .= 'From: ampd@walsworth.com' . "\r\n";
        $headers .= 'Content-type: text/html; charset=utf-8' . "\r\n";
        $headers .= 'MIME-Version: 1.0' . "\r\n";
        $headers .= 'Reply-To: doNotReply@walsworth.com' . "\r\n";
        $headers .= 'X-Mailer: PHP/' . phpversion();
        
        // Additional headers for inline image if screenshot exists
        if (!empty($screenshotPath)) {
            $boundary = md5(time());
            $headers = str_replace('Content-type: text/html;', 'Content-Type: multipart/related; boundary="' . $boundary . '"', $headers);
            
            $message = "--$boundary\r\n"
                . "Content-Type: text/html; charset=utf-8\r\n\r\n"
                . str_replace('<img src="cid:screenshot"', '<img src="cid:screenshot@bugreport"', $message)
                . "\r\n\r\n--$boundary\r\n"
                . "Content-Type: image/png\r\n"
                . "Content-Transfer-Encoding: base64\r\n"
                . "Content-ID: <screenshot@bugreport>\r\n"
                . "Content-Disposition: inline; filename=\"screenshot.png\"\r\n\r\n"
                . base64_encode(file_get_contents($screenshotPath)) . "\r\n"
                . "--$boundary--";
        }
        
        // Send email
        $to = 'noverboe@documation.com';
        if (mail($to, $emailSubject, $message, $headers)) {
            $_SESSION['bug_report_status'] = 'success';
            $_SESSION['bug_report_message'] = 'Thank you for your bug report! We will look into it.';
        } else {
            throw new Exception('Failed to send email');
        }
        
        // Clean up screenshot file if it exists
        if (!empty($screenshotPath) && file_exists($screenshotPath)) {
            unlink($screenshotPath);
        }
        
    } catch (Exception $e) {
        $_SESSION['bug_report_status'] = 'error';
        $_SESSION['bug_report_message'] = 'Error: ' . $e->getMessage();
    }
    
    // Redirect back to the original page
    header('Location: ' . $redirectTo);
    exit;
}

function saveScreenshot($dataUrl) {
    // Extract the base64 data
    $matches = [];
    if (preg_match('/^data:image\/(\w+);base64,/', $dataUrl, $matches)) {
        $extension = $matches[1];
        $data = substr($dataUrl, strpos($dataUrl, ',') + 1);
        $data = base64_decode($data);
        
        if ($data !== false) {
            $filename = 'bugreport_' . time() . '.png';
            $path = sys_get_temp_dir() . '/' . $filename;
            if (file_put_contents($path, $data)) {
                return $path;
            }
        }
    }
    return false;
}
?>