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
const clients = new Map();
const clientMetadata = new Map();

// Enhanced cache for production schedule data
let cachedScheduleData = null;
let lastDataUpdate = 0;
let lastDataFetchAttempt = 0;
const CACHE_TTL = 5000; // 5 seconds cache TTL
const MIN_DB_FETCH_INTERVAL = 10000; // Minimum 10 seconds between DB fetches

// Helper function to get client IP
function getClientIp(ws) {
    return ws._socket.remoteAddress || 
           ws._socket.remoteAddress || 
           (ws.upgradeReq && ws.upgradeReq.connection.remoteAddress);
}

async function fetchInitialData() {
    const now = Date.now();
    
    // Check if we recently attempted a fetch
    if (now - lastDataFetchAttempt < MIN_DB_FETCH_INTERVAL) {
        console.log('[fetchInitialData] Too frequent fetch attempts, returning cached data');
        return cachedScheduleData || [];
    }
    
    lastDataFetchAttempt = now;
    
    // Return cached data if it's fresh
    if (cachedScheduleData && now - lastDataUpdate < CACHE_TTL) {
        console.log('[fetchInitialData] Returning cached data (still fresh)');
        return cachedScheduleData;
    }
    
    console.log('[fetchInitialData] Fetching fresh data from DB');
    try {
        await poolConnect;
        const result = await pool.request().query('EXEC sp_ProductionScheduleDocu');
        return result.recordset;
    } catch (err) {
        console.error('Database query failed:', err);
        return cachedScheduleData || [];
    }
}

async function sendInitialData(ws, clientId) {
    try {
        const data = await fetchInitialData();
        
        // Update cache with the fresh data
        cachedScheduleData = data;
        lastDataUpdate = Date.now();
        console.log('[CACHE] Updated cache with initial data');
        
        const message = JSON.stringify({
            type: 'initialData',
            data: data,
            fullUpdate: true,
            timestamp: lastDataUpdate
        });
        
        ws.send(message, (err) => {
            if (err) {
                console.error(`Failed to send initial data to ${clientId}:`, err);
                ws.terminate();
                clients.delete(clientId);
            } else {
                console.log(`Initial data sent to ${clientId}`);
                // Update last activity after successful send
                const client = clients.get(clientId);
                if (client) {
                    client.metadata.lastActivity = Date.now();
                }
            }
        });
    } catch (err) {
        console.error('Initial data preparation failed:', err);
        // Even if send fails, we might want to keep the cached data
        // as it represents the most recent successful fetch
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
        request.input('jobNumber', sql.VarChar(50), cleanJobNumber);
        
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

        const result = await request.query(query);
        console.log('Update successful, rows affected:', result.rowsAffected);

        if (result.rowsAffected[0] > 0) {
            // Fetch the updated data
            const updatedData = await fetchInitialData();

            // Broadcast only the changes
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
        // const data = await fetchInitialData();
        // broadcastData(data, 'initialData');
        
        return true;
    } catch (err) {
        console.error('Update designer failed:', err);
        return false;
    }
}

// In broadcastData, handle the cache comparison and update
function broadcastData(newData, type = 'initialData') {

    // Apply the same sorting as your stored procedure
    const sortedData = [...newData].sort((a, b) => {
        // 1. Compare Ship_Date (handle null/undefined dates)
        const dateA = a.Ship_Date ? new Date(a.Ship_Date) : new Date(0);
        const dateB = b.Ship_Date ? new Date(b.Ship_Date) : new Date(0);
        const dateDiff = dateA - dateB;
        if (dateDiff !== 0) return dateDiff;

        // 2. Compare JobNumber (always string)
        const jobDiff = a.JobNumber.localeCompare(b.JobNumber);
        if (jobDiff !== 0) return jobDiff;

        // 3. Compare ComponentNumber (handle both string and number)
        if (typeof a.ComponentNumber === 'number' && typeof b.ComponentNumber === 'number') {
            return a.ComponentNumber - b.ComponentNumber;
        }
        return String(a.ComponentNumber).localeCompare(String(b.ComponentNumber));
    });

    if (clients.size === 0) {
        console.log('No clients connected, skipping broadcast');
        // Still update cache even if no clients
        cachedScheduleData = sortedData;
        lastDataUpdate = Date.now();
        return;
    }

    // Prepare the correct message format
    const message = {
        type,
        timestamp: Date.now(),
        sortOrder: ['Ship_date', 'JobNumber', 'ComponentNumber'] // Include sort criteria
    };

    if (type === 'initialData') {
        message.data = newData;
        message.fullUpdate = true;
    } else if (type === 'dataUpdate') {
        const changes = findMeaningfulDifferences(cachedScheduleData, sortedData);
        if (changes.length === 0) {
            console.log('[BROADCAST] No meaningful changes, skipping broadcast');
            cachedScheduleData = sortedData;
            lastDataUpdate = Date.now();
            return;
        }
        message.changes = changes;
        
        // Include position hints for new items
        message.changes.forEach(change => {
            if (change.type === 'new') {
                change.position = sortedData.findIndex(item => 
                    item.JobNumber === change.data.JobNumber && 
                    item.ComponentNumber === change.data.ComponentNumber
                );
            }
            // Add this for updates that affect sorting
            if (change.type === 'update' && 'Ship_Date' in change.fields) {
                const [jobNumber, componentNumber] = change.key.split('-');
                change.position = sortedData.findIndex(item => 
                    item.JobNumber === jobNumber && 
                    item.ComponentNumber.toString() === componentNumber &&
                    item.Ship_Date === change.fields.Ship_Date // Verify exact match
                );
                
                // Include full row data for client verification
                change.newData = sortedData[change.position];
                
                console.log(`Update ${change.key} confirmed position: ${change.position}`, {
                    expectedShipDate: change.fields.Ship_Date,
                    actualShipDate: sortedData[change.position]?.Ship_Date
                });
            }
            console.log('Update positions:');
            if (change.type === 'update' && 'Ship_Date' in change.fields) {
                console.log(`- ${change.key}: position ${change.position}`);
            }
        });

        cachedScheduleData = sortedData;
        lastDataUpdate = Date.now();

        // Add search preservation flag
        message.preserveSearch = true;

        console.log('Sorted data order (first 10 rows):');
        sortedData.slice(0, 10).forEach((item, index) => {
            console.log(`#${index}: ${item.JobNumber}-${item.ComponentNumber}`, 
                       `Ship_Date: ${item.Ship_Date}`);
        });
    }

    // Stringify once
    const messageString = JSON.stringify(message);

    let sentCount = 0;
    clients.forEach(({ ws, metadata }) => {
        console.log("broadcastData test1:");
        if (ws.readyState === WebSocket.OPEN) {
        console.log("broadcastData test2:");
            ws.send(messageString, (err) => {
        console.log("broadcastData test3:");
                if (err) {
                    console.error(`Error sending to ${metadata.id}:`, err);
                    ws.terminate();
                    clients.delete(metadata.id);
                } else {
        console.log("broadcastData test4:");
                    sentCount++;
                    metadata.lastActivity = Date.now();
                }
            });
        }
    });

    console.log(`Broadcast ${type} to ${sentCount}/${clients.size} clients`);
    
    // Update cache after successful broadcast
    cachedScheduleData = sortedData;
    lastDataUpdate = Date.now();
    console.log('[CACHE] Updated cache after broadcast');
}


















function findMeaningfulDifferences(oldData, newData) {
    const changes = [];
    const getItemKey = item => `${item.JobNumber}-${item.ComponentNumber}`;

    // Create maps for efficient lookup
    const oldDataMap = new Map(oldData.map(item => [getItemKey(item), item]));
    const newDataMap = new Map(newData.map(item => [getItemKey(item), item]));

    // 1. Detect new and updated items
    newData.forEach(newItem => {
        const key = getItemKey(newItem);
        const oldItem = oldDataMap.get(key);
        
        if (!oldItem) {
            changes.push({ type: 'new', key, data: newItem });
        } else {
            const changedFields = {};
            
            // Compare ALL fields dynamically
            for (const field in newItem) {
                // Skip internal fields
                if (field.startsWith('_')) continue;
                
                const oldValue = oldItem[field];
                const newValue = newItem[field];
                
                // Special handling for date fields
                if (field.toLowerCase().includes('date') || field === 'Proof_Due_Date') {
                    if (!areDatesEqual(oldValue, newValue)) {
                        changedFields[field] = newValue;
                    }
                } 
                // Normal field comparison
                else if (!areValuesEqual(oldValue, newValue)) {
                    changedFields[field] = newValue;
                }

                // debugging log
                // console.log('Comparing:', {
                //     key,
                //     field,
                //     oldValue,
                //     newValue,
                //     oldDate: field.toLowerCase().includes('date') ? new Date(oldValue) : null,
                //     newDate: field.toLowerCase().includes('date') ? new Date(newValue) : null,
                //     equal: areDatesEqual(oldValue, newValue)
                // });
            }

            if (Object.keys(changedFields).length > 0) {
                changes.push({ type: 'update', key, fields: changedFields });
            }
        }
    });

    // 2. Detect removed items
    oldData.forEach(oldItem => {
        const key = getItemKey(oldItem);
        if (!newDataMap.has(key)) {
            changes.push({ type: 'remove', key });
        }
    });

    return changes;
}

// Special date comparison
function areDatesEqual(oldDate, newDate) {
    // Handle empty/whitespace dates
    const oldStr = String(oldDate || '').trim();
    const newStr = String(newDate || '').trim();
    
    // Consider empty string and whitespace as equal
    if ((!oldStr || oldStr === ' ') && (!newStr || newStr === ' ')) {
        return true;
    }
    
    // Compare as dates if both have values
    try {
        const oldTime = oldStr ? new Date(oldStr).getTime() : null;
        const newTime = newStr ? new Date(newStr).getTime() : null;
        return oldTime === newTime;
    } catch {
        return oldStr === newStr; // Fallback to string comparison
    }
}

// General value comparison
function areValuesEqual(a, b) {
    // Handle null/undefined
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;
    
    // Special case for empty strings/whitespace
    if (typeof a === 'string' && typeof b === 'string') {
        return a.trim() === b.trim();
    }
    
    // Default comparison
    return a === b;
}








// Helper to send messages to all clients with rate limiting checks
function sendToAllClients(message, excludeClient = null) {
    let sentCount = 0;
    let errorCount = 0;
    
    clients.forEach(client => {
        // Skip if client should be excluded
        if (client === excludeClient) {
            return;
        }

        const meta = clientMetadata.get(client);
        
        // Skip if no metadata or client is blocked
        if (!meta || meta.isBlocked) {
            return;
        }

        // Check connection state more thoroughly
        if (client.readyState !== WebSocket.OPEN) {
            // Clean up dead connections
            if (client.readyState === WebSocket.CLOSED || client.readyState === WebSocket.CLOSING) {
                console.log(`Cleaning up dead connection ${meta.id}`);
                clients.delete(client);
                clientMetadata.delete(client);
            }
            return;
        }

        // Rate limiting check
        const now = Date.now();
        if (meta.messageCount > 100 && now - meta.firstMessageTime < 10000) {
            console.log(`Rate limiting client ${meta.id}`);
            return;
        }

        try {
            client.send(message, (err) => {
                if (err) {
                    errorCount++;
                    console.error(`Error sending to client ${meta.id}:`, err);
                    // Clean up problematic connections
                    client.terminate();
                    clients.delete(client);
                    clientMetadata.delete(client);
                } else {
                    sentCount++;
                    // Update message count for rate limiting
                    meta.messageCount++;
                    if (now - meta.firstMessageTime > 10000) {
                        meta.firstMessageTime = now;
                        meta.messageCount = 1;
                    }
                }
            });
        } catch (err) {
            errorCount++;
            console.error(`Unexpected error sending to client ${meta.id}:`, err);
            client.terminate();
            clients.delete(client);
            clientMetadata.delete(client);
        }
    });
    
    console.log(`[SEND] Message of type ${JSON.parse(message).type} sent to ${sentCount} clients, ${errorCount} errors`);
    
    // If we failed to send to any clients but have active connections, log warning
    if (sentCount === 0 && clients.size > 0) {
        console.warn('Message not delivered to any clients despite active connections');
        console.log('Active connections:', Array.from(clients).map(c => clientMetadata.get(c).id));
    }
}

// Periodic updates with improved cachi
setInterval(async () => {
    try {
        const data = await fetchInitialData();
        broadcastData(data, 'dataUpdate');
    } catch (err) {
        console.error('Periodic update failed:', err);
    }
}, 25000);

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
        lastPing: Date.now(),
        isAlive: true,
        lastActivity: Date.now()
    };
    
    // Add to clients Set and metadata Map
    clientMetadata.set(ws, metadata);
    // Add to tracking
    clients.set(clientId, { ws, metadata });
    
    console.log(`New connection ${clientId} from ${clientIp} (Total: ${clients.size})`);

    // Immediate initial data send
    sendInitialData(ws, clientId);

    // Heartbeat check every 30 seconds
    setInterval(() => {
        const now = Date.now();
        clients.forEach(({ ws, metadata }) => {
            if (now - metadata.lastActivity > 60000) { // 60s timeout
                ws.terminate();
                clients.delete(metadata.id);
            } else if (!metadata.isAlive) {
                ws.ping();
            }
            metadata.isAlive = false;
        });
    }, 30000);

    // Heartbeat system
    ws.on('pong', () => {
        metadata.isAlive = true;
        metadata.lastActivity = Date.now();
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
                        request.jobNumber.toString(),
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
            } else if (request.type === 'updateDesigner') {
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
            } else if (request.type === 'initialData') {
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
        clients.delete(clientId);
        console.log(`Connection ${clientId} closed (Remaining: ${clients.size})`);
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