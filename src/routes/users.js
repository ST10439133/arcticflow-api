// src/routes/users.js
import { Router } from 'express';
import jwt from 'jsonwebtoken';

import pool from '../db.js';            // src/db.js
import { requireAuth } from '../auth.js'; // src/auth.js  ← no "middleware/" folder

const router = Router();

// ============================================================
// POST /api/users/sync
// Called by the mobile app right after Firebase auth succeeds.
// Creates the user if new, or finds them if they already exist.
// Returns a signed JWT for subsequent API calls.
// ============================================================
router.post('/sync', async (req, res) => {
    try {
        const { uid, email, displayName, role, phoneNumber } = req.body || {};

        if (!uid || !email) {
            return res.status(400).json({ error: 'uid and email are required' });
        }

        // ---------- FIND OR CREATE USER ----------
        // This approach avoids `ON CONFLICT DO UPDATE`, which was causing a
        // foreign key constraint violation because it can be interpreted as
        // a DELETE + INSERT by the database.
        // 1. Try to find the user by email first.
        let user;
        const findResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (findResult.rows.length > 0) {
            // 2. If the user exists, use their record.
            user = findResult.rows[0];
        } else {
            // 3. If the user does not exist, insert a new record.
            const insertResult = await pool.query(
                `INSERT INTO users (uid, email, display_name, role, phone_number, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [
                    uid,
                    email,
                    displayName || null,
                    role || 'TECHNICIAN',
                    phoneNumber || null,
                    Date.now(), // Use BIGINT milliseconds to match the DB column type
                ]
            );
            user = insertResult.rows[0];
        }

        if (!user) {
            return res.status(500).json({ error: 'Failed to sync user.' });
        }

        // ---------- JWT ----------
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('JWT_SECRET env var is missing');
            return res.status(500).json({ error: 'Server misconfigured: JWT_SECRET missing' });
        }

        const token = jwt.sign(
            {
                uid:   user.uid,
                email: user.email,
                role:  user.role,
            },
            jwtSecret,
            { expiresIn: '30d' }
        );

        return res.json({ token, user });
    } catch (err) {
        console.error('POST /api/users/sync failed:', err);
        return res.status(500).json({ error: err.message });
    }
});

// ============================================================
// GET /api/users/me
// Returns the current user's profile (requires Bearer token).
// ============================================================
router.get('/me', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE uid = $1 LIMIT 1',
            [req.user.uid]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.json(result.rows[0]);
    } catch (err) {
        console.error('GET /api/users/me failed:', err);
        return res.status(500).json({ error: err.message });
    }
});

export default router;