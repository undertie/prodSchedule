$(document).ready(function() {
    // Global variables
    let table;
    let currentDeptFilter = null;
    let isTableInitialized = false;
    let initialDataRequested = false;
    let currentNotSearch = null;

    // variables for automatic reconnect
    let socket;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 5000; // 5 seconds
    let isReconnecting = false;

    // variable for checking if rows are opon on data refresh
    var drawHandler = null;
    const openRows = new Set();

    const departmentMapping = [
        {
            text: "Coating",
            values: ["6610", "6611", "6612", "6613", "6625", "6615", "6616", "6620", "6621"],
            subsections: [
                {
                    text: "Lamination",
                    values: ["6610", "6611", "6612", "6613", "6625"]
                },
                {
                    text: "UV Coating",
                    values: ["6615", "6616", "6620", "6621"]
                }
            ]
        },
        {
            text: "CSR", 
            values: [],
            subsections: [
                {
                    text: "Amber",
                    values: ["Amber Henke"]
                },
                {
                    text: "Brent",
                    values: ["Brent Squires"]
                },
                {
                    text: "Capstone",
                    values: ["cpstone"]
                },
                {
                    text: "Cathy",
                    values: ["Cathy Rosolack"]
                },
                {
                    text: "Gabbi",
                    values: ["Gabrielle Gentry"]
                },
                {
                    text: "Lisa",
                    values: ["Lisa Douglas"]
                },
                {
                    text: "Sarah",
                    values: ["Sarah Woodford"]
                },
                {
                    text: "Review",
                    values: ["In Production", "NoCap"]
                },
                {
                    text: "*",
                    values: ["*", "**"]
                }  
            ]
        },
        {
            text: "Drill",
            values: ["6505", "6506", "6510"]
        },
        {
            text: "Folders",
            values: ["6151", "6126"]
        },
        {
            text: "Hand Bindery",
            values: ["6305", "6306", "6325", "6540"]
        },
        {
            text: "Hunkler",
            values: ["5900", "5901", "5906"]
        },
        {
            text: "Mail",
            values: ["Yes", "6800", "6832"]
        },
        {
            text: "MBO",
            values: ["5951", "5952"]
        },
        {
            text: "Morgana",
            values: ["6525"]
        },
        {
            text: "Perfect Binders",
            values: ["6425", "6427", "6404", "6405", "6411", "6421"],
            subsections: [
                {
                    text: "BQ 470",
                    values: ["6425", "6427"]
                },
                {
                    text: "SB-07",
                    values: ["6404", "6405"]
                },
                {
                    text: "SB-09",
                    values: ["6411", "6421"]
                }
            ]
        },
        {
            text: "PrePress",
            values: [], //["1000", "1055", "1060", "1062", "1064", "1066", "1160", "1165", "1305", "1310", "1445", "1460"]  // Subsections added 8May25
            subsections: [
                {
                    text: "Needs Proof",
                    values: ["1000", "1055", "1060", "1062", "1064"]
                },
                {
                    text: "Proof Out",
                    values: ["1445", "1455", "1442"]
                },
                {
                    text: "Imposition",
                    values: ["1310", "1305"]
                },
            ]
        },
        {
            text: "Priming",
            values: ["6622"]
        },
        {
            text: "Print",
            values: ["5301", "5302", "5303", "3000", "3010", "3011", "3012", "3019", "3020", "3022", "5100", "5110", "5120", "5500", "5515", "5525", "5545", "5555", "5565", "5800", "5801", "5803", "5804", "5805", "5806", "5807", "5808", "5809", "5802", "5851", "5852"],
            subsections: [
                {
                    text: "HP100K",
                    values: ["5301", "5302", "5303"]
                },
                {
                    text: "T200 Inkjet",
                    values: ["3000", "3010", "3011", "3012", "3019", "3020", "3022"]
                },
                {
                    text: "Toner",
                    values: ["5100", "5110", "5120", "5500", "5515", "5525", "5545", "5555", "5565", "5800", "5801", "5803", "5804", "5805", "5806", "5807", "5808", "5809", "5802", "5851", "5852"]
                }
            ]
        },
        {   
            text: "Saddle-Stitch",
            values: ["6251", "6252"]
        },
        {
            text: "Shipping",
            values: ["6705", "6710", "6715", "6719", "6720", "6723", "6729", "6728", "6730", "6731"]
        },
        {
            text: "Shrink-Wrap",
            values: ["Yes", "6700", "6702", "6725"]
        },
        {
            text: "Spiral",
            values: ["6451", "6453", "6452", "6460", "6461"]
        },
        {
            text: "Smart-Binders",
            values: [],
            subsections: [
                {
                    text: "BQ-480",
                    values: ["6385", "6390", "6395"]
                },
                {
                    text: "BQ-500",
                    values: ["6415", "6416", "6417"]
                }
            ]
        },
        {
            text: "Wire-O",
            values: ["6450", "6455"]
        }
    ];
    // end departmentMapping

    const departmentColumnMapping = {
        "Coating": ['Next_Comp_Process'],
        "Lamination": ['Next_Comp_Process'],
        "UV Coating": ['Next_Comp_Process'],
        "CSR": ['Customer_CSR'],
        "Amber": ['Customer_CSR'], // Customer_CSR = Amber
        "Brent": ['Customer_CSR'], // Customer_CSR = Brent
        "Capstone": ['Is_It_Capstone'], //cpstone
        "Cathy": ['Customer_CSR'], // Customer_CSR = Cathy
        "Gabbi": ['Customer_CSR'], // Customer_CSR = Gabbi
        "Lisa": ['Customer_CSR'], // Customer_CSR = Lisa
        "Sarah": ['Customer_CSR'], // Customer_CSR = Sarah
        "Review": ['Status', 'Is_It_Capstone'], // In Production and Not Capstone
        "*": ['JobPriority'],
        "Drill": ['Drill_Process'], 
        "Folders": ['Next_Comp_Process'],
        "Hand Bindery": ['Next_Comp_Process'],
        "Hunkler": ['Next_Comp_Process'],
        "Mail": ['Does_it_blend', 'Did_it_blend'], // any non-null
        "MBO": ['Next_Comp_Process'],
        "Morgana": ['Next_Comp_Process'],
        "Perfect Binders": ['Main_Process'], // Main_Process includes a Perfect Bind Process: ["6425", "6427", "6404", "6405", "6411", "6421"]
        "BQ 470": ['Main_Process'], // Main_Process includes ["6425", "6427"]
        "SB-07": ['Main_Process'],  // Main_Process includes ["6404", "6405"]
        "SB-09": ['Main_Process'],  // Main_Process includes ["6411", "6421"]
        "PrePress": ['Next_Comp_Process'],
        "Needs Proof": ['Next_Comp_Process'],
        "Proof Out": ['Next_Comp_Process'],
        "Imposition": ['Next_Comp_Process'],
        "Priming": ['Next_Comp_Process'],
        "Print": ['Next_Comp_Process'],
        "HP100K": ['Next_Comp_Process'],
        "T200 Inkjet": ['Next_Comp_Process'],
        "Toner": ['Next_Comp_Process'],
        "Saddle-Stitch": ['Main_Process'], // Main_Process includes a Saddle-Stitch Process: ["6251", "6252"]
        "Shipping": ['Next_Comp_Process'],
        "Shrink-Wrap": ['Is_It_Wednesday'], // any non-null
        "Spiral": ['Main_Process'], // Main_Process includes a Spiral Process: ["6451", "6453", "6452", "6460", "6461"]
        "Smart-Binders": ['Next_Comp_Process'],
        "BQ-480": ['Next_Comp_Process'],
        "BQ-500": ['Next_Comp_Process'],
        "Wire-O": ['Next_Comp_Process']
    };
    // end departmentColumnMapping

    const columnVisibilityRules = {
        //added 17June EH
        "Amber": ['JobNumber', 'JobStatus', 'PrepressNotes', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'Last_Cover_Description', 'Last_Body_Description',  'Last_Comp3_Description', 'Next_Comp_Description', 'Does_it_blend', 'Did_it_blend', 'Projected_Ship_Date'],
        "Brent": ['JobNumber', 'PrepressNotes', 'PostpressNotes', 'Job_In_Date', 'Proof_Due_Date', 'Projected_Ship_Date', 'JobDescription', 'CustName', 'Quantity', 'Last_Cover_Description', 'Last_Body_Description', 'MP_Description', 'Designer'],
        "Capstone": ['JobNumber', 'Projected_Ship_Date', 'PostpressNotes', 'JobDescription', 'Quantity', 'Last_Cover_Description', 'Last_Body_Description',  'Next_Comp_Description'],
        "Cathy": ['JobNumber', 'JobStatus', 'PrepressNotes', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'Last_Cover_Description', 'Last_Body_Description',  'Last_Comp3_Description', 'Next_Comp_Description', 'Does_it_blend', 'Did_it_blend', 'Projected_Ship_Date'],
        "Gabbi": ['JobNumber', 'JobStatus', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'Last_Cover_Description', 'Last_Body_Description',  'Last_Comp3_Description', 'Next_Comp_Description', 'Does_it_blend', 'Did_it_blend', 'Mat_BWT', 'Mat_Description', 'Projected_Ship_Date'],
        "Lisa":  ['JobNumber', 'JobStatus', 'PrepressNotes', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'Last_Cover_Description', 'Last_Body_Description',  'Last_Comp3_Description', 'Next_Comp_Description', 'Does_it_blend', 'Did_it_blend', 'Projected_Ship_Date'],
        "Sarah": ['JobNumber', 'PrepressNotes', 'PostpressNotes', 'Job_In_Date', 'Proof_Due_Date', 'Projected_Ship_Date', 'JobDescription', 'CustName', 'Quantity', 'Last_Cover_Description', 'Last_Body_Description', 'MP_Description', 'Designer'],
        "Review": ['JobNumber',  'Customer_CSR', 'JobStatus', 'Projected_Ship_Date', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'Last_Cover_Description', 'Last_Body_Description',  'Next_Comp_Description', 'Does_it_blend', 'Main_Process', 'Select_Main_Process', 'Print_Type', 'Select_Department', 'Master_Ship'],
        "*": ['JobNumber', 'Projected_Ship_Date', 'PrepressNotes', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'Last_Cover_Description', 'Last_Body_Description',  'Last_Comp3_Description', 'Next_Comp_Description', 'Does_it_blend', 'Did_it_blend', 'Projected_Ship_Date'],
        "Lamination": ['JobNumber', 'Projected_Ship_Date', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'CoverCoating', 'Last_Cover_Description', 'NCP_Time'],
        "UV Coating": ['JobNumber', 'Projected_Ship_Date', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'CoverCoating', 'Last_Cover_Description', 'NCP_Time'],
        "Drill": ['JobNumber',  'Projected_Ship_Date', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'Size', 'CoverCoating', 'Last_Cover_Description', 'Last_Body_Description', 'NBP_Time'],
        "Folders": ['JobNumber',  'Projected_Ship_Date', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'Size', 'CoverCoating', 'Last_Cover_Description', 'Last_Body_Description', 'NBP_Time'],
        "Hand Bindery": ['JobNumber',  'Projected_Ship_Date', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'Size', 'CoverCoating', 'Last_Cover_Description', 'Last_Body_Description', 'NBP_Time'],
        "Hunkler": ['JobNumber',  'Projected_Ship_Date', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'Size', 'CoverCoating', 'Last_Cover_Description', 'Last_Body_Description', 'NBP_Time'],
        "Mail": ['JobNumber', 'Projected_Ship_Date', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'Size', 'CoverCoating', 'Last_Cover_Description', 'Last_Body_Description', 'Does_it_blend', 'Did_it_blend','Is_It_Wednesday', 'Carrier', 'ShipType'],
        "MBO": ['JobNumber',  'Projected_Ship_Date', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity',  'Last_Completed_Comp_Description', 'Next_Comp_Time'],
        "Morgana": ['JobNumber',  'Projected_Ship_Date', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'Size', 'Next_Comp_Description', 'NBP_Time'],
        "Perfect Binders": ['JobNumber', 'Main_Process', 'Select_Main_Process', 'Projected_Ship_Date', 'PostpressNotes', 'CustName', 'JobDescription', 'Comp2_Pages', 'Quantity', 'Size', 'CoverCoating', 'Last_Cover_Description', 'Last_Body_Description', 'Mat_Description'],
        "BQ 470": ['JobNumber',  'Projected_Ship_Date', 'PostpressNotes', 'CustName', 'JobDescription', 'Comp2_Pages', 'Quantity', 'Size', 'CoverCoating', 'Last_Cover_Description', 'Last_Body_Description', 'NBP_Time'],
        "SB-07": ['JobNumber',  'Projected_Ship_Date', 'PostpressNotes', 'CustName', 'JobDescription', 'Comp2_Pages', 'Quantity', 'Size', 'CoverCoating', 'Last_Cover_Description', 'Last_Body_Description', 'NBP_Time'], 
        "SB-09": ['JobNumber',  'Projected_Ship_Date', 'PostpressNotes', 'CustName', 'JobDescription', 'Comp2_Pages', 'Quantity', 'Size', 'CoverCoating', 'Last_Cover_Description', 'Last_Body_Description', 'NBP_Time'],
        // "PrePress": ['JobNumber',  'JobStatus', 'PrepressNotes', 'Designer', 'JobStatus', 'ComponentNumber', 'CustName', 'JobDescription', 'NCP_Time', 'NBP_Time', 'Proof_Due_Date', 'Customer_CSR', 'Projected_Ship_Date'],
        "Needs Proof": ['JobNumber', 'PrepressNotes', 'Designer', 'JobStatus', 'ComponentNumber', 'CustName', 'JobDescription', 'NCP_Time', 'NBP_Time', 'Proof_Due_Date', 'Customer_CSR', 'JobStatus', 'Projected_Ship_Date'],
        "Proof Out": ['JobNumber', 'PrepressNotes', 'Designer', 'JobStatus', 'ComponentNumber', 'CustName', 'JobDescription', 'NCP_Time', 'NBP_Time', 'Proof_Due_Date', 'Customer_CSR', 'JobStatus', 'Projected_Ship_Date'],
        "Imposition": ['JobNumber', 'PrepressNotes', 'Designer', 'JobStatus', 'ComponentNumber', 'CustName', 'JobDescription', 'NCP_Time', 'NBP_Time', 'Proof_Due_Date', 'Customer_CSR', 'JobStatus', 'Projected_Ship_Date'],
        "Priming": ['JobNumber', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'Next_Comp_Time'],
        // "Print"
        "Print":  ['JobNumber', 'JobStatus', 'Print_Type', 'Select_Department', 'Next_Comp_Description', 'PostpressNotes', 'ComponentNumber', 'Print_Time', 'Projected_Ship_Date',  'CustName', 'JobDescription', 'Quantity', 'CoverCoating', 'Last_Cover_Description', 'Mat_Qty', 'Mat_BWT', 'Mat_Description', 'Mat_Code', 'Press_Size', 'Press_Out', 'Customer_CSR', 'Does_it_blend', 'Did_it_blend', 'Parent_Sheet_Size', 'Parent_Out'],
        "HP100K": ['JobNumber', 'JobStatus', 'PostpressNotes', 'ComponentNumber', 'Print_Time', 'JobStatus', 'Projected_Ship_Date',  'CustName', 'JobDescription', 'Quantity', 'CoverCoating', 'Last_Cover_Description', 'Last_Body_Description', 'Mat_Qty', 'Mat_BWT', 'Mat_Description', 'Mat_Code', 'Press_Size', 'Press_Out', 'Customer_CSR'],
        "T200 Inkjet": ['JobNumber', 'JobStatus', 'PostpressNotes', 'ComponentNumber', 'Print_Time', 'JobStatus', 'Projected_Ship_Date',  'CustName', 'JobDescription', 'Quantity', 'Last_Cover_Description', 'Mat_Code', 'Mat_Qty', 'Mat_BWT', 'Mat_Description', 'Press_Size', 'Customer_CSR'],
        "Toner": ['JobNumber', 'JobStatus', 'PostpressNotes', 'ComponentNumber', 'Print_Time', 'JobStatus', 'Projected_Ship_Date',  'CustName', 'JobDescription', 'Quantity', 'CoverCoating', 'Last_Cover_Description', 'Mat_Code', 'Mat_Qty', 'Mat_BWT', 'Mat_Description', 'Parent_Sheet_Size', 'Parent_Out', 'Press_Size', 'Press_Out', 'Print_Type', 'Customer_CSR'],
            // "Saddle-Stitch" Defined by "C1MP_M_Proc" OR "C2MP_M_Proc" IN ["6251", "6252"]
        "Saddle-Stitch": ['JobNumber', 'Projected_Ship_Date', 'PostpressNotes', 'CustName', 'JobDescription', 'Comp1_Pages', 'Comp2_Pages', 'Quantity', 'Size', 'CoverCoating', 'Last_Cover_Description', 'Last_Body_Description', 'NBP_Time'],
        "Shipping": ['JobNumber', 'Projected_Ship_Date', 'PostpressNotes', 'Master_Ship', 'Ships_With', 'CustName', 'JobDescription', 'Customer_CSR', 'Quantity', 'Carrier', 'ShipType', 'Next_Comp_Description'],
            // "Shrink-Wrap" Defined by a "Yes" in the "Is_It_Wednesday" column 
        "Shrink-Wrap": ['JobNumber', 'Projected_Ship_Date', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'Size', 'Last_Cover_Description', 'Last_Body_Description', 'Next_Comp_Time'],
        "Spiral": ['JobNumber', 'Projected_Ship_Date', 'PostpressNotes', 'CustName', 'JobDescription', 'Comp2_Pages', 'Quantity', 'Size', 'CoverCoating', 'Last_Cover_Description', 'Last_Body_Description', 'NBP_Time', 'Next_Comp_Description' ],
        // "Smart-Binders"
        "BQ-480": ['JobNumber', 'Projected_Ship_Date', 'PostpressNotes', 'CustName', 'JobDescription', 'Comp2_Pages', 'Quantity', 'Size', 'CoverCoating', 'Last_Cover_Description', 'Last_Body_Description', 'NBP_Time'],
        "BQ-500": ['JobNumber', 'Projected_Ship_Date', 'PostpressNotes', 'CustName', 'JobDescription', 'Comp2_Pages', 'Quantity', 'Size', 'CoverCoating', 'Last_Cover_Description', 'Last_Body_Description', 'NBP_Time'],
        "Wire-O": ['JobNumber', 'Projected_Ship_Date', 'PostpressNotes', 'CustName', 'JobDescription', 'Comp2_Pages', 'Quantity', 'Size', 'CoverCoating', 'Last_Cover_Description', 'Last_Body_Description', 'NBP_Time']

        // Add more rules as needed
    };
    // end columnVisibilityRules

        const designerColors = {
        // Define colors for each designer
        'Samantha Jaskowski': '#FFD700',  // Gold
        'Kyle Stuttgen': '#87CEEB',    // Sky Blue
        'Adam Mueller': '#98FB98', // Pale Green
        // Add more designers as needed
        'default': '#E6E6FA'      // Lavender (fallback)
    };

    function initializeAll(initialData) {
        // Skip if table is already initialized
        if (isTableInitialized) {
            console.log("Skipping reinitialization");
            return;
        }
        console.log("Starting initialization");

        // Ensure the container exists
        const container = $('#contain');
        if (!container.length) {
            console.error("Container div not found!");
            return;
        }

        // Show the container (in case it was hidden)
        container.show();
        
        // Properly destroy existing table
        if ($.fn.DataTable.isDataTable('#prodTable')) {
            console.log("Destroying existing table");
            // Save scroll position if needed
            const scrollPos = $(window).scrollTop();
            
            table.clear().destroy();
            $('#prodTable').remove(); // Completely remove the table

            isTableInitialized = false;
            
            // Recreate the table structure
            container.append(`
                <table id="prodTable" class="display" cellspacing="0" width="100%">
                    <thead>
                        <tr>
                            <th>JobNumber</th> <!-- 0 -->
                            <th>Job Comp</th> <!-- 40 -->
                            <th>Job Status</th> <!-- 1 -->
                            <th>Status</th> <!-- 1 -->
                            <th>Job Priority</th> <!-- 36 -->
                            <th>Job In Date</th> <!-- 2 -->
                            <th>Proof Due Date</th> <!-- 3 -->
                            <th>Ship Date</th> <!-- 4 -->
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
                            <th>Does It Blend</th> <!-- 37 -->
                            <th>Did It Blend</th> <!-- 38 -->
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
                            <th>Select Main Process</th> <!-- 73 -->
                            <th>Select Department</th> <!-- 74 -->
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
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
            `);
            
            // Restore scroll position
            $(window).scrollTop(scrollPos);
        }

        // If we have real data, initialize the table
        if (initialData.length > 0 && initialData[0].JobNumber) {
            // Initialize DataTable with proper callback
            initializeDataTable(initialData, function() {
                console.log("DataTable fully initialized - running post-init tasks");
                
                // Now run your post-initialization tasks
                setupTableEventHandlers();
                setupDepartmentDropdown();
                setupSearchHandler();
                fetchDesigners();
                
                // Apply saved filter after small delay
                setTimeout(() => {
                    const savedFilter = localStorage.getItem('deptFilter');
                    if (savedFilter) {
                        console.log("Applying saved filter:", savedFilter);
                        $('#deptFilter').val(savedFilter);
                        applyDepartmentFilter();
                    }
                }, 100);
                
                // Restore open rows if needed
                const openRows = JSON.parse(sessionStorage.getItem('openRows')) || [];
                if (openRows.length) {
                    console.log("Restoring open rows");
                    restoreOpenRows(openRows);
                }
                isTableInitialized = true;
            });
        } else {
            console.log("Waiting for WebSocket data...");
        }

    }

    let colorSessionId = 'session-' + Math.random().toString(36).substr(2, 9);

    if (!localStorage.getItem('colorSessionId')) {
        localStorage.setItem('colorSessionId', colorSessionId);
    } else {
        colorSessionId = localStorage.getItem('colorSessionId');
    }

    // Store search handler in a variable we can clean up
    let searchHandler = null;

    // Initialize DataTable and all functionality
    function initializeDataTable(initialData = [], callback) {
        //console.log("Checking table element exists:", $('#prodTable').length);
        //console.log("Table parent visibility:", $('#prodTable').parent().is(':visible'));

        // Verify table element exists
        const tableElement = $('#prodTable');
        if (!tableElement.length) {
            console.error("CRITICAL: prodTable element doesn't exist!");
            return;
        }
        
        // Verify table header structure
        if (tableElement.find('thead th').length === 0) {
            console.error("Table headers missing!");
            return;
        }

        // Create styled search box that matches DataTables style
        $('.search-container').html(`
            <div id="prodTable_filter" class="dataTables_filter">
                <label>Search:
                    <input type="search" id="customSearch" class="" placeholder="" aria-controls="prodTable">
                </label>
            </div>
        `);

        table = $('#prodTable').DataTable({
            // Performance optimizations:
            // "deferRender": true,
            //"scrollY": "60vh",
            "data": initialData,
            "scrollCollapse": true,
            "scroller": true,
            "processing": true,
            // Alternative performance optimizations
            "renderer": "bootstrap", // More efficient rendering
            "deferLoading": true,     // Only loads data when needed
            "stateDuration": -1,      // Session storage instead of local storage
            "ordering": true,
            "autoWidth": false,
            "retrieve": true,
            "deferRender": true,
            "orderMulti": false, // Important - prevents multi-column sort interference
            "orderClasses": false, // Improves performance
            "aaSorting": [],
            "paging": true,
            "pageLength": 100,
            "bSort": false,            
            "scrollX": false,
            "autoWidth": true,
            "fixedColumns": false,
            "rowReorder": true,  // Enable row reordering
            "colReorder": {
                fixedColumnsLeft: 1,
                stateSave: false // Disable state saving
            },
            "order": [[7, 'asc']], // Order by Projected_Ship_Date (column 7)
            "drawCallback": function(settings) {
                addShipDateSeparators();
            },
            dom: 'Brtip',
            columns: [
                { data: 'JobNumber' , name: 'JobNumber' }, // 0
                { data: 'ComponentNumber' , name: 'ComponentNumber' }, // 40
                { data: 'JobStatus' , name: 'JobStatus' }, // 1
                { data: 'Status' , name: 'Status' }, // 1
                { data: 'JobPriority' , name: 'JobPriority' }, // 36          Added 30 May
                { data: 'Job_In_Date' , name: 'Job_In_Date' }, // 2
                { data: 'Proof_Due_Date' , name: 'Proof_Due_Date' }, // 3
                {
                  data: 'Projected_Ship_Date',
                  name: 'Projected_Ship_Date',
                  render: function(data, type, row) {
                    if (type === 'sort' || type === 'type') {
                      return new Date(data).getTime();
                    }
                    return data;
                  }
                }, // 4
                { data: 'Carrier' , name: 'Carrier' }, // 6
                { data: 'ShipType' , name: 'ShipType' }, // 7
                { data: 'Job_Creator' , name: 'Job_Creator' }, // 8
                { data: 'Customer_CSR' , name: 'Customer_CSR' }, // 9
                { data: 'Customer' , name: 'Customer' }, // 10
                { data: 'CustName' , name: 'CustName' }, // 11
                { 
                data: 'JobDescription' , name: 'JobDescription',
                    createdCell: function(td, cellData, rowData, row, col) {
                        // Apply max-width inline style
                        $(td).css('max-width', '250px');
                        $(td).css('white-space', 'normal');
                    } // 12
                },
                { data: 'Comp1_Pages' , name: 'Comp1_Pages' }, // 13
                { data: 'Comp2_Pages' , name: 'Comp2_Pages' }, // 14
                { data: 'Quantity' , name: 'Quantity' }, // 15
                { data: 'Size' , name: 'Size' }, // 16
                { data: 'CoverCoating' , name: 'CoverCoating' }, // 17
                { data: 'Last_Cover_Process' , name: 'Last_Cover_Process' }, // 18
                { data: 'Last_Cover_Description' , name: 'Last_Cover_Description' }, // 19
                { data: 'Last_Body_Process' , name: 'Last_Body_Process' }, // 20
                { data: 'Last_Body_Description' , name: 'Last_Body_Description' }, // 21
                { data: 'CoverPrintedAt' , name: 'CoverPrintedAt' }, // 22
                { data: 'Material_WIP_Cost' , name: 'Material_WIP_Cost' }, // 23
                { data: 'Production_WIP_Cost' , name: 'Production_WIP_Cost' }, // 24
                { data: 'PONumber' , name: 'PONumber' }, // 25
                { data: 'OrderSellPrice' , name: 'OrderSellPrice' }, // 26
                { data: 'Next_Cover_Process' , name: 'Next_Cover_Process' }, // 27
                { data: 'Next_Cover_Description' , name: 'Next_Cover_Description' }, // 28
                { data: 'NCP_Time' , name: 'NCP_Time' }, // 29
                { data: 'Next_Body_Process' , name: 'Next_Body_Process' }, // 30
                { data: 'Next_Body_Description' , name: 'Next_Body_Description' }, // 31
                { data: 'NBP_Time' , name: 'NBP_Time' }, // 32
                { data: 'Main_Process' , name: 'Main_Process' }, // 33 Changed 30 May
                { data: 'MP_Description' , name: 'MP_Description' }, // 34 Changed 30 May
                { data: 'MP_Time' , name: 'MP_Time' }, // 35        Changed 30 May
                { data: 'Does_it_blend' , name: 'Does_it_blend' }, // 37
                { data: 'Did_it_blend' , name: 'Did_it_blend' }, // 38
                { data: 'Is_It_Wednesday' , name: 'Is_It_Wednesday',
                        defaultContent: ''}, // provides empty string if field is missing }, // 39
                { data: 'Mat_Code' , name: 'Mat_Code' }, // 41
                { data: 'Mat_Qty' , name: 'Mat_Qty' }, // 42
                { data: 'Mat_BWT' , name: 'Mat_BWT' }, // 43
                { data: 'Mat_Description' , name: 'Mat_Description' }, // 44
                { data: 'Parent_Sheet_Size' , name: 'Parent_Sheet_Size' }, // 45
                { data: 'Parent_Out' , name: 'Parent_Out' }, // 46
                { data: 'Press_Size' , name: 'Press_Size' }, // 47
                { data: 'Press_Out' , name: 'Press_Out' }, // 48
                { data: 'Print_Type' , name: 'Print_Type' }, // 49
                { data: 'Print_Time' , name: 'Print_Time' }, // 50
                { data: 'Last_Comp3_Description' , name: 'Last_Comp3_Description' }, // 51
                { data: 'Last_Comp3_Process' , name: 'Print_Type' }, // 52
                { data: 'Next_Comp3_Description' , name: 'Next_Comp3_Description' }, // 53
                { data: 'Next_Comp3_Process' , name: 'Next_Comp3_Process' }, // 54
                { data: 'Next_Comp3_Time' , name: 'Next_Comp3_Time' }, // 55
                {
                    data: 'PrepressNotes',
                    name: 'PrepressNotes',
                    className: 'notes-cell',
                    render: function(data, type, row) {
                        if (type === 'display') {
                            return `
                                <div class="notes-container">
                                    <textarea class="notes-input form-control" 
                                        data-job="${row.JobNumber}" 
                                        data-component="${row.ComponentNumber}"
                                        data-field="PrepressNotes">${data || ''}</textarea>
                                    <button class="btn-save-notes btn-xs btn-primary">
                                        <i class="fa fa-save"></i> Save
                                    </button>
                                    <span class="save-status"></span>
                                </div>
                            `;
                        }
                        return data;
                    }
                }, // 56
                {
                    data: 'PostpressNotes',
                    name: 'PostpressNotes',
                    className: 'notes-cell',
                    render: function(data, type, row) {
                        if (type === 'display') {
                            return `
                                <div class="notes-container">
                                    <textarea class="notes-input form-control" 
                                        data-job="${row.JobNumber}" 
                                        data-component="${row.ComponentNumber}"
                                        data-field="PostPressNotes">${data || ''}</textarea>
                                    <button class="btn-save-notes btn-xs btn-primary">
                                        <i class="fa fa-save"></i> Save
                                    </button>
                                    <span class="save-status"></span>
                                </div>
                            `;
                        }
                        return data;
                    }
                }, // 57
                { 
                    data: 'Designer',
                    name: 'Designer',
                    render: function(data, type, row) {
                        // Return just the value for non-display purposes
                        if (type !== 'display') {
                            return data;
                        }
                        
                        // For display, return the select element with the current value
                        let options = '<option value="">Select designer</option>';
                        
                        if (designers && designers.length > 0) {
                            designers.forEach(designer => {
                                const selected = designer.EmployeeName === row.Designer ? 'selected' : '';
                                options += `<option value="${designer.EmployeeName}" ${selected}>${designer.EmployeeName}</option>`;
                            });
                        }
                        
                        return `<select class="designer-select form-control" 
                                  data-job="${row.JobNumber}" 
                                  data-component="${row.ComponentNumber}">
                                ${options}
                              </select>`;
                    }
                }, // 58
                { data: 'Last_Completed_Comp_Process' , name: 'Last_Completed_Comp_Process' }, // 59
                { data: 'Last_Completed_Comp_Description' , name: 'Last_Completed_Comp_Description' }, // 60
                { data: 'Next_Comp_Process' , name: 'Next_Comp_Process' }, // 61
                { data: 'Next_Comp_Description' , name: 'Next_Comp_Description' }, // 62
                { data: 'Next_Comp_Time' , name: 'Next_Comp_Time' }, // 63
                { data: 'Drill_Process' , name: 'Drill_Process' }, // 64
                { data: 'Drill_Description' , name: 'Drill_Description' }, // 65
                { data: 'Drill_Time' , name: 'Drill_Time' }, // 66
                { data: 'Hunkler_Process' , name: 'Hunkler_Process' }, // 67
                { data: 'Hunkler_Description' , name: 'Hunkler_Description' }, // 68
                { data: 'Hunkler_Time' , name: 'Hunkler_Time' }, // 69
                { data: 'Is_It_Capstone' , name: 'Is_It_Capstone' ,
                        defaultContent: ''}, // provides empty string if field is missing // 70
                {
                    data: 'Master_Ship',
                    name: 'Master_Ship',
                    className: 'ships-with-cell',
                    render: function(data, type, row) {
                        if (type === 'display') {
                            return `
                                <div class="ships-with-container">
                                    <textarea class="ships-with-input form-control" 
                                        data-job="${row.JobNumber}" 
                                        data-component="${row.ComponentNumber}"
                                        data-field="ShipsWith"
                                        placeholder="Enter shipping notes...">${data || ''}</textarea>
                                    <button class="btn-save-ships-with btn-xs btn-primary">
                                        <i class="fa fa-save"></i> Save
                                    </button>
                                    <span class="save-status"></span>
                                </div>
                            `;
                        }
                        return data;
                    }
                }, // 71
                { data: 'Ships_With' , name: 'Ships_With'  ,
                        defaultContent: ''}, // 72
                {
                    data: 'Select_Main_Process',
                    name: 'Select_Main_Process',
                    defaultContent: '',
                    render: function(data, type, row) {
                        if (type !== 'display') {
                            return data;
                        }
                        
                        let options = '<option value="">Select main process</option>';
                        
                        // Get main process options from departmentMapping
                        const mainProcesses = [];
                        
                        // Add Perfect Binders subsections (corrected from Smart-Binders)
                        const perfectBindersSection = departmentMapping.find(dept => dept.text === "Perfect Binders");
                        if (perfectBindersSection && perfectBindersSection.subsections) {
                            perfectBindersSection.subsections.forEach(subsection => {
                                mainProcesses.push({
                                    displayText: subsection.text,
                                    value: subsection.values[0] // First value from the array
                                });
                            });
                        }
                        
                        // Create options
                        if (mainProcesses.length > 0) {
                            mainProcesses.forEach(process => {
                                // FIX: Compare the actual value, not the object
                                const selected = (row.Select_Main_Process === process.value) ? 'selected' : '';
                                options += `<option value="${process.value}" ${selected}>${process.displayText}</option>`;
                            });
                        }
                        
                        return `<select class="main-process-select form-control" 
                                  data-job="${row.JobNumber}" 
                                  data-component="${row.ComponentNumber}">
                                ${options}
                              </select>`;
                    }
                }, // 73
                {
                    data: 'Select_Department',
                    name: 'Select_Department', 
                    defaultContent: '',
                    render: function(data, type, row) {
                        if (type !== 'display') {
                            return data;
                        }
                        
                        let options = '<option value="">Select department</option>';
                        
                        // Get department options from departmentMapping
                        const departments = [];
                        
                        // Add Print subsections
                        const printSection = departmentMapping.find(dept => dept.text === "Print");
                        if (printSection && printSection.subsections) {
                            printSection.subsections.forEach(subsection => {
                                departments.push({
                                    displayText: subsection.text,
                                    value: subsection.values[0] // First value from the array
                                });
                            });
                        }
                        
                        // Create options
                        if (departments.length > 0) {
                            departments.forEach(dept => {
                                // FIX: Compare the actual value, not the object
                                const selected = (row.Select_Department === dept.value) ? 'selected' : '';
                                options += `<option value="${dept.value}" ${selected}>${dept.displayText}</option>`;
                            });
                        }
                        
                        return `<select class="department-select form-control" 
                                  data-job="${row.JobNumber}" 
                                  data-component="${row.ComponentNumber}">
                                ${options}
                              </select>`;
                    }
                } // 74
            ],
            initComplete: function() {
                // Set up search handler INSIDE initComplete
                $('#customSearch').on('keyup', function() {
                    table.search(this.value).draw();
                });
            },
            createdRow: function(row, data) {
                // Add data attributes for DOM selection
                $(row).attr('data-job', data.JobNumber)
                      .attr('data-component', data.ComponentNumber);

                // Initialize dropdown after row is created
                initializeDesignerDropdown(row, data);
            }
        });
        // end Initialize DataTable

        function addShipDateSeparators() {
            const table = $('#prodTable').DataTable();
            const rows = table.rows({ order: 'applied', search: 'applied' }).nodes();
            const data = table.rows({ order: 'applied', search: 'applied' }).data().toArray();
            
            // Remove existing separators and headers
            $('.ship-date-separator, .ship-date-header').remove();
            
            if (rows.length === 0) return;
            
            let lastShipDate = null;
            
            $(rows).each(function(index) {
                const currentShipDate = data[index].Projected_Ship_Date;
                
                if (currentShipDate !== lastShipDate) {
                    const colCount = table.columns().count();
                    
                    // Add ship date header
                    const header = $(`<tr class="ship-date-header">
                        <td colspan="${colCount}" style="background-color: #ebebe0; font-weight: bold; padding: 8px 12px; border-bottom: 2px solid #ccc;">
                            Ship Date: ${currentShipDate}
                        </td>
                    </tr>`);
                    $(this).before(header);
                    
                    // Add HR line separator after the group
                    if (lastShipDate !== null) {
                        const separator = $(`<tr class="ship-date-separator">
                            <td colspan="${colCount}" style="background-color: #ebebe0; padding: 5px 0;">
                                <hr style="margin: 0; border: none; border-top: 2px solid #666;">
                            </td>
                        </tr>`);
                        $(rows[index - 1]).after(separator);
                    }
                    
                    lastShipDate = currentShipDate;
                }
            });
            
            // Add final HR line after the last group
            if (data.length > 0) {
                const colCount = table.columns().count();
                const finalSeparator = $(`<tr class="ship-date-separator">
                    <td colspan="${colCount}" style="background-color: #ebebe0; padding: 5px 0;">
                        <hr style="margin: 0; border: none; border-top: 2px solid #666;">
                    </td>
                </tr>`);
                $(rows[data.length - 1]).after(finalSeparator);
            }
        }

        // Add event handlers for notes editing
        setupNotesEditing();

        // Move UI elements
        $('.buttons-container').append($('.dt-buttons'));
        $('.search-container').append($('.dataTables_filter'));
        $('.dataTables_filter input[type="search"]').focus();

        // Set up search handler with persistent functionality
        searchHandler = function() {
            table.search(this.value).draw();
        };

        setupSearchHandler();
        
        $('#customSearch').on('keyup', searchHandler);

        if (typeof callback === 'function') {
            callback();
        }

    }
    // end initializeDataTable()

    let designers = []; // Will store our designer list

    // Fetch designers when page loads
    function fetchDesigners() {
        socket.send(JSON.stringify({ type: 'getDesigners' }));
    }

    // Initialize dropdown for a specific row
    function initializeDesignerDropdown(row, rowData) {
        const select = $(row).find('.designer-select');
        const currentValue = rowData.Designer || '';
        
        select.empty();
        select.append($('<option>').val('').text('Select designer'));
        
        designers.forEach(designer => {
            const option = $('<option>')
                .val(designer.EmployeeName) // Using EmployeeName as value
                .text(designer.EmployeeName) // Using EmployeeName as display text
                .prop('selected', designer.EmployeeName === currentValue);
            select.append(option);
        });
    }

    // Start dropdown select
    // Event handler for main process changes
    $(document).on('change', '.main-process-select, .department-select', function() {
        const select = $(this);
        const job = select.data('job');
        const component = select.data('component');
        const value = select.val();
        const field = select.hasClass('main-process-select') ? 'Select_Main_Process' : 'Select_Department';
        
        // Debug alert
        //alert(`Change detected:\nJob: ${job}\nComponent: ${component}\nField: ${field}\nValue: ${value}`);
        
        // Use UPSERT approach
        $.post('handle_component_upsert.php', {
            job: job,
            component: component,
            field: field,
            value: value
        }).done(function(response) {
            //alert(`UPSERT response: ${JSON.stringify(response)}`);
            if (response.success) {
                console.log(`${field} ${response.action}`);
                showSaveStatus(select.closest('.notes-container').find('.save-status'), true);
            } else {
                showSaveStatus(select.closest('.notes-container').find('.save-status'), false);
            }
        }).fail(function(xhr, status, error) {
            //alert(`UPSERT failed: ${error}`);
            showSaveStatus(select.closest('.notes-container').find('.save-status'), false);
        });
    });

    // Handle ShipsWith input changes and save button clicks
    $(document).on('click', '.btn-save-ships-with', function() {
        const button = $(this);
        const container = button.closest('.ships-with-container');
        const textarea = container.find('.ships-with-input');
        const status = container.find('.save-status');
        
        const job = textarea.data('job');
        const component = textarea.data('component');
        const value = textarea.val().trim();
        const field = textarea.data('field');
        
        // Use UPSERT approach
        $.post('handle_upsert_master_ship.php', {
            job: job,
            component: component,
            field: field,
            value: value
        }).done(function(response) {
            if (response.success) {
                console.log(`${field} ${response.action}`);
                showSaveStatus(status, true);
            } else {
                showSaveStatus(status, false, response.error || 'Save failed');
            }
        }).fail(function(xhr, status, error) {
            console.error('UPSERT failed:', error);
            showSaveStatus(status, false, 'Save failed');
        });
    });

    // Add auto-resize functionality
    $(document).on('input', '.ships-with-input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    // Helper function to show save status
    function showSaveStatus(element, success) {
        const status = $(element);
        if (success) {
            status.html('<i class="fa fa-check text-success"></i> Saved');
            status.fadeIn();
            setTimeout(function() {
                status.fadeOut();
            }, 2000);
        } else {
            status.html('<i class="fa fa-times text-danger"></i> Error');
            status.fadeIn();
        }
    }
    // End dropdown select

    // Handle designer change
    $(document).on('change', '.designer-select', function() {
        const jobNumber = $(this).data('job');
        const componentNumber = $(this).data('component');
        const designerCode = $(this).val();

         // Update the data in the table immediately
        const row = table.row($(this).closest('tr'));
        const rowData = row.data();
        if (rowData) {
            rowData.Designer = designerCode;
            row.data(rowData).invalidate();
        }
        
        socket.send(JSON.stringify({
            type: 'updateDesigner',
            jobNumber,
            componentNumber,
            designerCode
        }));
            // Reapply filters to update coloring
        const currentDept = $('#deptFilter').val();
        if (currentDept) {
            // Use setTimeout to ensure DOM updates complete
            setTimeout(() => {
                applyRowFilter(currentDept);
            }, 50);
        }
        socket.send(JSON.stringify({ type: 'dataUpdate' }));
    });

    function setupNotesEditing() {
        // Save button handler
        $('#prodTable').on('click', '.btn-save-notes', function() {
            const container = $(this).closest('.notes-container');
            const textarea = container.find('.notes-input');
            const status = container.find('.save-status');
            const saveBtn = $(this);
            
            const jobNumber = textarea.data('job');
            const componentNumber = textarea.data('component');
            const field = textarea.data('field');
            const newValue = textarea.val().trim();

            // Client-side validation
            if (!jobNumber || isNaN(componentNumber)) {
                alert('Invalid job data');
                return;
            }

            // Show saving state
            saveBtn.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Saving');
            status.hide();

            // Send update via WebSocket
            socket.send(JSON.stringify({
                type: 'updateNotes',
                jobNumber: jobNumber.toString(),
                componentNumber: parseInt(componentNumber),
                prepressNotes: field === 'PrepressNotes' ? newValue : null,
                postpressNotes: field === 'PostPressNotes' ? newValue : null,
                priority: null
            }));
        });
    }

    // open hidden row to show detailed data for accumulated production
    // save the clicked row information so, it opens back up on periodic refresh
    function setupTableEventHandlers() {
        // Remove any existing handlers to prevent duplicates
        $('#prodTable tbody').off('click', 'tr');
        
        // Add new handler
        $('#prodTable tbody').on('click', 'tr', function(event) {
            // Ignore clicks on form elements and buttons
            if ($(event.target).is('input, textarea, button, a, select')) {
                return;
            }

            const clickedRow = table.row(this);
            const data = clickedRow.data();
            
            if (!data || !data.JobNumber || !data.ComponentNumber) {
                return;
            }

            const jobNumber = data.JobNumber;
            const componentNumber = data.ComponentNumber;
            let openRows = JSON.parse(sessionStorage.getItem('openRows')) || [];

            if (clickedRow.child.isShown()) {
                // Close the row
                openRows = openRows.filter(row => 
                    !(row.jobNumber === jobNumber && row.componentNumber === componentNumber));
                clickedRow.child.hide();
                $(this).removeClass('shown');
            } else {
                // Open the row
                openRows.push({ jobNumber, componentNumber });
                socket.send(JSON.stringify({ 
                    type: 'getDetailedData', 
                    jobNumber, 
                    componentNumber 
                }));
                $(this).addClass('shown');
            }

            sessionStorage.setItem('openRows', JSON.stringify(openRows));
        });

        // scroll to top on page selection.
        $('#prodTable').on('page.dt', function () {
            setTimeout(() => {
                const $table = $(this);
                const scrollPos = $table.closest('.dataTables_wrapper').offset()?.top || 
                                  $table.offset()?.top || 
                                  0;

                // Adjust upward a bit for margin/padding/header
                const offsetAdjustment = 121;

                window.scrollTo({
                    top: scrollPos - offsetAdjustment,
                    behavior: 'smooth'
                });
            }, 50);
        });

        // Apply highlighting immediately
        applyPriorityHighlighting();
        
        // Reapply on these events:
        table.on('draw.dt', applyPriorityHighlighting);
        table.on('search.dt', applyPriorityHighlighting);
        table.on('page.dt', applyPriorityHighlighting);

    }

    $('#prodTable').on('keydown', '.notes-input', function(e) {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            $(this).closest('.notes-container').find('.btn-save-notes').click();
        }
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            $(this).closest('.notes-container').find('.btn-save-notes').click();
        }
    });

    let originalValues = {};

    $('#prodTable').on('focus', '.notes-input', function() {
        const key = $(this).data('job') + '-' + $(this).data('component') + '-' + $(this).data('field');
        originalValues[key] = $(this).val();
    }).on('change', '.notes-input', function() {
        const key = $(this).data('job') + '-' + $(this).data('component') + '-' + $(this).data('field');
        const saveBtn = $(this).closest('.notes-container').find('.btn-save-notes');
        saveBtn.prop('disabled', $(this).val() === originalValues[key]);
    });

    // Set up department dropdown
    function setupDepartmentDropdown() {
        const deptFilter = $('#deptFilter').empty().append('<option value="">All</option>');

        departmentMapping.forEach(dept => {
            deptFilter.append(`<option value="${dept.values.join(',')}">${dept.text}</option>`);
            
            if (dept.subsections) {
                const optgroup = $('<optgroup>').attr('label', `${dept.text} Subsections`);
                dept.subsections.forEach(sub => {
                    optgroup.append(`<option value="${sub.values.join(',')}">${sub.text}</option>`);
                });
                deptFilter.append(optgroup);
            }
        });

        // Load saved filter
        const savedDeptFilter = localStorage.getItem('deptFilter');
        if (savedDeptFilter) {
            deptFilter.val(savedDeptFilter);
        }

        let filterTimeout;
        $('#deptFilter').on('change', function() {
            clearTimeout(filterTimeout);
            filterTimeout = setTimeout(() => {
                localStorage.setItem('deptFilter', $(this).val());

                applyDepartmentFilter();

                // Scroll to top of the page
                window.scrollTo({ top: 0, behavior: 'smooth' });

            }, 300); // 300ms delay
        });
    }

    function findTableRow(jobNumber, componentNumber) {
        // First try DataTables API (most reliable)
        const rows = table.rows((idx, data) => 
            data.JobNumber == jobNumber && 
            data.ComponentNumber == componentNumber
        );
        
        if (rows.any()) {
            return {
                api: rows,
                node: rows.nodes().to$(),
                data: rows.data()
            };
        }
        
        // Fallback to DOM attributes if needed
        const domRow = $(`#prodTable tr[data-job="${jobNumber}"][data-component="${componentNumber}"]`);
        if (domRow.length) {
            return {
                api: table.row(domRow),
                node: domRow,
                data: table.row(domRow).data()
            };
        }
        
        return null;
    }

    // Configure search box behavior
    function setupSearchBehavior() {
        $('#prodTable_filter input').off('keyup').on('keyup', function() {
            const searchValue = this.value;
            
            if (searchValue === '') {
                // When search is cleared, reapply department filter
                applyDepartmentFilter();
            } else {
                // Search only in visible columns
                const visibleColumns = [];
                table.columns().every(function() {
                    if (this.visible()) {
                        visibleColumns.push(this.index());
                    }
                });
                
                // Clear previous column searches
                table.columns().search('');
                
                // Apply search to visible columns only
                table.search(searchValue).draw();
            }
        });
    }

    // Modified search handler to be more robust
    function setupSearchHandler() {
        const searchInput = $('#customSearch');
        
        // Clear previous handlers
        searchInput.off('input keyup search change');
        
        // Handle all input changes (including clear button)
        searchInput.on('input', function() {
            executeSearch(this.value);
        });
        
        // Also handle keyup for Enter key functionality
        searchInput.on('keyup', function(e) {
            if (e.key === 'Enter') {
                executeSearch(this.value);
            }
        });
        
        // Handle programmatic changes
        searchInput.on('search', function() {
            if (this.value === '') {
                executeSearch('');
            }
        });
    }

    // Modified executeSearch to work with the department filter
    function executeSearch(searchTerm) {
        const table = $('#prodTable').DataTable();
        
        // Clear previous NOT search if exists
        if (currentNotSearch) {
            $.fn.dataTable.ext.search = $.fn.dataTable.ext.search.filter(
                fn => fn !== currentNotSearch
            );
            currentNotSearch = null;
        }
        
        if (searchTerm.startsWith('!')) {
            const excludeTerm = searchTerm.substring(1).trim();
            
            const notSearchFunction = function(settings, data, dataIndex) {
                // First apply department filter if it exists
                if (currentDeptFilter && !currentDeptFilter(settings, data, dataIndex)) {
                    return false;
                }
                
                const rowData = table.row(dataIndex).data();
                let found = false;
                
                for (let i = 0; i < data.length; i++) {
                    if (data[i] && data[i].toString().toLowerCase().includes(excludeTerm.toLowerCase())) {
                        found = true;
                        break;
                    }
                }
                
                return !found;
            };
            
            currentNotSearch = notSearchFunction;
            $.fn.dataTable.ext.search.push(notSearchFunction);
            table.draw();
        } 
        else {
            // Use DataTables built-in search but maintain department filter
            table.search(searchTerm).draw();
        }
    }

    function applyDataUpdates(changes) {
        console.log("Received changes with positions:");
        changes.forEach(change => {
            if (change.type === 'update') {
                console.log(`- ${change.key}:`, {
                    position: change.position,
                    newShipDate: change.fields.Projected_Ship_Date,
                    newData: change.newData
                });
            }
        });

        try {
            // === REMOVALS ===
                const removals = changes.filter(c => c.type === 'remove');

                if (removals.length > 0) {
                    console.group('--- REMOVAL PROCESSING ---');
                    console.log('Total removals:', removals.length);
                    
                    // 1. Collect all rows to be removed
                    const rowsToRemove = [];
                    const keysToRemove = new Set();
                    
                    removals.forEach(change => {
                        const [jobNumber, componentNumber] = change.key.split('-');
                        keysToRemove.add(change.key);
                        
                        table.rows((idx, data) => 
                            data.JobNumber == jobNumber && 
                            data.ComponentNumber == componentNumber
                        ).every(function() {
                            rowsToRemove.push(this);
                            return true;
                        });
                    });
                    
                    // 2. Clean up child rows and state
                    console.group('Cleaning up child rows');
                    rowsToRemove.forEach(row => {
                        const rowNode = $(row.node());
                        
                        // Handle child rows
                        if (row.child) {
                            console.log(`Processing child rows for ${row.data().JobNumber}-${row.data().ComponentNumber}`);
                            
                            // Hide if shown
                            if (row.child.isShown && row.child.isShown()) {
                                console.log('- Hiding child row');
                                row.child.hide();
                            }
                            
                            // Remove any lingering DOM elements
                            const childRow = rowNode.next('tr.child');
                            if (childRow.length) {
                                console.log('- Removing child row DOM element');
                                childRow.remove();
                            }
                            
                            // Clear DataTables' internal tracking
                            if (row.child.remove) {
                                console.log('- Clearing internal child reference');
                                row.child.remove();
                            }
                        }
                        
                        // Clean up classes
                        rowNode.removeClass('shown dt-hasChild');
                    });
                    console.groupEnd();
                    
                    // 3. Update sessionStorage
                    console.group('Updating sessionStorage');
                    let openRows = JSON.parse(sessionStorage.getItem('openRows')) || [];
                    const beforeCount = openRows.length;
                    openRows = openRows.filter(row => 
                        !keysToRemove.has(`${row.jobNumber}-${row.componentNumber}`)
                    );
                    sessionStorage.setItem('openRows', JSON.stringify(openRows));
                    console.log(`Removed ${beforeCount - openRows.length} entries from sessionStorage`);
                    console.groupEnd();
                    
                    // 4. Animate and remove rows
                    console.group('Animating and removing rows');
                    rowsToRemove.forEach(row => {
                        const rowNode = $(row.node());
                        const rowData = row.data();
                        
                        console.log(`Animating removal for ${rowData.JobNumber}-${rowData.ComponentNumber}`);
                        rowNode.addClass('fade-out');
                        
                        // Optional: Add event listener for animation end
                        rowNode.on('animationend', function() {
                            console.log(`Animation complete for ${rowData.JobNumber}-${rowData.ComponentNumber}`);
                            $(this).off('animationend'); // Clean up event listener
                        });
                    });
                    
                    // 5. Remove rows after animation completes
                    setTimeout(() => {
                        console.group('Performing final removal');
                        const indexes = rowsToRemove.map(r => r.index());
                        console.log('Removing rows at indexes:', indexes);
                        
                        table.rows(indexes).remove().draw(false);
                        
                        // Clean up any orphaned child rows
                        $('tr.child').each(function() {
                            if (!$(this).prev('tr').hasClass('parent')) {
                                console.log('Removing orphaned child row:', this);
                                $(this).remove();
                            }
                        });
                        
                        console.log(`Removed ${indexes.length} rows successfully`);
                        console.groupEnd();
                    }, 500); // Match this to your CSS animation duration
                    
                    console.groupEnd(); // Animating and removing rows
                    console.groupEnd(); // REMOVAL PROCESSING
                }

            // === COMBINED INSERT + UPDATE REORDERING ===
            const inserts = changes.filter(c => c.type === 'new');
            const updates = changes.filter(c => c.type === 'update');

            if (inserts.length > 0 || updates.length > 0) {
                console.group('--- INSERT/UPDATE WITH SORTING ---');

                const selectedText = $('#deptFilter option:selected').text();
                const isPrePress = selectedText === 'PrePress' || 
                                  selectedText === 'Needs Proof' || 
                                  selectedText === 'Proof Out' || 
                                  selectedText === 'Imposition';

                // Only preserve colors if we're not in PrePress mode
                const classPreservation = new Map();
                if (!isPrePress) {
                    table.rows().every(function() {
                        const rowData = this.data();
                        const key = `${rowData.JobNumber}-${rowData.ComponentNumber}`;
                        const rowNode = $(this.node());
                        
                        // Store all color classes
                        const currentClasses = rowNode.attr('class') || '';
                        const colorClasses = currentClasses.split(' ').filter(cls => 
                            cls.includes(colorSessionId)
                        );
                        
                        if (colorClasses.length) {
                            classPreservation.set(key, colorClasses);
                        }
                    });
                }

                // Get current rows and create a mapping
                const currentRows = table.rows().data().toArray();
                const rowMap = new Map(currentRows.map(r => [`${r.JobNumber}-${r.ComponentNumber}`, r]));

                // Apply updates in-place
                updates.forEach(change => {
                    const key = change.key;
                    if (rowMap.has(key)) {
                        const updated = { ...rowMap.get(key), ...change.fields };
                        rowMap.set(key, updated);
                    }
                });

                // Add inserts to map
                inserts.forEach(change => {
                    const key = `${change.data.JobNumber}-${change.data.ComponentNumber}`;
                    const rowData = transformDataForTable(change.data);
                    rowMap.set(key, rowData);
                });

                // Re-sort all rows by Projected_Ship_Date, JobNumber, then ComponentNumber
                const sortedRows = Array.from(rowMap.values()).sort((a, b) => {
                    const d1 = new Date(a.Projected_Ship_Date || '9999-12-31');
                    const d2 = new Date(b.Projected_Ship_Date || '9999-12-31');
                    if (d1 - d2 !== 0) return d1 - d2;

                    const j1 = a.JobNumber?.toString().padStart(10, '0') || '';
                    const j2 = b.JobNumber?.toString().padStart(10, '0') || '';
                    if (j1 !== j2) return j1.localeCompare(j2);

                    const c1 = a.ComponentNumber?.toString().padStart(10, '0') || '';
                    const c2 = b.ComponentNumber?.toString().padStart(10, '0') || '';
                    return c1.localeCompare(c2);
                });

                // Replace table contents
                    table.clear();
                    table.rows.add(sortedRows).draw(false);

                    // Handle color restoration or reapplication
                    setTimeout(() => {
                        if (isPrePress) {
                            // Reapply PrePress coloring using our shared function
                            table.rows().every(function() {
                                applyPrePressHighlighting($(this.node()), this.data());
                            });
                        } else {
                            // Restore preserved colors for non-PrePress
                            table.rows().every(function() {
                                const rowData = this.data();
                                const key = `${rowData.JobNumber}-${rowData.ComponentNumber}`;
                                const preservedClasses = classPreservation.get(key);
                                
                                if (preservedClasses) {
                                    const rowNode = $(this.node());
                                    // Remove any existing color classes
                                    const currentClasses = (rowNode.attr('class') || '').split(' ');
                                    const cleanClasses = currentClasses
                                        .filter(cls => !cls.includes(colorSessionId))
                                        .join(' ');
                                    
                                    // Add back the preserved classes
                                    rowNode.attr('class', `${cleanClasses} ${preservedClasses.join(' ')}`.trim());
                                }
                            });

                        }

                        // Animate affected rows
                        const keysToAnimate = new Set([
                            ...updates.map(u => u.key),
                            ...inserts.map(i => `${i.data.JobNumber}-${i.data.ComponentNumber}`)
                        ]);
                        
                        table.rows().every(function() {
                            const data = this.data();
                            const key = `${data.JobNumber}-${data.ComponentNumber}`;
                            if (keysToAnimate.has(key)) {
                                const node = $(this.node());
                                node.addClass('pulse');
                                setTimeout(() => node.removeClass('pulse'), 2000);
                            }
                        });
                    }, 50);

                    console.groupEnd();
                }
        } catch (error) {
            console.error("Error applying updates:", error);
        }
    }

    function applyDepartmentFilter() {
        const table = $('#prodTable').DataTable();
        
        if (!table || !$.fn.DataTable.isDataTable('#prodTable')) {
            console.error('DataTable not properly initialized');
            return false;
        }

        try {
            // Store state
            const deptValue = $('#deptFilter').val();
            const deptText = $('#deptFilter').find('option:selected').text().trim();

            // Clear ALL highlight classes before applying new ones
            removeAllHighlightClasses();

            // Clear existing filters safely
            if (currentDeptFilter) {
                $.fn.dataTable.ext.search = $.fn.dataTable.ext.search.filter(
                    fn => fn !== currentDeptFilter
                );
                currentDeptFilter = null;
            }

            // Clear NOT search if it exists
            if (currentNotSearch) {
                $.fn.dataTable.ext.search = $.fn.dataTable.ext.search.filter(
                    fn => fn !== currentNotSearch
                );
                currentNotSearch = null;
            }

            // ALWAYS apply row filtering (using your existing applyRowFilter function)
            if (deptValue) {
                applyRowFilter(deptValue);
                // Store the reference to the current filter
                currentDeptFilter = $.fn.dataTable.ext.search[$.fn.dataTable.ext.search.length - 1];
            } else {
                $.fn.dataTable.ext.search = [];
            }

            // Apply column visibility rules
            if (columnVisibilityRules[deptText]) {
                applyColumnVisibility(deptText);
            } else {
                table.columns().visible(true);
                table.colReorder.reset();
            }

            // Re-apply current search if one exists
            const searchTerm = $('#customSearch').val();
            if (searchTerm) {
                executeSearch(searchTerm);
            } else {
                table.draw();
            }

        } catch (e) {
            console.error('Filter error:', e);
            // Emergency reset
            table.columns().visible(true);
            $.fn.dataTable.ext.search = [];
            table.colReorder.reset();
            table.draw();
            return false;
        }
    }

    function removeAllHighlightClasses() {
        table.$('tr').removeClass(function(index, className) {
            const highlights = [];
            const regex = new RegExp(`(^|\\s)${colorSessionId}-\\S+`, 'g');
            let match;
            while ((match = regex.exec(className)) !== null) {
                highlights.push(match[0]);
            }
            return highlights.join(' ');
        });
    }

function applyPriorityHighlighting() {
    // Get current filter state
    const selectedText = $('#deptFilter option:selected').text();
    const isPrePress = selectedText === 'PrePress' ||
                      selectedText === 'Needs Proof' ||
                      selectedText === 'Proof Out' ||
                      selectedText === 'Imposition';

    // Process all visible rows at once
    const rows = table.rows({ search: 'applied', page: 'current' }).nodes();
    
    $(rows).each(function() {
        const rowNode = this;
        const rowData = table.row(rowNode).data();
        if (!rowData) return;

        const firstCell = $(rowNode).find('td:first');
        
        // Clear existing classes
        $(rowNode).removeClass(`${colorSessionId}-priority-single ${colorSessionId}-priority-double`);
        firstCell.removeClass(`${colorSessionId}-priority-single-cell ${colorSessionId}-priority-double-cell`);

        // Apply priority highlighting
        const jobPriority = rowData.JobPriority?.toString()?.trim() || '';
        if (jobPriority === '*') {
            if (isPrePress) {
                firstCell.addClass(`${colorSessionId}-priority-single-cell`);
            } else {
                $(rowNode).addClass(`${colorSessionId}-priority-single`);
            }
        } else if (jobPriority === '**') {
            if (isPrePress) {
                firstCell.addClass(`${colorSessionId}-priority-double-cell`);
            } else {
                $(rowNode).addClass(`${colorSessionId}-priority-double`);
            }
        }
        
        // Apply PrePress highlighting if needed
        if (isPrePress) {
            applyPrePressHighlighting(rowNode, rowData);
        }
    });
}


function applyRowFilter(deptValue) {
    const selectedText = $('#deptFilter option:selected').text();
    const isPrePress = selectedText === 'PrePress' ||
                      selectedText === 'Needs Proof' ||
                      selectedText === 'Proof Out' ||
                      selectedText === 'Imposition';

    const values = deptValue.split(',');
    
    // Get columns to check based on department mapping
    const columnsToCheck = departmentColumnMapping[selectedText] || ['Next_Comp_Process'];

    // Clear existing filter
    if (currentDeptFilter) {
        $.fn.dataTable.ext.search = $.fn.dataTable.ext.search.filter(
            fn => fn !== currentDeptFilter
        );
    }

    currentDeptFilter = function(settings, data, dataIndex) {
        const rowData = table.row(dataIndex).data();
        if (!rowData) return false;

        let matchFound = false;
        for (const colName of columnsToCheck) {
            const cellValue = rowData[colName];
            if (cellValue && values.includes(cellValue.toString())) {
                matchFound = true;
                const rowNode = table.row(dataIndex).node();
                
                // Always apply priority highlighting first
                applyPriorityHighlighting(rowNode, rowData, isPrePress);
                
                if (isPrePress) {
                    applyPrePressHighlighting(rowNode, rowData);
                } else {
                    // Other departments - process-based coloring
                    const processClass = `${colorSessionId}-match-col-${colName.replace(/_/g, '-')}`;
                    $(rowNode).addClass(processClass);
                }
                break;
            }
        }
        return matchFound;
    };

    // Apply the new filter and highlighting
    $.fn.dataTable.ext.search.push(currentDeptFilter);
    table.draw();
    
    // Apply highlighting to all visible rows (including non-filtered in current page)
    table.rows({ page: 'current' }).every(function() {
        const rowData = this.data();
        const rowNode = this.node();
        if (rowData && rowNode) {
            applyPriorityHighlighting(rowNode, rowData, isPrePress);
            if (isPrePress) {
                applyPrePressHighlighting(rowNode, rowData);
            }
        }
    });
}

// Keep this as is for PrePress highlighting
function applyPrePressHighlighting(rowNode, rowData) {
    $(rowNode).removeClass(function(index, className) {
        return (className.match(new RegExp(`(^|\\s)${colorSessionId}-designer-\\S+`, 'g')) || []).join(' ');
    });

    if (rowData.Designer) {
        const designerExists = designers.some(d => d.EmployeeName === rowData.Designer);
        const safeName = rowData.Designer.replace(/\s+/g, '-');
        $(rowNode).addClass(designerExists 
            ? `${colorSessionId}-designer-${safeName}`
            : `${colorSessionId}-designer-default`
        );
    //} else {
        //$(rowNode).addClass(`${colorSessionId}-designer-default`);
    }
}


    function applyColumnVisibility(deptText) {
        try {
            // Store current state
            const currentPage = table.page();
            const scrollTop = $(window).scrollTop();
            const visibleColumns = columnVisibilityRules[deptText];

            // Disable drawing during updates
            const settings = table.settings()[0];
            const oldAutoWidth = settings.oFeatures.bAutoWidth;
            settings.oFeatures.bAutoWidth = false;

            // Case 1: Department has specific column rules
            if (visibleColumns) {
                // Hide all columns first
                table.columns().visible(false);
                
                // Show and order specified columns
                visibleColumns.forEach(colName => {
                    const col = table.column(`${colName}:name`);
                    if (col) {
                        col.visible(true);
                        // Move to desired position
                        table.colReorder.move(col.index(), visibleColumns.indexOf(colName));
                    }
                });
            } 
            // Case 2: No specific rules - show all columns in original order
            else {
                // First hide all columns
                table.columns().visible(false);
                
                // Then show all columns in their original order
                table.columns().every(function(index) {
                    this.visible(true);
                    // Move each column back to its original position
                    table.colReorder.move(this.index(), index);
                });
            }

            // Restore settings and redraw
            settings.oFeatures.bAutoWidth = oldAutoWidth;
            table.draw(false);
            table.page(currentPage).draw(false);
            $(window).scrollTop(scrollTop);

        } catch (e) {
            console.error('Column visibility error:', e);
            // Emergency reset - show all columns in original order
            table.columns().visible(true);
            table.columns().every(function(index) {
                table.colReorder.move(this.index(), index);
            });
            table.draw();
        }
    }

    // Initialize WebSocket
    function initializeWebSocket() {
        //socket = new WebSocket('wss://lamp.walsworth.com:8080');
        socket = new WebSocket('wss://ampd.walsworth.com:8080');
        //socket = new WebSocket('wss://localhost:8080');
        let reconnectTimeout;
        let pingInterval;
        let clickedRow = null;

        // Connection health monitoring
        function setupHeartbeat() {
            clearInterval(pingInterval);
            pingInterval = setInterval(() => {
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: 'ping' }));
                }
            }, 30000); // Send ping every 30s
        }

        socket.onopen = function(event) {
            console.log("WebSocket is open now.");
            reconnectAttempts = 0; // Reset counter on successful connection
            isReconnecting = false;
            console.log("reconnectAttempts should be 0: " + reconnectAttempts);
            setupHeartbeat();
            updateConnectionStatus('connected');
            
            // Request initial data immediately after connection opens
            if (!initialDataRequested) {
                initialDataRequested = true;
                socket.send(JSON.stringify({ type: 'initialData' }));
            }
        };

        socket.onerror = function(error) {
            console.log("WebSocket error: " + error.message);
        };

        socket.onclose = function(event) {
            updateConnectionStatus('disconnected');
            console.log('WebSocket disconnected:', event.code, event.reason);

            if (event.code !== 1000 && !isReconnecting) { // Don't reconnect if closed normally
              attemptReconnect();
            }
        };

        socket.onmessage = function(event) {
            // Parse and validate the message
            let response;
            try {
                response = JSON.parse(event.data);
                console.log("Received message:", response);
                
                if (!response || typeof response !== 'object') {
                    console.error("Invalid message format:", response);
                    return;
                }
                
                if (!response.type) {
                    console.error("Received message without type:", response);
                    return;
                }
            } catch (error) {
                console.error("Failed to parse WebSocket message:", error);
                return;
            }

            console.log("Received message type:", response.type);

            // Process message based on type
            switch (response.type) {
                case 'pong':
                    // Ignore heartbeat responses
                    break;
                    
                case 'initialData':
                   // Always update data but only initialize once
                    if (!isTableInitialized) {
                        initializeAll(response.data);
                    } else {
                        // Just update existing table
                        handleDataUpdate(response.data);
                    }
                    break;
                    
                case 'dataUpdate':
                    console.log("dataUpdate?!");
                    handleDataUpdate(response.changes);
                    break;
                    
                case 'updateSuccess':
                    handleUpdateSuccess(response.jobNumber, response.componentNumber);
                    break;
                    
                case 'updateFailed':
                    handleUpdateFailed();
                    break;
                    
                case 'detailedData':
                    handleDetailedData(response);
                    break;
                    
                case 'designers':
                    handleDesignersUpdate(response.data);
                    break;
                    
                case 'designerUpdated':
                    handleDesignerUpdated(response);
                    break;
                    
                default:
                    console.error("Unknown message type:", response.type);
            }
        };

        function handleDataUpdate(changes) {
            if (!changes) {
                console.error("No changes provided");
                return;
            }
            
            if (!Array.isArray(changes)) {
                console.error("Changes should be an array, received:", typeof changes);
                return;
            }
            console.log("Processing dataUpdate with", changes.length, "changes");
            applyDataUpdates(changes);
            // Safely handle sessionStorage data
            let openRows = [];
            try {
                const storedRows = sessionStorage.getItem('openRows');
                openRows = storedRows ? JSON.parse(storedRows) : [];
            } catch (storageError) {
                console.error("Error reading openRows from sessionStorage:", storageError);
                // Reset to empty array if corrupted
                sessionStorage.setItem('openRows', JSON.stringify([]));
            }
            
            restoreOpenRows(openRows);
        }

        function handleUpdateSuccess(jobNumber, componentNumber) {
            const row = table.row(`[data-job="${jobNumber}"][data-component="${componentNumber}"]`).node();
            if (row) {
                const container = $(row).find('.notes-container');
                container.find('.btn-save-notes')
                    .prop('disabled', false)
                    .html('<i class="fa fa-save"></i> Save');
                
                container.find('.save-status')
                    .text('Saved!')
                    .fadeIn()
                    .delay(2000)
                    .fadeOut();
            }
        }

        function handleUpdateFailed() {
            $('.btn-save-notes').each(function() {
                $(this).prop('disabled', false).html('<i class="fa fa-save"></i> Save');
                $(this).closest('.notes-container').find('.save-status')
                    .text('Save failed!')
                    .css('color', 'red')
                    .fadeIn()
                    .delay(2000)
                    .fadeOut();
            });
        }

        function handleDetailedData(response) {
            const jobNumber = response.jobNumber || (response.data && response.data[0] && response.data[0].JobNumber);
            const componentNumber = response.componentNumber || (response.data && response.data[0] && response.data[0].ComponentNumber);
            
            if (!jobNumber || !componentNumber) {
                console.error("Missing identifiers in detailedData response");
                return;
            }

            table.rows().every(function() {
                const rowData = this.data();
                if (rowData && rowData.JobNumber == jobNumber && rowData.ComponentNumber == componentNumber) {
                    const template = document.getElementById('detailed-table-template');
                    const tableFragment = template.content.cloneNode(true);
                    const tbody = tableFragment.querySelector('tbody');

                    if (response.data && response.data.length > 0) {
                        response.data.forEach((detail) => {
                            const row = document.createElement('tr');
                            [
                                detail.JobNumber, 
                                detail.ComponentNumber, 
                                detail.ProcessCode, 
                                detail.Description, 
                                detail.CompletionCode, 
                                detail.CreateDatim, 
                                detail.EmployeeName, 
                                detail.Comments
                            ].forEach((cellData) => {
                                const td = document.createElement('td');
                                td.textContent = cellData !== null ? cellData : '';
                                row.appendChild(td);
                            });
                            tbody.appendChild(row);
                        });
                    } else {
                        const emptyRow = document.createElement('tr');
                        const emptyCell = document.createElement('td');
                        emptyCell.colSpan = 8;
                        emptyCell.textContent = 'No data available';
                        emptyCell.style.textAlign = 'center';
                        emptyCell.style.padding = '20px';
                        emptyCell.style.fontStyle = 'italic';
                        emptyCell.style.color = '#999';
                        emptyRow.appendChild(emptyCell);
                        tbody.appendChild(emptyRow);
                    }

                    this.child(tableFragment).show();
                    $(this.node()).addClass('shown');
                }
            });
        }

        function handleDesignersUpdate(designersData) {
            designers = designersData;
            table.rows().every(function() {
                initializeDesignerDropdown(this.node(), this.data());
            });
        }

        function handleDesignerUpdated(response) {
            if (response.success) {
                table.rows().every(function() {
                    const data = this.data();
                    if (data.JobNumber === response.jobNumber && 
                        data.ComponentNumber === response.componentNumber) {
                        data.Designer = response.designerName;
                        this.invalidate();
                    }
                });
            }
        }
        // end socket.onmessage = function(event)
    }
    // end initializeWebSocket()

    // Helper function to transform incoming data to match table structure
    function transformDataForTable(sourceData) {
        return {
                JobNumber: sourceData.JobNumber,
                ComponentNumber: sourceData.ComponentNumber,
                JobStatus: sourceData.JobStatus,
                Status: sourceData.Status,
                JobPriority: sourceData.JobPriority,
                Job_In_Date: sourceData.Job_In_Date,
                Proof_Due_Date: sourceData.Proof_Due_Date,
                Projected_Ship_Date: sourceData.Projected_Ship_Date,
                Carrier: sourceData.Carrier,
                ShipType: sourceData.ShipType,
                Job_Creator: sourceData.Job_Creator,
                Customer_CSR: sourceData.Customer_CSR,
                Customer: sourceData.Customer,
                CustName: sourceData.CustName,
                JobDescription: sourceData.JobDescription,
                Comp1_Pages: sourceData.Comp1_Pages,
                Comp2_Pages: sourceData.Comp2_Pages,
                Quantity: sourceData.Quantity,
                Size: sourceData.Size,
                CoverCoating: sourceData.CoverCoating,
                Last_Cover_Process: sourceData.Last_Cover_Process,
                Last_Cover_Description: sourceData.Last_Cover_Description,
                Last_Body_Process: sourceData.Last_Body_Process,
                Last_Body_Description: sourceData.Last_Body_Description,
                CoverPrintedAt: sourceData.CoverPrintedAt,
                Material_WIP_Cost: sourceData.Material_WIP_Cost,
                Production_WIP_Cost: sourceData.Production_WIP_Cost,
                PONumber: sourceData.PONumber,
                OrderSellPrice: sourceData.OrderSellPrice,
                Next_Cover_Process: sourceData.Next_Cover_Process,
                Next_Cover_Description: sourceData.Next_Cover_Description,
                NCP_Time: sourceData.NCP_Time,
                Next_Body_Process: sourceData.Next_Body_Process,
                Next_Body_Description: sourceData.Next_Body_Description,
                NBP_Time: sourceData.NBP_Time,
                Main_Process: sourceData.Main_Process,
                MP_Description: sourceData.MP_Description,
                MP_Time: sourceData.MP_Time,
                Does_it_blend: sourceData.Does_it_blend,
                Did_it_blend: sourceData.Did_it_blend,
                Is_It_Wednesday: sourceData.Is_It_Wednesday,
                Mat_Code: sourceData.Mat_Code,
                Mat_Qty: sourceData.Mat_Qty,
                Mat_BWT: sourceData.Mat_BWT,
                Mat_Description: sourceData.Mat_Description,
                Parent_Sheet_Size: sourceData.Parent_Sheet_Size,
                Parent_Out: sourceData.Parent_Out,
                Press_Size: sourceData.Press_Size,
                Press_Out: sourceData.Press_Out,
                Print_Type: sourceData.Print_Type,
                Print_Time: sourceData.Print_Time,
                Last_Comp3_Description: sourceData.Last_Comp3_Description,
                Last_Comp3_Process: sourceData.Print_Type,
                Next_Comp3_Description: sourceData.Next_Comp3_Description,
                Next_Comp3_Process: sourceData.Next_Comp3_Process,
                Next_Comp3_Time: sourceData.Next_Comp3_Time,
                PrepressNotes: sourceData.PrepressNotes,
                PostpressNotes: sourceData.PostpressNotes,
                Designer: sourceData.Designer,
                Last_Completed_Comp_Process: sourceData.Last_Completed_Comp_Process,
                Last_Completed_Comp_Description: sourceData.Last_Completed_Comp_Description,
                Next_Comp_Process: sourceData.Next_Comp_Process,
                Next_Comp_Description: sourceData.Next_Comp_Description,
                Next_Comp_Time: sourceData.Next_Comp_Time,
                Drill_Process: sourceData.Drill_Process,
                Drill_Description: sourceData.Drill_Description,
                Drill_Time: sourceData.Drill_Time,
                Hunkler_Process: sourceData.Hunkler_Process,
                Hunkler_Description: sourceData.Hunkler_Description,
                Hunkler_Time: sourceData.Hunkler_Time,
                Is_It_Capstone: sourceData.Is_It_Capstone,
                Master_Ship: sourceData.Master_Ship,
                Ships_With: sourceData.Ships_With,
                Select_Main_Process: sourceData.Select_Main_Process,
                Select_Department: sourceData.Select_Department,
            _rawData: sourceData // Store original data for details view
        };
    }

    // Function to reopen rows after the table refresh
    function restoreOpenRows(openRows) {
        // First close all existing rows
        table.rows().every(function() {
            if (this.child.isShown()) {
                this.child.hide();
                $(this.node()).removeClass('shown dt-hasChild');
            }
        });

        // Reopen saved rows with delay between each
        openRows.forEach((row, index) => {
            setTimeout(() => {
                socket.send(JSON.stringify({
                    type: 'getDetailedData',
                    jobNumber: row.jobNumber,
                    componentNumber: row.componentNumber
                }));
            }, index * 150); // Stagger requests
        });
    }

    // force recconection functions
    function attemptReconnect() {
        if (isReconnecting) return;
        
        if (reconnectAttempts < maxReconnectAttempts) {
            isReconnecting = true;
            updateConnectionStatus('reconnecting');
            
            // Exponential backoff with jitter
            const delay = Math.min(
                reconnectDelay * Math.pow(2, reconnectAttempts),
                30000 // max 30 seconds
            ) + Math.random() * 1000; // add some jitter
            
            console.log(`Attempting to reconnect in ${Math.round(delay/1000)} seconds... (Attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
            
            setTimeout(() => {
                reconnectAttempts++;
                isReconnecting = false;
                initializeWebSocket();
            }, delay);
        } else {
            console.log('Max reconnection attempts reached. Please refresh the page.');
            updateConnectionStatus('disconnected');
            // Optionally show a user notification
            toastr.error('Connection lost. Please refresh the page.', 'Disconnected', {
                timeOut: 0,
                extendedTimeOut: 0,
                preventDuplicates: true,
                closeButton: true
            });
        }
    }

    // Optional: Add visibility change detection to reconnect when tab becomes visible
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden') {
            isTableInitialized = false;
        }
        if (document.visibilityState === 'visible' && 
            (!socket || socket.readyState === WebSocket.CLOSED)) {

            console.log('Tab became visible - attempting to reconnect...');
            initializeWebSocket();
        }
    });

    // Optional: Periodically check connection status
    setInterval(() => {
        if (!socket || socket.readyState === WebSocket.CLOSED) {
            console.log('Connection check - attempting to reconnect...');
            initializeWebSocket();
        }
    }, 300000); // Check every 5 minutes
    // end force recconection functions

    // start connection indicator functions
    function updateConnectionStatus(status) {
        const dot = document.getElementById('connection-dot');
        
        // Remove all classes first
        dot.className = '';
        
        // Add the appropriate class
        switch(status) {
            case 'connected':
                dot.classList.add('connected');
                toastr.clear(); // clear existing error messages
                break;
            case 'disconnected':
                dot.classList.add('disconnected');
                break;
            case 'reconnecting':
                dot.classList.add('reconnecting');
                break;
            // No default needed - will just be uncolored
        }
    }

    // Initial state
    updateConnectionStatus('disconnected');
    // end connection indicator functions

    // Initialize everything
    initializeWebSocket();
});
// end $(document).ready(function()