const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/toor_dal_dev').then(async () => {
  const result = await User.updateMany({ role: 'MANAGER' }, { $set: { role: 'SUPERVISOR' } });
  console.log('Updated users:', result);
  process.exit(0);
}).catch(console.error);
