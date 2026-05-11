import 'dotenv/config';
import express from 'express';
import authRouter from './routes/auth';
import tripsRouter from './routes/trips';
import ordersRouter from './routes/orders';
import timelineRouter from './routes/timeline';
import emailRouter from './routes/email';
import usersRouter from './routes/users';

const app = express();
app.use(express.json());

app.use('/auth', authRouter);
app.use('/trips', tripsRouter);
app.use('/orders', ordersRouter);
app.use('/timeline', timelineRouter);
app.use('/email', emailRouter);
app.use('/users', usersRouter);

app.get('/trips/:tripId', async (req, res) => {
  const { tripId } = req.params;
  const pool = (await import('./db/client')).default;
  const { rows } = await pool.query(`SELECT * FROM trips WHERE id = $1`, [tripId]);
  if (!rows.length) { res.status(404).json({ error: 'not_found', message: 'Trip not found' }); return; }
  res.json({ ...rows[0], startDate: rows[0].start_date, endDate: rows[0].end_date });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'internal_error', message: 'An unexpected error occurred' });
});

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => console.log(`API server running on :${PORT}`));

export default app;
