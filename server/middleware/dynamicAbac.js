// server/middleware/dynamicAbac.js - Middleware using the dynamic engine
import abacEngine from '../services/abacEngine.js';

/**
 * Dynamic ABAC middleware
 */
export const checkDynamicAccess = (resourceModel, action) => {
  return async (req, res, next) => {
    try {
      if (req.user.isSuperAdmin) {
        req.abacContext = { hasAccess: true, filter: {} };
        return next();
      }
      
      // Build context from request
      const context = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        method: req.method,
        path: req.path,
        query: req.query
      };
      
      // For specific resource access (e.g., GET /students/123)
      if (req.params.id) {
        // Get the specific resource to check against
        const Model = mongoose.model(resourceModel);
        const resource = await Model.findById(req.params.id);
        
        if (!resource) {
          return res.status(404).json({ message: 'Resource not found' });
        }
        
        const evaluation = await abacEngine.evaluate(
          req.user._id, 
          { modelName: resourceModel, ...resource.toObject() }, 
          action, 
          context
        );
        
        if (evaluation.decision === 'deny') {
          return res.status(403).json({ 
            message: 'Access denied by policy',
            policies: evaluation.policies.filter(p => p.matched)
          });
        }
        
        req.abacContext = { hasAccess: true, resource, evaluation };
      } else {
        // For list operations (e.g., GET /students)
        const dataScope = await abacEngine.getDataScope(req.user._id, resourceModel, action);
        
        if (!dataScope.hasAccess) {
          return res.status(403).json({ message: 'No access to this resource type' });
        }
        
        req.abacContext = dataScope;
      }
      
      next();
    } catch (error) {
      console.error('Dynamic ABAC middleware error:', error);
      res.status(500).json({ message: 'Access control error' });
    }
  };
};

/**
 * Apply data filtering based on ABAC policies
 */
export const applyDataFilter = (req, res, next) => {
  if (req.abacContext && req.abacContext.filter) {
    req.dataFilter = req.abacContext.filter;
  } else {
    req.dataFilter = {};
  }
  next();
};
