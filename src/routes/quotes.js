// src/routes/quotes.js

import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

router.get('/customer', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM quotes WHERE customer_id = $1 ORDER BY created_at DESC',
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
            'SELECT * FROM quotes WHERE technician_id = $1 ORDER BY created_at DESC',
            [req.user.uid]
        );
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/', requireAuth, async (req, res) => {
    const q = req.body || {};
    if (!q.requestId || !q.customerId) {
        return res.status(400).json({ error: 'requestId and customerId are required' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO quotes
                (request_id, technician_id, customer_id, building_name, issue_type,
                 description, scope_of_work, parts_required, estimated_hours, labor_cost,
                 parts_cost, total_cost, tax_amount, grand_total, status, valid_until,
                 created_at, updated_at, notes)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
             RETURNING *`,
            [
                q.requestId,
                req.user.uid,
                q.customerId,
                q.buildingName || null,
                q.issueType || null,
                q.description || null,
                q.scopeOfWork || null,
                q.partsRequired || null,
                q.estimatedHours || 0,
                q.laborCost || 0,
                q.partsCost || 0,
                q.totalCost || 0,
                q.taxAmount || 0,
                q.grandTotal || 0,
                q.status || 'PENDING',
                q.validUntil || (Date.now() + 7 * 24 * 60 * 60 * 1000),
                Date.now(),
                Date.now(),
                q.notes || null,
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
            'UPDATE quotes SET status = $1, updated_at = $2 WHERE id = $3',
            [status, Date.now(), req.params.id]
        );
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;