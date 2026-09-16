// src/routes/requests.js

import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

router.get('/pending', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM service_requests WHERE status = 'PENDING' ORDER BY created_at DESC"
        );
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM service_requests WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.uid]
        );
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/:id', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM service_requests WHERE id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }
        res.json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/', requireAuth, async (req, res) => {
    const r = req.body || {};
    if (!r.buildingId || !r.issueType) {
        return res.status(400).json({ error: 'buildingId and issueType are required' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO service_requests
                (user_id, building_id, building_name, issue_type, description,
                 priority, preferred_date, status, full_address, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
             RETURNING *`,
            [
                req.user.uid,
                r.buildingId,
                r.buildingName || null,
                r.issueType,
                r.description || null,
                r.priority || 'MEDIUM',
                r.preferredDate || null,
                r.status || 'PENDING',
                r.fullAddress || null,
                Date.now(),
                Date.now(),
            ]
        );
        res.json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.patch('/:id/status', requireAuth, async (req, res) => {
    const { status } = req.body || {};
    if (!status) {
        return res.status(400).json({ error: 'status is required' });
    }
    try {
        await pool.query(
            'UPDATE service_requests SET status = $1, updated_at = $2 WHERE id = $3',
            [status, Date.now(), req.params.id]
        );
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;