// src/routes/users.js

import { Router } from 'express';
import { pool } from './db.js';
import { issueToken, requireAuth } from '../auth.js';

const router = Router();

router.post('/sync', async (req, res) => {
    const { uid, email, displayName, role, phoneNumber } = req.body || {};

    if (!uid || !email) {
        return res.status(400).json({ error: 'uid and email are required' });
    }

    try {
        await pool.query(
            `INSERT INTO users (uid, email, display_name, role, phone_number, created_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (uid) DO UPDATE SET
                email        = EXCLUDED.email,
                display_name = EXCLUDED.display_name,
                role         = EXCLUDED.role,
                phone_number = EXCLUDED.phone_number`,
            [uid, email, displayName || null, role || 'TECHNICIAN', phoneNumber || null, Date.now()]
        );

        const token = issueToken({ uid, role: role || 'TECHNICIAN' });
        res.json({ token });
    } catch (e) {
        console.error('users.sync failed:', e);
        res.status(500).json({ error: e.message });
    }
});

router.get('/me', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE uid = $1',
            [req.user.uid]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;