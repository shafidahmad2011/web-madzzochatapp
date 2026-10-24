import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import { connectToWhatsApp } from './baileys.js';

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(routes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Baileys service listening on port ${PORT}`);
  connectToWhatsApp().catch((error) => {
    console.error('Initial WhatsApp connection failed:', error);
  });
});
