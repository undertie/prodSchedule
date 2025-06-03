<html>
<head>
    <meta charset="utf-8">
    <title>Production Schedule</title>

	<link rel="stylesheet" type="text/css" href="css/prodTable.css?version=1.5">
    <!-- Load in Google fonts -->
    <link href="https://fonts.googleapis.com/css?family=Muli" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css?family=Baloo+Chettan" rel="stylesheet">
    <!-- Use Font Awesome's CDN for quicker load times -->
    <script src="https://use.fontawesome.com/44a2302c40.js"></script>
    <!-- Use Google CDN to host the jQuery library for quicker load times -->
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
    <!-- The link and script tags here are loading the classes and functions for 'Datatables Buttons' -->
    <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/v/dt/jq-2.2.4/jszip-3.1.3/pdfmake-0.1.27/dt-1.10.15/b-1.4.0/b-colvis-1.4.0/b-flash-1.4.0/b-html5-1.4.0/b-print-1.4.0/datatables.min.css"/>
    <script type="text/javascript" src="https://cdn.datatables.net/v/dt/jq-2.2.4/jszip-3.1.3/pdfmake-0.1.27/dt-1.10.15/b-1.4.0/b-colvis-1.4.0/b-flash-1.4.0/b-html5-1.4.0/b-print-1.4.0/datatables.min.js"></script>
    <!-- Column reordering plugin for datatables -->
    <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/colreorder/1.5.2/css/colReorder.dataTables.min.css">
	<script type="text/javascript" src="https://cdn.datatables.net/colreorder/1.5.2/js/dataTables.colReorder.min.js"></script>

   <script type="text/javascript" src="script.js"></script>
</head>
	<script>
	
	</script>
	<div id="headerUnderBackground">
		<div id="headerBackground" class="devBackgroundColour">
	        <div id="makeFixed">
	            <h1>Production Schedule</h1>
	            <div class="header-row">
	                <!-- Buttons on the left -->
	                <div class="buttons-container">
	                </div>
	                <!-- Filters in the middle -->
	                <div class="filters">
	                    <label for="deptFilter">Department:</label>
	                    <select id="deptFilter">
	                    </select>
	                </div>
                    <div class="process-status-container">
                        <div class="process-box match-col-Last-Cover-Process-Header">Last-Cover-Process</div>
                        <div class="process-box match-col-Last-Body-Process-Header">Last-Body-Process</div>
                        <div class="process-box match-col-Next-Cover-Process-Header">Next-Cover-Process</div>
                        <div class="process-box match-col-Next-Body-Process-Header">Next-Body-Process</div>
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
	            <th>Job Status</th> <!-- 1 -->
	            <th>Job In Date</th> <!-- 2 -->
	            <th>Proof Due Date</th> <!-- 3 -->
	            <th>Ship Date</th> <!-- 4 -->
	            <th>Arrival Date</th> <!-- 5 -->
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
	            <th>MP_Description</th> <!-- 34 -->
	            <th>MP_Time</th> <!-- 35 -->
	            <th>Job Priority</th> <!-- 36 -->
	            <th>Does It Blend</th> <!-- 37 -->
	            <th>Did It Blend</th> <!-- 38 -->
	            <th>Is It Wednesday</th> <!-- 39 -->
	            <th>Job Comp</th> <!-- 40 -->
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