const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');
const routesV1 = require('./routes/v1');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/v1', routesV1);

// Error Handling
app.use(errorHandler);

module.exports = app;
