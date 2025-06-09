// run this in terminal to check who is connected
// sudo lsof -i :8080

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
const clientMetadata = new Map();

// Cache for production schedule data
let cachedScheduleData = null;
let lastDataUpdate = 0;

// Helper function to get client IP
function getClientIp(ws) {
    return ws._socket.remoteAddress || 
           ws._socket.remoteAddress || 
           (ws.upgradeReq && ws.upgradeReq.connection.remoteAddress);
}

// Fetch data with connection pooling with caching
async function fetchInitialData() {
    try {
        // Return cached data if it's fresh (less than 5 seconds old)
        if (cachedScheduleData && Date.now() - lastDataUpdate < 5000) {
            return cachedScheduleData;
        }
        
        await poolConnect;
        const result = await pool.request().query('EXEC sp_ProductionScheduleDocu');
        cachedScheduleData = result.recordset;
        lastDataUpdate = Date.now();
        return cachedScheduleData;
    } catch (err) {
        console.error('Database query failed:', err);
        return cachedScheduleData || []; // Return cached data if available
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

        // Fetch updated data and broadcast
        const data = await fetchInitialData();
        broadcastData(data, 'initialData');
        
        return true;
    } catch (err) {
        console.error('Update designer failed:', err);
        return false;
    }
}

// Broadcast function
function broadcastData(data, type = 'initialData', excludeClient = null) {
    // For initialData type, we'll do a diff with the cached version
    if (type === 'initialData') {
        if (!cachedScheduleData) {
            // First broadcast, send everything
            cachedScheduleData = data;
            const message = JSON.stringify({ type, data });
            sendToAllClients(message, excludeClient);
            return;
        }

        // Find differences between cached and new data
        const changes = findDataDifferences(cachedScheduleData, data);
        
        if (changes.length > 0) {
            // Only send the changes if there are any
            const message = JSON.stringify({ 
                type: 'dataUpdate', 
                changes,
                fullUpdate: false,
                timestamp: Date.now()
            });
            sendToAllClients(message, excludeClient);
            cachedScheduleData = data; // Update cache
        }
    } else {
        // For other message types, send full data
        const message = JSON.stringify({ type, data });
        sendToAllClients(message, excludeClient);
    }
}

// Helper to find differences between data sets
function findDataDifferences(oldData, newData) {
    const changes = [];
    
    // Create a map of old data for quick lookup
    const oldDataMap = new Map();
    oldData.forEach(item => {
        const key = `${item.JobNumber}_${item.ComponentNumber}`;
        oldDataMap.set(key, item);
    });

    // Compare each new item with its old version
    newData.forEach(newItem => {
        const key = `${newItem.JobNumber}_${newItem.ComponentNumber}`;
        const oldItem = oldDataMap.get(key);
        
        if (!oldItem) {
            // New item
            changes.push({
                type: 'new',
                data: newItem
            });
        } else {
            // Check for changed fields
            const changedFields = {};
            let hasChanges = false;
            
            for (const field in newItem) {
                if (JSON.stringify(newItem[field]) !== JSON.stringify(oldItem[field])) {
                    changedFields[field] = newItem[field];
                    hasChanges = true;
                }
            }
            
            if (hasChanges) {
                changes.push({
                    type: 'update',
                    key,
                    fields: changedFields
                });
            }
        }
    });

    // Check for removed items
    const newKeys = new Set(newData.map(item => `${item.JobNumber}_${item.ComponentNumber}`));
    oldData.forEach(oldItem => {
        const key = `${oldItem.JobNumber}_${oldItem.ComponentNumber}`;
        if (!newKeys.has(key)) {
            changes.push({
                type: 'remove',
                key
            });
        }
    });

    return changes;
}

// Helper to send messages to all clients with rate limiting checks
function sendToAllClients(message, excludeClient = null) {
    clients.forEach(client => {
        const meta = clientMetadata.get(client);
        
        // Skip if client should be excluded, is blocked, or not open
        if (client === excludeClient || 
            !meta || 
            meta.isBlocked || 
            client.readyState !== WebSocket.OPEN) {
            return;
        }
        
        // Skip if client is being rate limited
        if (meta.messageCount > 100 && Date.now() - meta.firstMessageTime < 10000) {
            return;
        }
        
        try {
            client.send(message);
        } catch (err) {
            console.error('Error sending to client:', err);
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
    const clientId = Math.random().toString(36).substring(2, 8);
    const clientIp = getClientIp(ws);
    
    const metadata = {
        id: clientId,
        ip: clientIp,
        connectedAt: Date.now(),
        messageCount: 0,
        lastMessageTime: 0,
        firstMessageTime: 0,
        isBlocked: false,
        lastPing: Date.now()
    };
    
    clientMetadata.set(ws, metadata);
    clients.add(ws);
    
    console.log(`New connection ${clientId} from ${clientIp} (Total: ${clients.size})`);

    // Ping/pong for connection health
    const pingInterval = setInterval(() => {
        const meta = clientMetadata.get(ws);
        if (!meta || ws.readyState !== WebSocket.OPEN) return;
        
        // Check if client is responsive
        if (Date.now() - meta.lastPing > 120000) { // 2 minutes without response
            console.log(`Closing unresponsive connection ${meta.id}`);
            ws.terminate();
            return;
        }
        
        ws.ping();
    }, 30000); // Every 30 seconds

    ws.on('pong', () => {
        const meta = clientMetadata.get(ws);
        if (meta) meta.lastPing = Date.now();
    });

    // Initial data send
    fetchInitialData()
        .then(data => {
            ws.send(JSON.stringify({ type: 'initialData', data }));
        })
        .catch(err => {
            console.error('Initial data send failed:', err);
        });

    // Message handling
    ws.on('message', async (message) => {
        const meta = clientMetadata.get(ws);
        if (!meta) return;
        
        // Rate limiting (20 messages per 10 seconds)
        const now = Date.now();
        if (now - meta.firstMessageTime > 10000) {
            meta.firstMessageTime = now;
            meta.messageCount = 0;
        }
        
        meta.messageCount++;
        meta.lastMessageTime = now;
        
        if (meta.messageCount > 20) {
            if (!meta.isBlocked) {
                console.log(`Rate limiting client ${meta.id} (${meta.messageCount} messages)`);
                meta.isBlocked = true;
                ws.close(1008, 'Rate limit exceeded');
            }
            return;
        }
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
                    designerCode: request.designerCode,
                    designers // Include the full designer list
                }));
                // Broadcast the general update to all other clients
                const data = await fetchInitialData();
                broadcastData(data, 'initialData');
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
        clearInterval(pingInterval);
        clients.delete(ws);
        clientMetadata.delete(ws);
        
        console.log(`Connection ${metadata.id} closed (Remaining: ${clients.size})`);
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
