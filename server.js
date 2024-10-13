const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const url = require('url');

// Create the SQLite database
const db = new sqlite3.Database('patients.db');

// Ensure the patient table exists
db.run(`CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    age INTEGER,
    gender TEXT
)`);

function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');  // Allow all origins (or restrict to your client domain)
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');  // Allow GET, POST, OPTIONS methods
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');  // Only allow Content-Type header
}

// Server to handle requests
const server = http.createServer((req, res) => {
    // Set CORS headers for every request
    setCorsHeaders(res);  

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        // Respond with OK to preflight request
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/api/insert') {
        // Handle inserting patient data
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const patient = JSON.parse(body);
            const query = `INSERT INTO patients (name, age, gender) VALUES (?, ?, ?)`;
            db.run(query, [patient.name, patient.age, patient.gender], function (err) {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Error inserting patient data.');
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end('Patient data inserted successfully.');
                }
            });
        });

    } else if (req.method === 'POST' && req.url === '/api/query') {
        // Handle running SQL queries (INSERT)
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const { query } = JSON.parse(body);
            if (query.trim().toUpperCase().startsWith('INSERT')) {
                db.run(query, function (err) {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Error executing query.');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end('Query executed successfully.');
                    }
                });
            } else {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Only INSERT queries are allowed via POST.');
            }
        });

    } else if (req.method === 'GET' && req.url.startsWith('/api/query')) {
        // Handle running SQL queries (SELECT)
        const queryObject = url.parse(req.url, true).query;
        const sqlQuery = queryObject.sql;

        if (sqlQuery.trim().toUpperCase().startsWith('SELECT')) {
            db.all(sqlQuery, [], (err, rows) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Error executing query.');
                } else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(rows));
                }
            });
        } else {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Only SELECT queries are allowed via GET.');
        }

    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
