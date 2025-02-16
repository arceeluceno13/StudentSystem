const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const router = require('../StudentSystem/student-app/src/components/router.jsx'); 
const mysql = require('mysql2');

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Replace with your MySQL username
    password: '', // Replace with your MySQL password
    database: 'sis'
});

db.connect((err) => {
    if (err) throw err;
    console.log('MySQL connected');
});

module.exports = db;

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(router);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});