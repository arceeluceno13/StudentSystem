const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../../db.js'); // Adjust the path to your db.js file
const { authenticateToken } = require('./middleware.jsx');

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user into the database
        const [results] = await db.query(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword]
        );

        // Get the ID of the newly inserted user
        const userId = results.insertId;

        // Insert a default entry into the user_data table
        await db.query(
            'INSERT INTO user_data (user_id, data) VALUES (?, ?)',
            [userId, 'Default data for new user']
        );

        res.json({ message: 'User registered successfully and user data created' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login a user
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        // Check if the user exists
        const [results] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

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
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'yourSecretKey', { expiresIn: '1h' });

        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Fetch user-specific data (Read)
router.get('/user-data', authenticateToken, async (req, res) => {
    const userId = req.user.id;

    try {
        const [results] = await db.query('SELECT * FROM user_data WHERE user_id = ?', [userId]);
        res.json(results);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Add new data (Create)
router.post('/user-data', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { data } = req.body;

    // Validate data
    if (!data || !data.trim()) {
        return res.status(400).json({ error: 'Data cannot be empty' });
    }

    try {
        const [results] = await db.query(
            'INSERT INTO user_data (user_id, data) VALUES (?, ?)',
            [userId, data.trim()]
        );
        res.json({ message: 'Data added successfully', id: results.insertId });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Failed to add data' });
    }
});

// Update existing data (Update)
router.put('/user-data/:id', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { data } = req.body;

    // Validate data
    if (!data || !data.trim()) {
        return res.status(400).json({ error: 'Data cannot be empty' });
    }

    try {
        const [results] = await db.query(
            'UPDATE user_data SET data = ? WHERE id = ? AND user_id = ?',
            [data.trim(), id, userId]
        );

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Data not found' });
        }

        res.json({ message: 'Data updated successfully' });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Failed to update data' });
    }
});

// Delete data (Delete)
router.delete('/user-data/:id', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const [results] = await db.query(
            'DELETE FROM user_data WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Data not found' });
        }

        res.json({ message: 'Data deleted successfully' });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Failed to delete data' });
    }
});

module.exports = router;