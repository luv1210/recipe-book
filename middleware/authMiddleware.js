const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    req.user = null;
    return res.redirect('/login');
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    req.user = user;
    next();
  } catch (error) {
    res.clearCookie('token');
    res.redirect('/login');
  }
};

const setUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    req.user = null;
    res.locals.user = null;
    return next();
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    req.user = user;
    res.locals.user = user;
    next();
  } catch (error) {
    req.user = null;
    res.locals.user = null;
    next();
  }
};

const authorizeRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).send('Access denied');
    }
    next();
  };
};

module.exports = { authenticateToken, setUser, authorizeRole };
