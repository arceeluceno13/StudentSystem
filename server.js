const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

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

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, 'yourSecretKey', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user into the database
    const insertUserQuery = 'INSERT INTO users (username, password) VALUES (?, ?)';
    db.query(insertUserQuery, [username, hashedPassword], (err, results) => {
        if (err) {
            return res.status(400).json({ error: 'Registration failed' });
        }

        // Get the ID of the newly inserted user
        const userId = results.insertId;

        // Insert a default entry into the user_data table
        const insertUserDataQuery = 'INSERT INTO user_data (user_id, data) VALUES (?, ?)';
        db.query(insertUserDataQuery, [userId, 'Default data for new user'], (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to create user data' });
            }

            res.json({ message: 'User registered successfully and user data created' });
        });
    });
});
    

// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Check if the user exists
    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], async (err, results) => {
        if (err) throw err;

        if (results.length === 0) {
            return res.status(400).json({ error: 'User not found' });
        }

        const user = results[0];

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.id }, 'yourSecretKey', { expiresIn: '1h' });

        res.json({ token });
    });
});

// Fetch user-specific data endpoint
// Fetch user-specific data (Read)
app.get('/user-data', authenticateToken, (req, res) => {
    const userId = req.user.id;

    const query = 'SELECT * FROM user_data WHERE user_id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Add new data (Create)
app.post('/user-data', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { data } = req.body;

    // Validate data
    if (!data || !data.trim()) {
        return res.status(400).json({ error: 'Data cannot be empty' });
    }

    const query = 'INSERT INTO user_data (user_id, data) VALUES (?, ?)';
    db.query(query, [userId, data.trim()], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to add data' });
        }
        res.json({ message: 'Data added successfully', id: results.insertId });
    });
});

// Update existing data (Update)
app.put('/user-data/:id', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { data } = req.body;

    // Validate data
    if (!data || !data.trim()) {
        return res.status(400).json({ error: 'Data cannot be empty' });
    }

    const query = 'UPDATE user_data SET data = ? WHERE id = ? AND user_id = ?';
    db.query(query, [data.trim(), id, userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to update data' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Data not found' });
        }
        res.json({ message: 'Data updated successfully' });
    });
});


// Delete data (Delete)
app.delete('/user-data/:id', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    const query = 'DELETE FROM user_data WHERE id = ? AND user_id = ?';
    db.query(query, [id, userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to delete data' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Data not found' });
        }
        res.json({ message: 'Data deleted successfully' });
    });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});