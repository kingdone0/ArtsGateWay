const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id)
      .select('-password')
      .populate({
        path: 'artistProfile',
        select: 'bio website socialMedia'
      });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    
    if (user.isActive === false) {
      console.log(`🚫 User ${user.email} is suspended!`);
      return res.status(403).json({ 
        message: 'حسابك موقوف مؤقتاً. الرجاء التواصل مع الدعم الفني',
        suspended: true,
        reason: user.suspendReason || 'تم تعليق الحساب'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }

    res.status(500).json({ message: 'Authentication failed' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };