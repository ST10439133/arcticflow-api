// src/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import usersRouter     from './routes/users.js';
import buildingsRouter from './routes/buildings.js';
import requestsRouter  from './routes/requests.js';
import quotesRouter    from './routes/quotes.js';
import jobsRouter      from './routes/jobs.js';
import locationsRouter from './routes/locations.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/', (req, res) => res.json({ ok: true, service: 'arcticflow-api', version: '1.0.0' }));
app.get('/health', (req, res) => res.json({ ok: true, timestamp: Date.now() }));

app.use('/api/users',     usersRouter);
app.use('/api/buildings', buildingsRouter);
app.use('/api/requests',  requestsRouter);
app.use('/api/quotes',    quotesRouter);
app.use('/api/jobs',      jobsRouter);
app.use('/api/locations', locationsRouter);

app.use((req, res) => res.status(404).json({ error: `No route for ${req.method} ${req.path}` }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ArcticFlow API listening on port ${PORT}`));