const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { Errors } = require('../utils/errors');
const { ok } = require('../utils/response');

function signTokens(user) {
  const payload = { sub: user._id, role: user.role, unit: user.unit };
  const access_token = jwt.sign(payload, process.env.JWT_ACCESS_SECRET || 'dummy_access_secret_change_me', {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });
  const refresh_token = jwt.sign(
    { ...payload, v: user.refreshTokenVersion },
    process.env.JWT_REFRESH_SECRET || 'dummy_refresh_secret_change_me',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
  return { access_token, refresh_token };
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw Errors.validation('Email and password are required.');

    const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
    if (!user) throw Errors.validation('Invalid email or password.');

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) throw Errors.validation('Invalid email or password.');

    const tokens = signTokens(user);
    return ok(res, {
      ...tokens,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, unit: user.unit },
    });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) throw Errors.validation('refresh_token is required.');

    const payload = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET || 'dummy_refresh_secret_change_me');
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive || user.refreshTokenVersion !== payload.v) {
      throw Errors.unauthenticated('Refresh token is no longer valid.');
    }

    const tokens = signTokens(user);
    return ok(res, tokens);
  } catch (err) {
    next(Errors.unauthenticated('Invalid or expired refresh token.'));
  }
}

async function logout(req, res, next) {
  try {
    // Bumping the refresh token version invalidates every outstanding refresh token for this user.
    await User.findByIdAndUpdate(req.user.id, { $inc: { refreshTokenVersion: 1 } });
    return ok(res, { loggedOut: true });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) throw Errors.validation('currentPassword and newPassword are required.');

    const user = await User.findById(req.user.id);
    const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!validPassword) throw Errors.validation('Current password is incorrect.');

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.refreshTokenVersion += 1; // force re-login on other devices
    await user.save();

    return ok(res, { changed: true });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash').populate('unit');
    return ok(res, user);
  } catch (err) {
    next(err);
  }
}

module.exports = { login, refresh, logout, changePassword, me };
