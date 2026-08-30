const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { ok, created } = require('../utils/response');
const { Errors } = require('../utils/errors');

async function listUsers(req, res, next) {
  try {
    const filter = req.user.role === 'MANAGER' ? {} : { unit: req.user.unit };
    const users = await User.find(filter).select('-passwordHash').populate('unit').sort({ createdAt: -1 });
    return ok(res, users);
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const { name, email, password, role, unitId } = req.body;
    if (!name || !email || !password || !role) throw Errors.validation('name, email, password, role are required.');
    
    // Assign unit: supervisor can only create users in their own unit
    const assignedUnit = req.user.role === 'MANAGER' ? (role === 'MANAGER' ? null : unitId) : req.user.unit;
    if (role !== 'MANAGER' && !assignedUnit) throw Errors.validation('unitId is required for SUPERVISOR/OPERATOR.');

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) throw Errors.validation('A user with this email already exists.');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      unit: assignedUnit,
    });

    const { passwordHash: _, ...safeUser } = user.toObject();
    return created(res, safeUser);
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const { name, role, unitId, isActive } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (role !== undefined) update.role = role;
    if (unitId !== undefined) update.unit = unitId;
    if (isActive !== undefined) update.isActive = isActive;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-passwordHash');
    if (!user) throw Errors.notFound('User not found.');
    return ok(res, user);
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, createUser, updateUser };
