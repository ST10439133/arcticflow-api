// src/routes/buildings.js

import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM buildings WHERE user_id = $1 ORDER BY name',
            [req.user.uid]
        );
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/', requireAuth, async (req, res) => {
    const b = req.body || {};
    if (!b.name) {
        return res.status(400).json({ error: 'name is required' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO buildings
                (user_id, name, address, suburb, city, province, postal_code,
                 full_address, unit_count, floors, building_type, registered_date, status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
             RETURNING *`,
            [
                req.user.uid,
                b.name,
                b.address || null,
                b.suburb || null,
                b.city || null,
                b.province || null,
                b.postalCode || null,
                b.fullAddress || null,
                b.unitCount || 1,
                b.floors || 1,
                b.buildingType || 'RESIDENTIAL',
                b.registeredDate || Date.now(),
                b.status || 'ACTIVE',
            ]
        );
        res.json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/:id', requireAuth, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM buildings WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.uid]
        );
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;