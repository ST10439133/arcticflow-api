// src/routes/jobs.js

import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

router.get('/customer', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM jobs WHERE customer_id = $1 ORDER BY created_at DESC',
            [req.user.uid]
        );
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/technician', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM jobs WHERE technician_id = $1 ORDER BY created_at DESC',
            [req.user.uid]
        );
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/', requireAuth, async (req, res) => {
    const j = req.body || {};
    if (!j.technicianId || !j.customerId) {
        return res.status(400).json({ error: 'technicianId and customerId are required' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO jobs
                (quote_id, request_id, technician_id, customer_id, building_name,
                 issue_type, description, status, scheduled_date, notes,
                 full_address, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
             RETURNING *`,
            [
                j.quoteId || null,
                j.requestId || null,
                j.technicianId,
                j.customerId,
                j.buildingName || null,
                j.issueType || null,
                j.description || null,
                j.status || 'PENDING',
                j.scheduledDate || null,
                j.notes || null,
                j.fullAddress || null,
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
            'UPDATE jobs SET status = $1 WHERE id = $2',
            [status, req.params.id]
        );
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.patch('/:id/on-way', requireAuth, async (req, res) => {
    const { onWay } = req.body || {};
    if (typeof onWay !== 'boolean') {
        return res.status(400).json({ error: 'onWay boolean is required' });
    }
    try {
        await pool.query(
            'UPDATE jobs SET technician_on_way = $1 WHERE id = $2',
            [onWay, req.params.id]
        );
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;