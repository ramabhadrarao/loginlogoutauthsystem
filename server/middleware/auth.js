// server/middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Permission from '../models/Permission.js';

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from MongoDB with populated permissions
    const user = await User.findById(decoded.userId)
      .populate('permissions')
      .select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      // Super admin bypass
      if (req.user.isSuperAdmin) {
        return next();
      }

      // Check user permissions
      const hasPermission = req.user.permissions.some(
        permission => permission.permissionKey === requiredPermission
      );

      if (!hasPermission) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ message: 'Error checking permissions' });
    }
  };
};