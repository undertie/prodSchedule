$(document).ready(function() {
    // Global variables
    let table;
    let currentDeptFilter = null;
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
            text: "CSR", //Eventually Filter by CSR Name instead of Next_Process except for "Review" which would be for the daily review of the schedule
            values: [],
            subsections: [
                {
                    text: "Amber",
                    values: ["6610", "6611", "6612", "6613", "6625", "6615", "6616", "6620", "6621", "6505", "6506", "6510", "6151", "6126", "6305", "6306", "6325", "6540", "5900", "5901", "5906", "6800", "6832", "5951", "5952", "6525", "6425", "6427", "6404", "6405", "6411", "6421", "1000", "1055", "1060", "1062", "1064", "1066", "1160", "1165", "1305", "1310", "1445", "1460", "5301", "5302", "5303", "3000", "3010", "3011", "3012", "3019", "3020", "3022", "5100", "5110", "5120", "5500", "5515", "5525", "5545", "5555", "5565", "5800", "5801", "5803", "5804", "5805", "5806", "5807", "5808", "5809", "5802", "5851", "5852", "6251", "6252", "6705", "6710", "6715", "6719", "6720", "6723", "6729", "6728", "6730", "6731", "6700", "6702", "6725", "6451", "6453", "6452", "6460", "6461", "6385", "6390", "6395", "6415", "6416", "6417", "6450", "6455"]
                },
                {
                    text: "Brent",
                    values: ["6610", "6611", "6612", "6613", "6625", "6615", "6616", "6620", "6621", "6505", "6506", "6510", "6151", "6126", "6305", "6306", "6325", "6540", "5900", "5901", "5906", "6800", "6832", "5951", "5952", "6525", "6425", "6427", "6404", "6405", "6411", "6421", "1000", "1055", "1060", "1062", "1064", "1066", "1160", "1165", "1305", "1310", "1445", "1460", "5301", "5302", "5303", "3000", "3010", "3011", "3012", "3019", "3020", "3022", "5100", "5110", "5120", "5500", "5515", "5525", "5545", "5555", "5565", "5800", "5801", "5803", "5804", "5805", "5806", "5807", "5808", "5809", "5802", "5851", "5852", "6251", "6252", "6705", "6710", "6715", "6719", "6720", "6723", "6729", "6728", "6730", "6731", "6700", "6702", "6725", "6451", "6453", "6452", "6460", "6461", "6385", "6390", "6395", "6415", "6416", "6417", "6450", "6455"]
                },
                {
                    text: "Cathy",
                    values: ["6610", "6611", "6612", "6613", "6625", "6615", "6616", "6620", "6621", "6505", "6506", "6510", "6151", "6126", "6305", "6306", "6325", "6540", "5900", "5901", "5906", "6800", "6832", "5951", "5952", "6525", "6425", "6427", "6404", "6405", "6411", "6421", "1000", "1055", "1060", "1062", "1064", "1066", "1160", "1165", "1305", "1310", "1445", "1460", "5301", "5302", "5303", "3000", "3010", "3011", "3012", "3019", "3020", "3022", "5100", "5110", "5120", "5500", "5515", "5525", "5545", "5555", "5565", "5800", "5801", "5803", "5804", "5805", "5806", "5807", "5808", "5809", "5802", "5851", "5852", "6251", "6252", "6705", "6710", "6715", "6719", "6720", "6723", "6729", "6728", "6730", "6731", "6700", "6702", "6725", "6451", "6453", "6452", "6460", "6461", "6385", "6390", "6395", "6415", "6416", "6417", "6450", "6455"]
                },
                {
                    text: "Gabbi",
                    values: ["6610", "6611", "6612", "6613", "6625", "6615", "6616", "6620", "6621", "6505", "6506", "6510", "6151", "6126", "6305", "6306", "6325", "6540", "5900", "5901", "5906", "6800", "6832", "5951", "5952", "6525", "6425", "6427", "6404", "6405", "6411", "6421", "1000", "1055", "1060", "1062", "1064", "1066", "1160", "1165", "1305", "1310", "1445", "1460", "5301", "5302", "5303", "3000", "3010", "3011", "3012", "3019", "3020", "3022", "5100", "5110", "5120", "5500", "5515", "5525", "5545", "5555", "5565", "5800", "5801", "5803", "5804", "5805", "5806", "5807", "5808", "5809", "5802", "5851", "5852", "6251", "6252", "6705", "6710", "6715", "6719", "6720", "6723", "6729", "6728", "6730", "6731", "6700", "6702", "6725", "6451", "6453", "6452", "6460", "6461", "6385", "6390", "6395", "6415", "6416", "6417", "6450", "6455"]
                },
                {
                    text: "Lisa",
                    values: ["6610", "6611", "6612", "6613", "6625", "6615", "6616", "6620", "6621", "6505", "6506", "6510", "6151", "6126", "6305", "6306", "6325", "6540", "5900", "5901", "5906", "6800", "6832", "5951", "5952", "6525", "6425", "6427", "6404", "6405", "6411", "6421", "1000", "1055", "1060", "1062", "1064", "1066", "1160", "1165", "1305", "1310", "1445", "1460", "5301", "5302", "5303", "3000", "3010", "3011", "3012", "3019", "3020", "3022", "5100", "5110", "5120", "5500", "5515", "5525", "5545", "5555", "5565", "5800", "5801", "5803", "5804", "5805", "5806", "5807", "5808", "5809", "5802", "5851", "5852", "6251", "6252", "6705", "6710", "6715", "6719", "6720", "6723", "6729", "6728", "6730", "6731", "6700", "6702", "6725", "6451", "6453", "6452", "6460", "6461", "6385", "6390", "6395", "6415", "6416", "6417", "6450", "6455"]
                },
                {
                    text: "Sarah",
                    values: ["6610", "6611", "6612", "6613", "6625", "6615", "6616", "6620", "6621", "6505", "6506", "6510", "6151", "6126", "6305", "6306", "6325", "6540", "5900", "5901", "5906", "6800", "6832", "5951", "5952", "6525", "6425", "6427", "6404", "6405", "6411", "6421", "1000", "1055", "1060", "1062", "1064", "1066", "1160", "1165", "1305", "1310", "1445", "1460", "5301", "5302", "5303", "3000", "3010", "3011", "3012", "3019", "3020", "3022", "5100", "5110", "5120", "5500", "5515", "5525", "5545", "5555", "5565", "5800", "5801", "5803", "5804", "5805", "5806", "5807", "5808", "5809", "5802", "5851", "5852", "6251", "6252", "6705", "6710", "6715", "6719", "6720", "6723", "6729", "6728", "6730", "6731", "6700", "6702", "6725", "6451", "6453", "6452", "6460", "6461", "6385", "6390", "6395", "6415", "6416", "6417", "6450", "6455"]
                },
                {
                    text: "Review",
                    values: ["6610", "6611", "6612", "6613", "6625", "6615", "6616", "6620", "6621", "6505", "6506", "6510", "6151", "6126", "6305", "6306", "6325", "6540", "5900", "5901", "5906", "6800", "6832", "5951", "5952", "6525", "6425", "6427", "6404", "6405", "6411", "6421", "1000", "1055", "1060", "1062", "1064", "1066", "1160", "1165", "1305", "1310", "1445", "1460", "5301", "5302", "5303", "3000", "3010", "3011", "3012", "3019", "3020", "3022", "5100", "5110", "5120", "5500", "5515", "5525", "5545", "5555", "5565", "5800", "5801", "5803", "5804", "5805", "5806", "5807", "5808", "5809", "5802", "5851", "5852", "6251", "6252", "6705", "6710", "6715", "6719", "6720", "6723", "6729", "6728", "6730", "6731", "6700", "6702", "6725", "6451", "6453", "6452", "6460", "6461", "6385", "6390", "6395", "6415", "6416", "6417", "6450", "6455"]
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
            values: ["6800", "6832"]
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
        {   // Added 29 April -EH
            text: "Saddle-Stitch",
            values: ["6251", "6252"]
        },
        {
            text: "Shipping",
            values: ["6705", "6710", "6715", "6719", "6720", "6723", "6729", "6728", "6730", "6731"]
        },
        {
            text: "Shrink-Wrap",
            values: ["6700", "6702", "6725"]
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
    const columnVisibilityRules = {
        //added 17June EH
        "Amber": ['JobNumber', 'JobStatus', 'PrepressNotes', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'Last_Cover_Description', 'Last_Body_Description',  'Last_Comp3_Description', 'Next_Comp_Description', 'Does_it_blend', 'Did_it_blend', 'Ship_Date'],
        "Brent": ['JobNumber', 'PrepressNotes', 'PostpressNotes', 'Job_In_Date', 'Proof_Due_Date', 'Ship_Date', 'JobDescription', 'CustName', 'Quantity', 'Last_Cover_Description', 'Last_Body_Description', 'MP_Description', 'Designer'],
        "Cathy": ['JobNumber', 'JobStatus', 'PrepressNotes', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'Last_Cover_Description', 'Last_Body_Description',  'Last_Comp3_Description', 'Next_Comp_Description', 'Does_it_blend', 'Did_it_blend', 'Ship_Date'],
        "Gabbi": ['JobNumber', 'JobStatus', 'PrepressNotes', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'Last_Cover_Description', 'Last_Body_Description',  'Last_Comp3_Description', 'Next_Comp_Description', 'Does_it_blend', 'Did_it_blend', 'Ship_Date'],
        "Lisa":  ['JobNumber', 'JobStatus', 'PrepressNotes', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'Last_Cover_Description', 'Last_Body_Description',  'Last_Comp3_Description', 'Next_Comp_Description', 'Does_it_blend', 'Did_it_blend', 'Ship_Date'],
        "Sarah": ['JobNumber', 'PrepressNotes', 'PostpressNotes', 'Job_In_Date', 'Proof_Due_Date', 'Ship_Date', 'JobDescription', 'CustName', 'Quantity', 'Last_Cover_Description', 'Last_Body_Description', 'MP_Description', 'Designer'],
        "Review": ['JobNumber', 'JobStatus', 'PrepressNotes', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'Last_Cover_Description', 'Last_Body_Description',  'Last_Comp3_Description', 'Next_Comp_Description', 'Does_it_blend', 'Did_it_blend', 'Ship_Date'],
        //added 17June -EH
        "Lamination": ['JobNumber', 'JobStatus', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'CoverCoating', 'Last_Cover_Description', 'NCP_Time'],
        "UV Coating": ['JobNumber', 'JobStatus', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'CoverCoating', 'Last_Cover_Description', 'NCP_Time'],
            // "Drill" Defined by "C1MP_M_Proc" OR "C2MP_M_Proc" IN ["6505", "6506", "6510"] Until "NEXT_Comp_Process" > 6510
        "Drill": ['JobNumber',  'JobStatus', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'Size', 'CoverCoating', 'Last_Cover_Description', 'Last_Body_Description', 'NBP_Time'],
        "Folders": ['JobNumber',  'JobStatus', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'Size', 'CoverCoating', 'Last_Cover_Description', 'Last_Body_Description', 'NBP_Time'],
        "Hand Bindery": ['JobNumber',  'JobStatus', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'Size', 'CoverCoating', 'Last_Cover_Description', 'Last_Body_Description', 'NBP_Time'],
        "Hunkler": ['JobNumber',  'JobStatus', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'Size', 'CoverCoating', 'Last_Cover_Description', 'Last_Body_Description', 'NBP_Time'],
            //"Mail" Defined by a "Yes" answer in the "Does it blend" column
        "Mail": ['JobNumber', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'Size', 'CoverCoating', 'Last_Cover_Description', 'Last_Body_Description', 'Does_it_blend', 'Did_it_blend','Is_It_Wednesday', 'Carrier', 'ShipType'],
            // "MBO" Defined by "C1MP_M_Proc" IN ["5951", "5952"]
        "MBO": ['JobNumber',  'JobStatus', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity',  'Last_Completed_Comp_Description', 'Next_Comp_Time'],
        "Morgana": ['JobNumber',  'JobStatus', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'Size', 'Next_Comp_Description', 'NBP_Time'],
        "Perfect Binders": ['JobNumber', 'PostpressNotes', 'CustName', 'JobDescription', 'Comp2_Pages', 'Quantity', 'Size', 'CoverCoating', 'Last_Cover_Description', 'Last_Body_Description', 'Last_Comp3_Description', 'NBP_Time', 'Mat_Description'],
            // "BQ 470" Defined by "C2MP_M_Proc" IN ["6425", "6427"] Until Next_Comp_Process is > 6500
        "BQ 470": ['JobNumber',  'JobStatus', 'PostpressNotes', 'CustName', 'JobDescription', 'Comp2_Pages', 'Quantity', 'Size', 'CoverCoating', 'Last_Cover_Description', 'Last_Body_Description', 'NBP_Time'],
            // "SB-07" Defined by "C2MP_M_Proc" IN ["6404", "6405"] Until Next_Comp_Process is > 6500
        "SB-07": ['JobNumber',  'JobStatus', 'PostpressNotes', 'CustName', 'JobDescription', 'Comp2_Pages', 'Quantity', 'Size', 'CoverCoating', 'Last_Cover_Description', 'Last_Body_Description', 'NBP_Time'], 
            // "SB-09" Defined by "C2MP_M_Proc" IN ["6411", "6421"] Until Next_Comp_Process is > 6500
        "SB-09": ['JobNumber',  'JobStatus', 'PostpressNotes', 'CustName', 'JobDescription', 'Comp2_Pages', 'Quantity', 'Size', 'CoverCoating', 'Last_Cover_Description', 'Last_Body_Description', 'NBP_Time'],
        // "PrePress": ['JobNumber',  'JobStatus', 'PrepressNotes', 'Designer', 'JobStatus', 'ComponentNumber', 'CustName', 'JobDescription', 'NCP_Time', 'NBP_Time', 'Proof_Due_Date', 'Customer_CSR', 'Ship_Date'],
        "Needs Proof": ['JobNumber', 'PrepressNotes', 'Designer', 'JobStatus', 'ComponentNumber', 'CustName', 'JobDescription', 'NCP_Time', 'NBP_Time', 'Proof_Due_Date', 'Customer_CSR', 'JobStatus', 'Ship_Date'],
        "Proof Out": ['JobNumber', 'PrepressNotes', 'Designer', 'JobStatus', 'ComponentNumber', 'CustName', 'JobDescription', 'NCP_Time', 'NBP_Time', 'Proof_Due_Date', 'Customer_CSR', 'JobStatus', 'Ship_Date'],
        "Imposition": ['JobNumber', 'PrepressNotes', 'Designer', 'JobStatus', 'ComponentNumber', 'CustName', 'JobDescription', 'NCP_Time', 'NBP_Time', 'Proof_Due_Date', 'Customer_CSR', 'JobStatus', 'Ship_Date'],
        "Priming": ['JobNumber', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'Next_Comp_Time'],
        // "Print"
        "Print":  ['JobNumber', 'JobStatus', 'PostpressNotes', 'ComponentNumber', 'Print_Time', 'JobStatus', 'Ship_Date',  'CustName', 'JobDescription', 'Quantity', 'CoverCoating', 'Last_Cover_Description', 'Mat_Qty', 'Mat_BWT', 'Mat_Description', 'Mat_Code', 'Press_Size', 'Press_Out', 'Customer_CSR', 'Does_it_blend', 'Did_it_blend', 'Parent_Sheet_Size', 'Parent_Out', 'Print_Type'],
        "HP100K": ['JobNumber', 'JobStatus', 'PostpressNotes', 'ComponentNumber', 'Print_Time', 'JobStatus', 'Ship_Date',  'CustName', 'JobDescription', 'Quantity', 'CoverCoating', 'Last_Cover_Description', 'Mat_Qty', 'Mat_BWT', 'Mat_Description', 'Mat_Code', 'Press_Size', 'Press_Out', 'Customer_CSR'],
        "T200 Inkjet": ['JobNumber', 'JobStatus', 'PostpressNotes', 'ComponentNumber', 'Print_Time', 'JobStatus', 'Ship_Date',  'CustName', 'JobDescription', 'Quantity', 'Last_Cover_Description', 'Mat_Code', 'Mat_Qty', 'Mat_BWT', 'Mat_Description', 'Press_Size', 'Customer_CSR'],
        "Toner": ['JobNumber', 'JobStatus', 'PostpressNotes', 'ComponentNumber', 'Print_Time', 'JobStatus', 'Ship_Date',  'CustName', 'JobDescription', 'Quantity', 'CoverCoating', 'Last_Cover_Description', 'Mat_Code', 'Mat_Qty', 'Mat_BWT', 'Mat_Description', 'Parent_Sheet_Size', 'Parent_Out', 'Press_Size', 'Press_Out', 'Print_Type', 'Customer_CSR'],
            // "Saddle-Stitch" Defined by "C1MP_M_Proc" OR "C2MP_M_Proc" IN ["6251", "6252"]
        "Saddle-Stitch": ['JobNumber', 'JobStatus', 'PostpressNotes', 'CustName', 'JobDescription', 'Comp2_Pages', 'Quantity', 'Size', 'CoverCoating', 'Last_Cover_Description', 'Last_Body_Description', 'NBP_Time'],
        "Shipping": ['JobNumber', 'JobStatus', 'PostpressNotes', 'JobStatus', 'Ship_Date', 'Arrival_Date', 'CustName', 'JobDescription', 'Customer_CSR', 'Quantity', 'Carrier', 'ShipType', 'PONumber'],
            // "Shrink-Wrap" Defined by a "Yes" in the "Is_It_Wednesday" column 
        "Shrink-Wrap": ['JobNumber', 'JobStatus', 'PostpressNotes', 'CustName', 'JobDescription', 'Quantity', 'Size', 'Last_Cover_Description', 'Last_Body_Description', 'Next_Comp_Time'],
        "Spiral": ['JobNumber', 'JobStatus', 'PostpressNotes', 'CustName', 'JobDescription', 'Comp2_Pages', 'Quantity', 'Size', 'CoverCoating', 'Last_Cover_Description', 'Last_Body_Description', 'NBP_Time', 'Next_Comp_Description' ],
        // "Smart-Binders"
        "BQ-480": ['JobNumber', 'JobStatus', 'PostpressNotes', 'CustName', 'JobDescription', 'Comp2_Pages', 'Quantity', 'Size', 'CoverCoating', 'Last_Cover_Description', 'Last_Body_Description', 'NBP_Time'],
        "BQ-500": ['JobNumber', 'JobStatus', 'PostpressNotes', 'CustName', 'JobDescription', 'Comp2_Pages', 'Quantity', 'Size', 'CoverCoating', 'Last_Cover_Description', 'Last_Body_Description', 'NBP_Time'],
        "Wire-O": ['JobNumber', 'JobStatus', 'PostpressNotes', 'CustName', 'JobDescription', 'Comp2_Pages', 'Quantity', 'Size', 'CoverCoating', 'Last_Cover_Description', 'Last_Body_Description', 'NBP_Time']

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

    // Global variable to track initialization state
    let isTableInitialized = false;

    function initializeAll(initialData) {
        console.log("Starting initialization");
        
        // Destroy existing table if needed
        if ($.fn.DataTable.isDataTable('#prodTable')) {
            console.log("Destroying existing table from function initializeAll");
            table.destroy(true);
            $('#prodTable').empty();
        }
        // If we have real data, initialize the table
        if (initialData.length > 0 && initialData[0].JobNumber) {
            // Initialize DataTable with proper callback
            initializeDataTable(initialData, function() {
                console.log("DataTable fully initialized - running post-init tasks");
                
                // Now run your post-initialization tasks
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
        // Destroy existing table if it exists
        if ($.fn.DataTable.isDataTable('#prodTable')) {
            // Remove previous search handler
            if (searchHandler) {
                $('#customSearch').off('keyup', searchHandler);
            }
            table.destroy();
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

            "aaSorting": [],
            "paging": true,
            "pageLength": 100,
            "bSort": false,
            "colReorder": {
                fixedColumnsLeft: 1,
                stateSave: false // Disable state saving
            },
            dom: 'Brtip',
            buttons: [
                { extend: 'copy', className: "columnsButton" },
                { extend: 'excel', className: "columnsButton" }
            ],
            columns: [
                { data: 'JobNumber' , name: 'JobNumber' }, // 0
                { data: 'JobStatus' , name: 'JobStatus' }, // 1
                { data: 'Job_In_Date' , name: 'Job_In_Date' }, // 2
                { data: 'Proof_Due_Date' , name: 'Proof_Due_Date' }, // 3
                {
                  data: 'Ship_Date',
                  name: 'Ship_Date',
                  render: function(data, type, row) {
                    if (type === 'sort' || type === 'type') {
                      return new Date(data).getTime();
                    }
                    return data;
                  }
                }, // 4
                { data: 'Arrival_Date' , name: 'Arrival_Date' }, // 5
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
                { data: 'JobPriority' , name: 'JobPriority' }, // 36          Added 30 May
                { data: 'Does_it_blend' , name: 'Does_it_blend' }, // 37
                { data: 'Did_it_blend' , name: 'Did_it_blend' }, // 38
                { data: 'Is_It_Wednesday' , name: 'Is_It_Wednesday' }, // 39
                { data: 'ComponentNumber' , name: 'ComponentNumber' }, // 40
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
                { data: 'Hunkler_Time' , name: 'Hunkler_Time' } // 69
            ],
            "scrollX": false,
            "autoWidth": true,
            "fixedColumns": false,
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
            // This fires when the 'x' is clicked in Chrome/Edge
            if (this.value === '') {
                executeSearch('');
            }
        });
    }

    function executeSearch(term) {
        if (!$.fn.DataTable.isDataTable('#prodTable')) return;
        
        const table = $('#prodTable').DataTable();
        table.search(term).draw();
    }

    function applyDataUpdates(changes) {
        try {
            // Process removals - optimized for multiple rows
            const removals = changes.filter(c => c.type === 'remove');
            
            if (removals.length > 0) {
                // 1. First collect all rows to be removed
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
                
                // 2. Clean up all child rows and state first
                rowsToRemove.forEach(row => {
                    const rowNode = $(row.node());
                    
                    // Handle child rows
                    if (row.child) {
                        // Hide if shown
                        if (row.child.isShown && row.child.isShown()) {
                            row.child.hide();
                        }
                        
                        // Remove any lingering DOM elements
                        const childRow = rowNode.next('tr.child');
                        if (childRow.length) {
                            childRow.remove();
                        }
                        
                        // Clear DataTables' internal tracking
                        if (row.child.remove) {
                            row.child.remove();
                        }
                    }
                    
                    // Clean up classes
                    rowNode.removeClass('shown dt-hasChild');
                });
                
                // 3. Remove from sessionStorage in bulk
                let openRows = JSON.parse(sessionStorage.getItem('openRows')) || [];
                openRows = openRows.filter(row => 
                    !keysToRemove.has(`${row.jobNumber}-${row.componentNumber}`)
                );
                sessionStorage.setItem('openRows', JSON.stringify(openRows));
                
                // 4. Animate and remove rows
                rowsToRemove.forEach(row => {
                    $(row.node()).addClass('fade-out');
                });
                
                // 5. Remove all rows after animation completes
                setTimeout(() => {
                    table.rows(rowsToRemove.map(r => r.index()))
                        .remove()
                        .draw(false);
                    
                    // Force cleanup of any remaining artifacts
                    $('tr.child').each(function() {
                        if (!$(this).prev('tr').hasClass('parent')) {
                            $(this).remove();
                        }
                    });
                }, 500);
            }

            // Process updates
            changes.filter(c => c.type === 'update').forEach(change => {
                const [jobNumber, componentNumber] = change.key.split('-');
                const row = table.row((idx, data) =>
                    data.JobNumber == jobNumber && data.ComponentNumber == componentNumber
                );

                if (row.length) {
                    const rowData = row.data();
                    const oldValues = {
                        Ship_Date: rowData.Ship_Date,
                        JobNumber: rowData.JobNumber,
                        ComponentNumber: rowData.ComponentNumber
                    };

                    Object.assign(rowData, change.fields);
                    row.data(rowData).invalidate();

                    const rowNode = $(row.node());
                    rowNode.addClass('pulse');
                    setTimeout(() => rowNode.removeClass('pulse'), 2000);

                    const sortRelevantChanged =
                        ('Ship_Date' in change.fields && !areDatesEqual(oldValues.Ship_Date, change.fields.Ship_Date)) ||
                        ('JobNumber' in change.fields && oldValues.JobNumber !== change.fields.JobNumber) ||
                        ('ComponentNumber' in change.fields && oldValues.ComponentNumber !== change.fields.ComponentNumber);

                    if (sortRelevantChanged) {
                        table.rows().invalidate();
                        table.order(table.order()).draw();
                    } else {
                        row.draw(false);
                    }
                }
            });

            // Process inserts
            changes.filter(c => c.type === 'new').forEach(change => {
                const exists = table.rows((idx, data) =>
                    data.JobNumber == change.data.JobNumber && data.ComponentNumber == change.data.ComponentNumber
                ).count() > 0;

                if (!exists) {
                    const newRow = transformDataForTable(change.data);

                    if (typeof change.position !== 'undefined') {
                        // Rebuild table with new row inserted at position
                        const allData = table.rows().data().toArray();
                        allData.splice(change.position, 0, newRow);
                        table.clear();
                        table.rows.add(allData).draw();
                    } else {
                        // Add to end and re-sort
                        const addedRow = table.row.add(newRow).draw(false).node();
                        const $addedRow = $(addedRow);
                        $addedRow.addClass('pulse');
                        setTimeout(() => $addedRow.removeClass('pulse'), 2000);
                    }

                    // Reapply sort to place correctly
                    if (table.order().length > 0) {
                        table.order(table.order()).draw();
                    }
                }
            });

        } catch (error) {
            console.error("Error applying updates:", error);
        }
    }

    function areDatesEqual(date1, date2) {
        if (!date1 || !date2) return false;
        return new Date(date1).getTime() === new Date(date2).getTime();
    }

    function applyDepartmentFilter() {
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

            // ALWAYS apply row filtering
            if (deptValue) {
                applyRowFilter(deptValue);
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

            // Trigger single draw
            table.draw();

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

    function applyRowFilter(deptValue) {
        const selectedText = $('#deptFilter option:selected').text();
        const isPrePress =
            selectedText === 'PrePress' ||
            selectedText === 'Needs Proof' ||
            selectedText === 'Proof Out' ||
            selectedText === 'Imposition';

        const values = deptValue.split(',');
        const columnsToCheck = ['Next_Comp_Process'];
        //const columnsToCheck = ['Next_Cover_Process', 'Next_Body_Process', 'C1MP_M_Proc', 'C2MP_M_Proc'];
        //const columnsToCheck = ['Last_Cover_Process', 'Last_Body_Process', 'Next_Cover_Process', 'Next_Body_Process'];

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
                    
                    // Remove any existing session classes
                    $(rowNode).removeClass(function(index, className) {
                        return (className.match(new RegExp(`(^|\\s)${colorSessionId}-\\S+`, 'g')) || []).join(' ');
                    });

                    if (isPrePress) {
                    // PrePress department coloring logic
                    if (rowData.Designer) {
                        const designerExists = designers.some(d => d.EmployeeName === rowData.Designer);
                        if (designerExists) {
                            // Valid designer - use their specific color
                            const safeName = rowData.Designer.replace(/\s+/g, '-');
                            $(rowNode).addClass(`${colorSessionId}-designer-${safeName}`);
                        } else {
                            // Unknown designer - use default color
                            $(rowNode).addClass(`${colorSessionId}-designer-default`);
                        }
                    } else {
                        // No designer assigned - use default color
                        $(rowNode).addClass(`${colorSessionId}-designer-default`);
                    }
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

        // Clear any existing filters first
        $.fn.dataTable.ext.search = $.fn.dataTable.ext.search.filter(
            fn => fn !== currentDeptFilter
        );
        
        // Add the new filter
        $.fn.dataTable.ext.search.push(currentDeptFilter);
        
        table.draw();
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

    // variables for automatic reconnect
    let socket;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 5000; // 5 seconds

    // variable for checking if rows are opon on data refresh
    var drawHandler = null;
    const openRows = new Set();

    // Initialize WebSocket
    function initializeWebSocket() {
        socket = new WebSocket('wss://ampd.documation.com:8080');
        let reconnectTimeout;
        let pingInterval;
        let clickedRow = null;
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;
        const reconnectDelay = 5000;

        // Connection health monitoring
        function setupHeartbeat() {
            clearInterval(pingInterval);
            pingInterval = setInterval(() => {
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: 'ping' }));
                }
            }, 20000); // Send ping every 20s
        }

        socket.onopen = function(event) {
            console.log("WebSocket is open now.");
            reconnectAttempts = 0;
            setupHeartbeat();
            updateConnectionStatus('connected');
        };

        socket.onerror = function(error) {
            console.log("WebSocket error: " + error.message);
        };

        socket.onclose = function(event) {
            updateConnectionStatus('disconnected');
            console.log('WebSocket disconnected:', event.code, event.reason);

            if (event.code !== 1000) { // Don't reconnect if closed normally
              attemptReconnect();
            }
        };

        // open hidden row to show detailed data for accumulated production
        // save the clicked row information so, it opens back up on periodic refresh
        $('#prodTable tbody').on('click', 'tr', function(event) {
            // Ignore clicks on form elements and buttons
            if ($(event.target).is('input, textarea, button, a, select')) {
                return;
            }

            const clickedRow = table.row(this);
            const data = clickedRow.data();
            
            // Safely check for required data before proceeding
            if (!data || !data.JobNumber || !data.ComponentNumber) {
                return; // Exit if missing required data
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
                    //handleInitialData(response.data);
                    // Destroy existing table and reinitialize with new data
                    initializeAll(response.data);
                    break;
                    
                case 'dataUpdate':
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
            if (!Array.isArray(changes)) {
                console.error("Invalid dataUpdate format - changes should be an array");
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
                JobStatus: sourceData.JobStatus,
                Job_In_Date: sourceData.Job_In_Date,
                Proof_Due_Date: sourceData.Proof_Due_Date,
                Ship_Date: sourceData.Ship_Date,
                Arrival_Date: sourceData.Arrival_Date,
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
                JobPriority: sourceData.JobPriority,
                Does_it_blend: sourceData.Does_it_blend,
                Did_it_blend: sourceData.Did_it_blend,
                Is_It_Wednesday: sourceData.Is_It_Wednesday,
                ComponentNumber: sourceData.ComponentNumber,
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
            _rawData: sourceData // Store original data for details view
        };
    }

    // Function to reopen rows after the table refresh
    function restoreOpenRows(openRows) {
        // First close all existing rows
        table.rows().every(function() {
            if (this.child.isShown()) {
                this.child.hide();
                $(this.node()).removeClass('shown');
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
        if (reconnectAttempts < maxReconnectAttempts) {
            updateConnectionStatus('reconnecting');
            reconnectAttempts++;
            const delay = reconnectAttempts * reconnectDelay;
            console.log(`Attempting to reconnect in ${delay/1000} seconds... (Attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
        
            setTimeout(initializeWebSocket, delay);
        } else {
            console.log('Max reconnection attempts reached. Please refresh the page.');
            updateConnectionStatus('disconnected');
            // Optionally show a user notification
            toastr.error('Connection lost. Please refresh the page.', 'Disconnected', {
                timeOut: 0,
                extendedTimeOut: 0,
                closeButton: true
            });
        }
    }

    // Optional: Add visibility change detection to reconnect when tab becomes visible
    document.addEventListener('visibilitychange', function() {
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