const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');
const sql = require('mssql');

// Paths to your SSL/TLS certificate and key files
const options = {
    cert: fs.readFileSync('/etc/apache2/ssl/documation.cer'), // Primary certificate
    key: fs.readFileSync('/etc/apache2/ssl/documation.key'),  // Private key
    ca: fs.readFileSync('/etc/apache2/ssl/intermediate.crt'),  // Intermediate certificate chain
    servername: 'ampd.documation.com',
};

// Database config with increased timeout
const dbConfig = {
    ...JSON.parse(fs.readFileSync('/etc/apache2/dbConfig/enterprise/config.json', 'utf8')),
    requestTimeout: 60000,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Create connection pool
const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();

// Create server
const server = https.createServer(options);
const wss = new WebSocket.Server({ server });

// Track active clients
const clients = new Set();

// Fetch data with connection pooling
async function fetchInitialData() {
    try {
        await poolConnect;
        const result = await pool.request().query('EXEC sp_ProductionScheduleDocu');
        return result.recordset;
    } catch (err) {
        console.error('Database query failed:', err);
        return [];
    }
}

async function fetchDetailedData(jobNumber, componentNumber) {
    if (!jobNumber || !componentNumber) {
        console.error("Invalid parameters:", { jobNumber, componentNumber });
        return {
            jobNumber,
            componentNumber,
            data: [] // Return empty array but with identifiers
        };
    }
    try {
        await poolConnect;
        const request = pool.request();
        request.input('jobNumber', sql.VarChar, jobNumber);
        request.input('componentNumber', sql.VarChar, componentNumber.toString());
        
        const result = await request.query(`
            SELECT 
                pjn.JobNumber, 
                pjn.ComponentNumber, 
                p.ProcessCode, 
                process.Description, 
                p.CompletionCode, 
                p.CreateDatim, 
                E.EmployeeName, 
                P.Comments
            FROM ProductionJobNumber pjn
            INNER JOIN Production p ON pjn.ProductionCode = p.Code
            INNER JOIN Process ON Process.ProcessCode = p.ProcessCode
            LEFT JOIN Employee E ON P.EmployeeCode = E.Code
            WHERE pjn.JobNumber LIKE @jobNumber
                AND pjn.ComponentNumber LIKE @componentNumber
            ORDER BY pjn.ComponentNumber, p.CreateDatim
        `);
        return result.recordset;
    } catch (err) {
        console.error('Detailed query failed:', err);
        return {
            jobNumber,
            componentNumber,
            data: [] // Return empty array but with identifiers
        };
    }
}

// Update notes
async function updateNotes(jobNumber, componentNumber, field, value) {
    try {
        await poolConnect;
        const request = pool.request();
        
        // Ensure jobNumber is properly formatted as a string
        const cleanJobNumber = jobNumber.toString().trim();
        request.input('jobNumber', sql.VarChar(50), cleanJobNumber); // Specify length
        
        // Ensure componentNumber is a valid integer
        const cleanComponentNumber = parseInt(componentNumber);
        if (isNaN(cleanComponentNumber)) {
            throw new Error('Invalid componentNumber');
        }
        request.input('componentNumber', sql.Int, cleanComponentNumber);
        
        // Determine which field to update
        let query;
        if (field === 'PrepressNotes' || field === 'PostPressNotes') {
            // Ensure value is properly formatted as a string
            const cleanValue = value ? value.toString().trim() : '';
            request.input('value', sql.NVarChar(sql.MAX), cleanValue);
            
            query = `
                MERGE INTO ProductionScheduleInfoECW AS target
                USING (VALUES (@jobNumber, @componentNumber)) AS source (JobNumber, ComponentNumber)
                ON target.JobNumber = source.JobNumber AND target.ComponentNumber = source.ComponentNumber
                WHEN MATCHED THEN
                    UPDATE SET 
                        ${field} = @value,
                        LastUpdated = GETDATE()
                WHEN NOT MATCHED THEN
                    INSERT (JobNumber, ComponentNumber, ${field})
                    VALUES (@jobNumber, @componentNumber, @value);
            `;
        } else if (field === 'Priority') {
            // Ensure priority is a valid integer
            const cleanPriority = parseInt(value);
            if (isNaN(cleanPriority)) {
                throw new Error('Invalid priority value');
            }
            request.input('value', sql.Int, cleanPriority);
            
            query = `
                MERGE INTO JobNotes AS target
                USING (VALUES (@jobNumber, @componentNumber)) AS source (JobNumber, ComponentNumber)
                ON target.JobNumber = source.JobNumber AND target.ComponentNumber = source.ComponentNumber
                WHEN MATCHED THEN
                    UPDATE SET 
                        Priority = @value,
                        LastUpdated = GETDATE()
                WHEN NOT MATCHED THEN
                    INSERT (JobNumber, ComponentNumber, Priority)
                    VALUES (@jobNumber, @componentNumber, @value);
            `;
        } else {
            throw new Error('Invalid field specified');
        }

        // console.log('Executing query with:', {
        //     jobNumber: cleanJobNumber,
        //     componentNumber: cleanComponentNumber,
        //     field: field,
        //     value: value
        // });

        const result = await request.query(query);
        console.log('Update successful, rows affected:', result.rowsAffected);

        if (result.rowsAffected[0] > 0) {
            // Fetch the updated data
            const updatedData = await fetchInitialData();

            // Broadcast the updated data to all clients
            broadcastData(updatedData, 'initialData');
        }
        return true;
    } catch (err) {
        console.error('Update notes failed:', {
            error: err,
            inputParams: {
                jobNumber: jobNumber,
                componentNumber: componentNumber,
                field: field,
                value: value
            }
        });
        return false;
    }
}

async function getDesigners() {
    try {
        await poolConnect;
        const result = await pool.request().query('SELECT EmployeeName FROM Employee WHERE DepartmentCode = 1000 AND EmployeeInactive = 0');
        //console.log('Designers from DB:', result.recordset);
        return result.recordset;
    } catch (err) {
        console.error('Designer query failed:', err);
        return [];
    }
}

async function updateDesigner(jobNumber, componentNumber, designerName) {
    try {
        await poolConnect;
        await pool.request()
            .input('jobNumber', sql.VarChar(20), jobNumber.toString().trim())
            .input('componentNumber', sql.Int, parseInt(componentNumber))
            .input('designerName', sql.VarChar(100), designerName ? designerName.toString().trim() : null)
            .query(`
                MERGE INTO ProductionScheduleInfoECW AS target
                USING (VALUES (@jobNumber, @componentNumber, @designerName)) 
                    AS source (JobNumber, ComponentNumber, Designer)
                ON target.JobNumber = source.JobNumber 
                    AND target.ComponentNumber = source.ComponentNumber
                WHEN MATCHED THEN
                    UPDATE SET Designer = source.Designer
                WHEN NOT MATCHED THEN
                    INSERT (JobNumber, ComponentNumber, Designer)
                    VALUES (source.JobNumber, source.ComponentNumber, source.Designer);
            `);
        return true;
    } catch (err) {
        console.error('Update designer failed:', err);
        return false;
    }
    // broadcast updated data
    const data = await fetchInitialData();
    broadcastData(data, 'initialData');
}

// Broadcast function
function broadcastData(data, type = 'initialData') {
    const message = JSON.stringify({ type, data });
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Periodic updates
setInterval(async () => {
    try {
        const data = await fetchInitialData();
        broadcastData(data, 'initialData');
    } catch (err) {
        console.error('Periodic update failed:', err);
    }
}, 50000);

// WebSocket server
wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    clients.add(ws);

    // Ping/pong
    const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
        }
    }, 300000);

    ws.on('pong', () => {
        console.log('Received pong from client');
    });

    // Initial data
    fetchInitialData()
        .then(data => ws.send(JSON.stringify({ type: 'initialData', data })))
        .catch(err => console.error('Initial data send failed:', err));

    // Message handling
    ws.on('message', async (message) => {
        try {
            const request = JSON.parse(message);
      
            if (request.type === 'getDetailedData') {
                const data = await fetchDetailedData(request.jobNumber, request.componentNumber);
                ws.send(JSON.stringify({ 
                    type: 'detailedData',
                    jobNumber: request.jobNumber,
                    componentNumber: request.componentNumber,
                    data 
                }));
            } else if (request.type === 'updateNotes') {
                try {
                    // Validate required fields
                    if (!request.jobNumber || !request.componentNumber) {
                        throw new Error('Missing required fields');
                    }

                    // Determine which field we're updating
                    let field, value;
                    if (request.prepressNotes !== undefined && request.prepressNotes !== null) {
                        field = 'PrepressNotes';
                        value = request.prepressNotes;
                    } else if (request.postpressNotes !== undefined && request.postpressNotes !== null) {
                        field = 'PostPressNotes';
                        value = request.postpressNotes;
                    } else if (request.priority !== undefined && request.priority !== null) {
                        field = 'Priority';
                        value = request.priority;
                    } else {
                        throw new Error('No valid field to update');
                    }

                    const success = await updateNotes(
                        request.jobNumber.toString(), // Ensure string
                        request.componentNumber,
                        field,
                        value
                    );

                    if (success) {
                        ws.send(JSON.stringify({ 
                            type: 'updateSuccess',
                            jobNumber: request.jobNumber,
                            componentNumber: request.componentNumber
                        }));
                        
                        // Broadcast updated data
                        const data = await fetchInitialData();
                        broadcastData(data, 'initialData');
                    } else {
                        ws.send(JSON.stringify({ 
                            type: 'updateFailed',
                            message: 'Database update failed'
                        }));
                    }
                } catch (err) {
                    console.error('Update validation failed:', err);
                    ws.send(JSON.stringify({ 
                        type: 'error',
                        message: err.message
                    }));
                }
            } else if (request.type === 'getDesigners') {
                const data = await getDesigners();
                ws.send(JSON.stringify({ type: 'designers', data }));
            }
            else if (request.type === 'updateDesigner') {
                const success = await updateDesigner(
                    request.jobNumber,
                    request.componentNumber,
                    request.designerCode
                );
                ws.send(JSON.stringify({
                    type: 'designerUpdated',
                    success,
                    jobNumber: request.jobNumber,
                    componentNumber: request.componentNumber,
                    designerCode: request.designerCode
                }));
            }
             else if (request.type === 'initialData') {
                // Broadcast updated data
                const data = await fetchInitialData();
                broadcastData(data, 'initialData');
             }                
        } catch (err) {
            console.error('Message handling failed:', err);
            ws.send(JSON.stringify({ type: 'error', message: err.message }));
        }
    });

    // Cleanup on close
    ws.on('close', () => {
        clients.delete(ws);
        clearInterval(pingInterval);
        console.log('WebSocket connection closed');
    });
});

// Start server
server.listen(8080, () => {
    console.log('Secure WebSocket server running on wss://10.0.0.111:8080');
});

// Cleanup on exit
process.on('SIGINT', async () => {
    await pool.close();
    server.close();
    process.exit();
});
