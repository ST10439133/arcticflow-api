// src/routes/locations.js - live technician tracking

import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
    const { customerId } = req.query;
    try {
        let result;
        if (customerId) {
            result = await pool.query(
                `SELECT * FROM tech_locations
                 WHERE is_on_my_way = TRUE AND customer_id = $1`,
                [customerId]
            );
        } else {
            result = await pool.query(
                'SELECT * FROM tech_locations WHERE is_on_my_way = TRUE'
            );
        }
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.put('/:technicianId', requireAuth, async (req, res) => {
    const technicianId = req.params.technicianId;
    if (req.user.uid !== technicianId) {
        return res.status(403).json({ error: 'Cannot update another tech' });
    }

    const l = req.body || {};
    if (typeof l.latitude !== 'number' || typeof l.longitude !== 'number') {
        return res.status(400).json({ error: 'latitude and longitude are required' });
    }

    try {
        await pool.query(
            `INSERT INTO tech_locations
                (technician_id, technician_name, latitude, longitude, job_id,
                 customer_id, building_name, is_on_my_way, last_updated, status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
             ON CONFLICT (technician_id) DO UPDATE SET
                technician_name = EXCLUDED.technician_name,
                latitude        = EXCLUDED.latitude,
                longitude       = EXCLUDED.longitude,
                job_id          = EXCLUDED.job_id,
                customer_id     = EXCLUDED.customer_id,
                building_name   = EXCLUDED.building_name,
                is_on_my_way    = EXCLUDED.is_on_my_way,
                last_updated    = EXCLUDED.last_updated,
                status          = EXCLUDED.status`,
            [
                technicianId,
                l.technicianName || 'Technician',
                l.latitude,
                l.longitude,
                l.jobId || null,
                l.customerId || null,
                l.buildingName || null,
                l.isOnMyWay === true,
                Date.now(),
                l.status || 'idle',
            ]
        );
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/:technicianId', requireAuth, async (req, res) => {
    try {
        await pool.query(
            `UPDATE tech_locations
             SET is_on_my_way = FALSE, status = 'idle', last_updated = $1
             WHERE technician_id = $2`,
            [Date.now(), req.params.technicianId]
        );
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;