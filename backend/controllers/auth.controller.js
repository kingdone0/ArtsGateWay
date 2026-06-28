const authService = require('../services/auth.service');

const notificationService = require('../services/notification.service');

exports.register = async (req, res) => {
  try {
    const { username, email, password, role, gender, age } = req.body;
  
    if (!username || !email || !password || !gender || !age) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
 
    if (role && !['user', 'artist'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }
    
    const result = await authService.registerUser(req.body);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    
    const result = await authService.loginUser(email, password);
    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
};
exports.getMe = async (req, res) => {
  try {
    console.log('Authenticated user ID:', req.user.id);
    
    const user = await authService.getMeLogic(req.user.id);
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error in getMe:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};