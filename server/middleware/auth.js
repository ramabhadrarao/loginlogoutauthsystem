import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*, user_permissions(permission_id)')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      // Super admin bypass
      if (req.user.is_super_admin) {
        return next();
      }

      // Check user permissions
      const { data: permission, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', req.user.id)
        .eq('permission_key', requiredPermission)
        .single();

      if (error || !permission) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      return res.status(500).json({ message: 'Error checking permissions' });
    }
  };
};