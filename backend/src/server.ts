import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import { authenticateToken, requireRole } from './middleware/auth';
import { Role } from '../generated/prisma/client';

// Controllers
import * as authController from './controllers/auth.controller';
import * as adminController from './controllers/admin.controller';
import * as storeController from './controllers/store.controller';
import * as ownerController from './controllers/owner.controller';

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());

// --- Health Check ---
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// --- Public Auth Routes ---
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);

// --- Authenticated Shared Routes ---
app.post('/api/auth/change-password', authenticateToken as any, authController.changePassword as any);

// --- Administrator Routes (ADMIN role required) ---
const adminAuth = [authenticateToken, requireRole([Role.ADMIN])];

app.get('/api/admin/stats', adminAuth as any, adminController.getDashboardStats as any);
app.post('/api/admin/users', adminAuth as any, adminController.addUser as any);
app.post('/api/admin/stores', adminAuth as any, adminController.addStore as any);
app.get('/api/admin/stores', adminAuth as any, adminController.getStores as any);
app.get('/api/admin/users', adminAuth as any, adminController.getUsers as any);
app.get('/api/admin/users/:id', adminAuth as any, adminController.getUserDetails as any);

// --- Normal User Routes (USER role required) ---
const userAuth = [authenticateToken, requireRole([Role.USER])];

app.get('/api/stores', userAuth as any, storeController.getStoresForUser as any);
app.post('/api/ratings', userAuth as any, storeController.submitRating as any);

// --- Store Owner Routes (STORE_OWNER role required) ---
const ownerAuth = [authenticateToken, requireRole([Role.STORE_OWNER])];

app.get('/api/owner/dashboard', ownerAuth as any, ownerController.getOwnerDashboard as any);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Express server running on http://localhost:${PORT}`);
});
