// src/routes/users.js
import { Router } from 'express';
import jwt from 'jsonwebtoken';

import pool from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

// ============================================================
// POST /api/users/sync
//
// Called by the mobile app right after Firebase auth succeeds.
//
// Contract:
//   - New uid (never seen by the server) → create with the client's role,
//     defaulting to 'MANAGER' if the client sends nothing or sends an
//     unknown value.
//   - Existing uid → PRESERVE the server's role. Update only the cosmetic
//     fields (display_name, phone_number) so profile edits propagate.
//
// The client is expected to call GET /api/users/me right after this to
// learn the authoritative role, in case the server preserved a different
// one than the client sent.
// ============================================================
router.post('/sync', async (req, res) => {
    try {
        const { uid, email, displayName, role, phoneNumber } = req.body || {};

        if (!uid || !email) {
            return res.status(400).json({ error: 'uid and email are required' });
        }

        // Look up by uid OR email — either may already exist.
        const findResult = await pool.query(
            'SELECT * FROM users WHERE uid = $1 OR email = $2 LIMIT 1',
            [uid, email]
        );

        let user;

        if (findResult.rows.length > 0) {
            // ---- EXISTING USER: preserve their role ----
            user = findResult.rows[0];

            const updated = await pool.query(
                `UPDATE users
                    SET display_name = COALESCE($1, display_name),
                        phone_number = COALESCE($2, phone_number)
                  WHERE uid = $3
                  RETURNING *`,
                [displayName || null, phoneNumber || null, user.uid]
            );
            user = updated.rows[0];

            console.log(
                `[users/sync] existing user uid=${user.uid} email=${user.email} ` +
                `role=${user.role} (preserved)`
            );
        } else {
            // ---- NEW USER: honor the client's role, default MANAGER ----
            const roleToUse =
                role === 'MANAGER' || role === 'TECHNICIAN'
                    ? role
                    : 'MANAGER';

            const inserted = await pool.query(
                `INSERT INTO users
                    (uid, email, display_name, role, phone_number, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [
                    uid,
                    email,
                    displayName || null,
                    roleToUse,
                    phoneNumber || null,
                    Date.now(),
                ]
            );
            user = inserted.rows[0];

            console.log(
                `[users/sync] created user uid=${user.uid} email=${user.email} ` +
                `role=${user.role}`
            );
        }

        // ---- Sign a JWT for this user ----
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('JWT_SECRET env var is missing');
            return res.status(500).json({ error: 'Server misconfigured: JWT_SECRET missing' });
        }

        const token = jwt.sign(
            {
                uid: user.uid,
                email: user.email,
                role: user.role,
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
// Returns the authoritative user record. The Android client relies on
// this to correct its local role after login.
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