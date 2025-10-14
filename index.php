<?php
session_start();
?>

<html>
<head>
    <meta charset="utf-8">
    <title>Production Schedule</title>

    <link rel="stylesheet" type="text/css" href="css/prodTable.css?version=1.5">
    <link rel="stylesheet" type="text/css" href="css/emailCSS.css">
    <!-- Load in Google fonts -->
    <link href="https://fonts.googleapis.com/css?family=Muli" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css?family=Baloo+Chettan" rel="stylesheet">
    <!-- Use Font Awesome's CDN for quicker load times -->
    <script src="https://use.fontawesome.com/44a2302c40.js"></script>
    <!-- Use Google CDN to host the jQuery library for quicker load times -->
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
    <!-- The link and script tags here are loading the classes and functions for 'Datatables Buttons' -->
    <link rel="stylesheet" href="https://cdn.datatables.net/v/dt/dt-1.13.6/b-2.4.1/b-html5-2.4.1/datatables.min.css">
    <script src="https://cdn.datatables.net/v/dt/dt-1.13.6/b-2.4.1/b-html5-2.4.1/datatables.min.js"></script>
    <!-- Optional: Column Reorder -->
    <link rel="stylesheet" href="https://cdn.datatables.net/colreorder/1.6.2/css/colReorder.dataTables.min.css">
    <script src="https://cdn.datatables.net/colreorder/1.6.2/js/dataTables.colReorder.min.js"></script>
    <!-- CSS -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/css/toastr.min.css" rel="stylesheet">
    <!-- JS (after jQuery) -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/js/toastr.min.js"></script>
    <!-- Add this before your DataTables script -->
   <script type="text/javascript" src="script.js"></script>
   <script type="text/javascript" src="emailJS.js"></script>

   <!-- DataTables RowGroup CSS -->
<link rel="stylesheet" href="https://cdn.datatables.net/rowgroup/1.3.1/css/rowGroup.dataTables.min.css">

<!-- DataTables RowGroup JS -->
<script src="https://cdn.datatables.net/rowgroup/1.3.1/js/dataTables.rowGroup.min.js"></script>

</head>
    <script>
    
    </script>
    <div id="headerUnderBackground" class="header-container">
        <div id="headerBackground">
            <div id="makeFixed">
                <h1>Production Schedule</h1>
                <div class="header-row">

                    <?php
                    if (isset($_SESSION['bug_report_status'])) {
                        $alertType = $_SESSION['bug_report_status'] === 'success' ? 'alert-success' : 'alert-danger';
                        echo '<div class="alert ' . $alertType . '" style="position: static; z-index: 1000;">
                                ' . htmlspecialchars($_SESSION['bug_report_message']) . '
                              </div>';
                        
                        // Clear the message after displaying
                        unset($_SESSION['bug_report_status']);
                        unset($_SESSION['bug_report_message']);
                    }
                    ?>

                    <!-- Report Bug Button -->
                    <button id="reportBugBtn" class="report-bug-btn">Report Bug <i class="fa fa-bug" aria-hidden="true"></i></button>

                    <!-- Bug Report Modal -->
                    <div id="bugReportModal" class="modal">
                        <div class="modal-content">
                            <span class="close">&times;</span>
                            <h2>Report a Bug</h2>
                            <form id="bugReportForm" action="emailBackend.php" method="POST" enctype="multipart/form-data">
                                <div class="form-group">
                                    <label for="name">Your Name:</label>
                                    <input type="text" id="name" name="name" required>
                                </div>
                                <div class="form-group">
                                    <label for="subject">Subject:</label>
                                    <input type="text" id="subject" name="subject" required>
                                </div>
                                <div class="form-group">
                                    <label for="description">Description:</label>
                                    <textarea id="description" name="description" rows="5" required></textarea>
                                </div>
                                <div class="form-group">
                                    <label for="screenshot">Screenshot:</label>
                                    <div class="screenshot-container">
                                        <div id="screenshotPreview" class="screenshot-preview"></div>
                                        <input type="file" id="screenshotUpload" name="screenshot" accept="image/*" style="display: none;">
                                    </div>
                                </div>
                                <input type="hidden" id="screenshotData" name="screenshotData">
                                <input type="hidden" name="redirect_to" value="index.php">
                                <button type="submit" class="submit-btn">Send Report</button>
                            </form>
                        </div>
                    </div>

                    <!-- Buttons on the left -->
                    <div class="buttons-container">
                    </div>

                    <div id="leftTemplateTable">
                        <div id="priority-indicator" class="*-priority-single">Priority - <i class="fa fa-star"></i></div>
                        <div id="priority-indicator" class="*-priority-double">Priority - <i class="fa fa-star"></i><i class="fa fa-star"></i></div>
                    </div>
                    
                    <!-- Filters in the middle -->
                    <div class="filters">
                        <label for="deptFilter">Department:</label>
                        <select id="deptFilter">
                        </select>
                    </div>

                    <!-- Search on the right -->
                    <div class="search-container">
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div id="contain"><br><br>
        <table border=0 id="prodTable" class="display" cellspacing="0" width="100%">
            <thead>
                <th>JobNumber</th> <!-- 0 -->
                <th>Job Comp</th> <!-- 40 -->
                <th>Job Status</th> <!-- 1 -->
                <th>Status</th> <!-- 1 -->
                <th>Job Priority</th> <!-- 36 -->
                <th>Job In Date</th> <!-- 2 -->
                <th>Proof Due Date</th> <!-- 3 -->
                <th>Projected Ship Date</th> <!-- 4 -->
                <th>Carrier</th> <!-- 6 -->
                <th>ShipType</th> <!-- 7 -->
                <th>Job Creator</th> <!-- 8 -->
                <th>Customer CSR</th> <!-- 9 -->
                <th>Customer</th> <!-- 10 -->
                <th>Cust Name</th> <!-- 11 -->
                <th>JobDescription</th> <!-- 12 -->
                <th>Comp1 Pages</th> <!-- 13 -->
                <th>Comp2 Pages</th> <!-- 14 -->
                <th>Quantity</th> <!-- 15 -->
                <th>Size</th> <!-- 16 -->
                <th>CoverCoating</th> <!-- 17 -->
                <th>Last Cover Process</th> <!-- 18 -->
                <th>Last Cover Description</th> <!-- 19 -->
                <th>Last Body Process</th> <!-- 20 -->
                <th>Last Body Description</th> <!-- 21 -->
                <th>CoverPrintedAt</th> <!-- 22 -->
                <th>Material WIP Cost</th> <!-- 23 -->
                <th>Production WIP Cost</th> <!-- 24 -->
                <th>PONumber</th> <!-- 25 -->
                <th>OrderSellPrice</th> <!-- 26 -->
                <th>Next Cover Process</th> <!-- 27 -->
                <th>Next Cover Description</th> <!-- 28 -->
                <th>NCP Time</th> <!-- 29 -->
                <th>Next Body Process</th> <!-- 30 -->
                <th>Next Body Description</th> <!-- 31 -->
                <th>NBP Time</th> <!-- 32 -->
                <th>Main Process</th> <!-- 33 -->
                <th>Main Process Description</th> <!-- 34 MP_Description -->
                <th>Main Process Time</th> <!-- 35 MP_Time-->
                <th>Does It Mail</th> <!-- 37 Does It Blend -->
                <th>List Process Complete</th> <!-- 38 Did It Blend-->
                <th>Does It SW</th> <!-- 39 Is It Wednesday -->
                <th>Mat Code</th> <!-- 41 -->
                <th>Mat Qty</th> <!-- 42 -->
                <th>Mat BWT</th> <!-- 43 -->
                <th>Mat Description</th> <!-- 44 -->
                <th>Parent Sheet Size</th> <!-- 45 -->
                <th>Parent Out</th> <!-- 46 -->
                <th>Press Size</th> <!-- 47 -->
                <th>Press Out</th> <!-- 48 -->
                <th>Print Type</th> <!-- 49 -->
                <th>Print Time</th> <!-- 50 -->
                <th>Last_Comp3_Description</th> <!-- 51 -->
                <th>Last_Comp3_Process</th> <!-- 52 -->
                <th>Next_Comp3_Description</th> <!-- 53 -->
                <th>Next_Comp3_Process</th> <!-- 54 -->
                <th>Next_Comp3_Time</th> <!-- 55 -->
                <th>Prepress Notes</th> <!-- 56 -->
                <th>Postpress Notes</th> <!-- 57 -->
                <th>Designer</th> <!-- 58 -->
                <th>Last Completed Process</th> <!-- 59 -->
                <th>Last Completed Description</th> <!-- 60 -->
                <th>Next Process</th> <!-- 61 -->
                <th>Next Description</th> <!-- 62 -->
                <th>Next Time</th> <!-- 63 -->
                <th>Drill_Process</th> <!-- 64 -->
                <th>Drill_Description</th> <!-- 65 -->
                <th>Drill_Time</th> <!-- 66 -->
                <th>Hunkler_Process</th> <!-- 67 -->
                <th>Hunkler_Description</th> <!-- 68 -->
                <th>Hunkler_Time</th> <!-- 69 -->
                <th>Is_It_Capstone</th> <!-- 70 -->
                <th>Master_Ship</th> <!-- 71 -->
                <th>Ships_With</th> <!-- 72 -->
                <th>Select Main Process</th> <!-- 72 -->
                <th>Select Department</th> <!-- 72 -->
            </thead>
            <tbody>
                <!-- Data will be populated by DataTables -->
            </tbody>
        </table>

        <!-- Hidden template for detailed table -->
        <template id="detailed-table-template">
            <table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">
                <thead>
                    <tr>
                        <th>Job Number</th>
                        <th>Component Number</th>
                        <th>Process Code</th>
                        <th>Description</th>
                        <th>Completion Code</th>
                        <th>Create Date</th>
                        <th>Name</th>
                        <th>Comments</th>
                    </tr>
                </thead>
                <tbody>
                <!-- Rows will be dynamically added here -->
                </tbody>
            </table>
        </template>

    </div>

    <div id="connection-dot"></div>
</body>
</html>