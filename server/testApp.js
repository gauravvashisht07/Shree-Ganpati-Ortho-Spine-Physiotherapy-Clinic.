const express = require('express');
const requireRole = require('./middleware/rbac.middleware');
const authMiddleware = require('./middleware/auth.middleware');

const app = express();
app.use(express.json());

// Mock route that requires admin
app.get('/api/v1/admin-dashboard', authMiddleware, requireRole('admin'), (req, res) => {
  res.json({ message: 'Welcome Admin' });
});

module.exports = app;
