const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { Errors } = require('./utils/errors');

const authRoutes = require('./routes/authRoutes');
const unitRoutes = require('./routes/unitRoutes');
const userRoutes = require('./routes/userRoutes');
const intakeRoutes = require('./routes/intakeRoutes');
const configRoutes = require('./routes/configRoutes');
const siloRoutes = require('./routes/siloRoutes');
const siloMovementRoutes = require('./routes/siloMovementRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const processingRoutes = require('./routes/processingRoutes');
const byproductRoutes = require('./routes/byproductRoutes');
const transferRoutes = require('./routes/transferRoutes');
const dispatchRoutes = require('./routes/dispatchRoutes');
const labRoutes = require('./routes/labRoutes');
const yieldRoutes = require('./routes/yieldRoutes');
const auditRoutes = require('./routes/auditRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/v1/health', (req, res) => res.json({ data: { status: 'ok' }, error: null }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/units', unitRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/intake', intakeRoutes);
app.use('/api/v1/configuration', configRoutes);
app.use('/api/v1/silos', siloRoutes);
app.use('/api/v1/silo-movements', siloMovementRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/shifts', shiftRoutes);
app.use('/api/v1/processing-runs', processingRoutes);
app.use('/api/v1/byproducts', byproductRoutes);
app.use('/api/v1/transfers', transferRoutes);
app.use('/api/v1/dispatch', dispatchRoutes);
app.use('/api/v1/lab-tests', labRoutes);
app.use('/api/v1/yield', yieldRoutes);
app.use('/api/v1/audit-logs', auditRoutes);
app.use('/api/v1/reports', reportRoutes);

// 404
app.use((req, res, next) => next(Errors.notFound(`No route for ${req.method} ${req.originalUrl}`)));

// Central error handler — every ApiError becomes a consistent { data:null, error:{code,message} } body.
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  if (status === 500) console.error(err);
  res.status(status).json({ data: null, error: { code, message: err.message || 'Something went wrong.' } });
});

module.exports = app;
