const mongoose = require('mongoose');
const User = require('./src/models/User');
const Unit = require('./src/models/Unit');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/toor_dal_dev').then(async () => {
  let unit = await Unit.findOne();
  if (!unit) {
    unit = await Unit.create({ name: 'Default Unit', code: 'U-001', address: 'Unknown' });
  }
  const result = await User.updateMany({ role: 'SUPERVISOR', unit: null }, { $set: { unit: unit._id } });
  console.log('Updated users with unit ID:', result, 'Unit:', unit._id);
  process.exit(0);
}).catch(console.error);
