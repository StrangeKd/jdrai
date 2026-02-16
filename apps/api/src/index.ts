import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`JDRAI API running on port ${PORT}`);
});
