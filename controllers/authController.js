const User = require('../models/User');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).render('register', { error: 'Username already exists', user: null });
    }
    const user = new User({ username, password, role });
    await user.save();
    res.redirect('/login');
  } catch (error) {
    res.status(500).render('register', { error: 'Registration failed', user: null });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).render('login', { error: 'Invalid credentials', user: null });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, username: user.username },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '1h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 3600000 // 1 hour
    });

    res.redirect('/');
  } catch (error) {
    res.status(500).render('login', { error: 'Login failed', user: null });
  }
};

const logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
};

module.exports = { register, login, logout };
