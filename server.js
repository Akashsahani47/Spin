import express from 'express';
import connectDB from './config/db.js';
import cors from 'cors';
import './config/cron.js'

import notificationRoutes from "./routes/notificationRoutes.js";
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import spinRoutes from './routes/spinRoutes.js';
import referralRoutes from './routes/referralRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import investRoutes from './routes/investRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import RewardRoutes from './routes/rewardRoutes.js';

import 'dotenv/config';
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((error) => {
    console.error('Error connecting to the database:', error);
    process.exit(1);
});

app.get('/', (req, res) => {
    res.send('Hello World from backend!');
});


app.use('/api/auth', authRoutes);
app.use('/api/profile', userRoutes);
app.use('/api/spin', spinRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/invest', investRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/reward', RewardRoutes);

app.use((req, res, next) => {
    res.status(404).json({ message: 'Route not found' });
});
