// src/auth.js - JWT issuing + verification

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const SECRET = process.env.JWT_SECRET || 'dev_secret_change_me_please';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET is not set in production.');
    process.exit(1);
}

export function issueToken(payload) {
    return jwt.sign(payload, SECRET, { expiresIn: '30d' });
}

export function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Missing bearer token' });
    }

    try {
        req.user = jwt.verify(token, SECRET);
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}