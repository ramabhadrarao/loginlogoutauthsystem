// server/services/abacEngine.js - Dynamic ABAC Policy Engine
import PolicyRule from '../models/PolicyRule.js';
import UserAttribute from '../models/UserAttribute.js';
import AttributeDefinition from '../models/AttributeDefinition.js';
import PolicyEvaluation from '../models/PolicyEvaluation.js';

class DynamicABACEngine {
  
  /**
   * Main method to check if a user can perform an action on a resource
   */
  async evaluate(userId, resource, action, context = {}) {
    const startTime = Date.now();
    
    try {
      // 1. Get user attributes
      const userAttributes = await this.getUserAttributes(userId);
      
      // 2. Get applicable policies
      const policies = await this.getApplicablePolicies(resource.modelName, action);
      
      // 3. Evaluate each policy
      const evaluationResults = [];
      let finalDecision = 'deny'; // Default deny
      
      for (const policy of policies) {
        const result = await this.evaluatePolicy(policy, userAttributes, resource, action, context);
        evaluationResults.push(result);
        
        // Apply policy combining algorithm (first applicable wins)
        if (result.matched) {
          finalDecision = result.effect;
          if (result.effect === 'allow') {
            break; // Stop on first allow (can be customized)
          }
        }
      }
      
      // 4. Log evaluation for debugging
      await this.logEvaluation(userId, resource, action, context, evaluationResults, finalDecision, Date.now() - startTime);
      
      return {
        decision: finalDecision,
        policies: evaluationResults,
        evaluationTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('ABAC evaluation error:', error);
      return { decision: 'deny', error: error.message };
    }
  }
  
  /**
   * Get all attributes for a user (including computed ones)
   */
  async getUserAttributes(userId) {
    // Get stored attributes
    const storedAttributes = await UserAttribute.find({ 
      userId, 
      isActive: true,
      $or: [
        { validUntil: { $exists: false } },
        { validUntil: { $gte: new Date() } }
      ]
    });
    
    // Get user basic info
    const user = await User.findById(userId)
      .populate('departmentRoles')
      .populate('primaryDepartment');
    
    // Combine all attributes
    const attributes = {
      userId: userId.toString(),
      username: user.username,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      isActive: user.isActive,
      
      // Time-based attributes
      currentTime: new Date().toISOString(),
      currentHour: new Date().getHours(),
      currentDay: new Date().toLocaleDateString('en-US', { weekday: 'lowercase' }),
      
      // Department-related attributes
      departments: user.departmentRoles?.map(dr => dr.departmentId.toString()) || [],
      primaryDepartment: user.primaryDepartment?.toString(),
      roles: user.departmentRoles?.map(dr => dr.role) || [],
      
      // Add stored attributes
      ...storedAttributes.reduce((acc, attr) => {
        acc[attr.attributeName] = attr.attributeValue;
        return acc;
      }, {})
    };
    
    return attributes;
  }
  
  /**
   * Get policies that could apply to this resource and action
   */
  async getApplicablePolicies(modelName, action) {
    return await PolicyRule.find({
      'resource.modelName': modelName,
      actions: action,
      isActive: true,
      $or: [
        { 'timeBasedAccess.validFrom': { $exists: false } },
        { 'timeBasedAccess.validFrom': { $lte: new Date() } }
      ],
      $or: [
        { 'timeBasedAccess.validUntil': { $exists: false } },
        { 'timeBasedAccess.validUntil': { $gte: new Date() } }
      ]
    }).sort({ priority: 1 }); // Lower priority number = higher priority
  }
  
  /**
   * Evaluate a single policy against user attributes and resource
   */
  async evaluatePolicy(policy, userAttributes, resource, action, context) {
    const result = {
      policyId: policy._id,
      policyName: policy.name,
      matched: false,
      effect: policy.effect,
      conditions: []
    };
    
    try {
      // 1. Check subject conditions (user attributes)
      const subjectMatch = this.evaluateConditions(
        policy.subjectConditions,
        userAttributes,
        'subject'
      );
      
      result.conditions.push(...subjectMatch.conditions);
      
      if (!subjectMatch.result) {
        return result;
      }
      
      // 2. Check resource conditions
      const resourceMatch = this.evaluateResourceConditions(
        policy.resource.resourceConditions,
        resource,
        userAttributes
      );
      
      result.conditions.push(...resourceMatch.conditions);
      
      if (!resourceMatch.result) {
        return result;
      }
      
      // 3. Check environment conditions
      const environmentMatch = this.evaluateEnvironmentConditions(
        policy.environmentConditions,
        context,
        userAttributes
      );
      
      result.conditions.push(...environmentMatch.conditions);
      
      if (!environmentMatch.result) {
        return result;
      }
      
      // 4. Check time-based access
      const timeMatch = this.evaluateTimeBasedAccess(policy.timeBasedAccess);
      
      if (!timeMatch) {
        result.conditions.push({
          type: 'time',
          result: false,
          reason: 'Outside allowed time window'
        });
        return result;
      }
      
      // All conditions passed
      result.matched = true;
      return result;
      
    } catch (error) {
      console.error('Policy evaluation error:', error);
      result.error = error.message;
      return result;
    }
  }
  
  /**
   * Evaluate conditions (subject, resource, environment)
   */
  evaluateConditions(conditions, attributes, type) {
    const result = { result: true, conditions: [] };
    
    if (!conditions || conditions.length === 0) {
      return result;
    }
    
    for (const condition of conditions) {
      const conditionResult = this.evaluateSingleCondition(condition, attributes);
      
      result.conditions.push({
        type,
        attribute: condition.attribute,
        operator: condition.operator,
        expectedValue: condition.value,
        actualValue: attributes[condition.attribute],
        result: conditionResult,
        logicalOperator: condition.logicalOperator
      });
      
      // Apply logical operator
      if (condition.logicalOperator === 'OR') {
        if (conditionResult) {
          result.result = true;
          break; // Short circuit on OR success
        }
      } else { // AND (default)
        if (!conditionResult) {
          result.result = false;
          break; // Short circuit on AND failure
        }
      }
    }
    
    return result;
  }
  
  /**
   * Evaluate a single condition
   */
  evaluateSingleCondition(condition, attributes) {
    const actualValue = attributes[condition.attribute];
    const expectedValue = condition.value;
    
    switch (condition.operator) {
      case 'equals':
        return actualValue === expectedValue;
        
      case 'not_equals':
        return actualValue !== expectedValue;
        
      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(actualValue);
        
      case 'not_in':
        return Array.isArray(expectedValue) && !expectedValue.includes(actualValue);
        
      case 'contains':
        return Array.isArray(actualValue) && actualValue.includes(expectedValue);
        
      case 'starts_with':
        return typeof actualValue === 'string' && actualValue.startsWith(expectedValue);
        
      case 'ends_with':
        return typeof actualValue === 'string' && actualValue.endsWith(expectedValue);
        
      case 'greater_than':
        return actualValue > expectedValue;
        
      case 'less_than':
        return actualValue < expectedValue;
        
      case 'between':
        return Array.isArray(expectedValue) && 
               actualValue >= expectedValue[0] && 
               actualValue <= expectedValue[1];
        
      default:
        return false;
    }
  }
  
  /**
   * Evaluate resource conditions with special operators
   */
  evaluateResourceConditions(conditions, resource, userAttributes) {
    const result = { result: true, conditions: [] };
    
    if (!conditions || conditions.length === 0) {
      return result;
    }
    
    for (const condition of conditions) {
      let conditionResult = false;
      let actualValue = resource[condition.attribute];
      
      // Handle special operators
      if (condition.operator === 'same_as_user') {
        const userAttrValue = userAttributes[condition.referenceUserAttribute];
        conditionResult = actualValue === userAttrValue;
      } else if (condition.operator === 'different_from_user') {
        const userAttrValue = userAttributes[condition.referenceUserAttribute];
        conditionResult = actualValue !== userAttrValue;
      } else {
        // Use standard condition evaluation
        conditionResult = this.evaluateSingleCondition(
          { ...condition, value: condition.value },
          { [condition.attribute]: actualValue }
        );
      }
      
      result.conditions.push({
        type: 'resource',
        attribute: condition.attribute,
        operator: condition.operator,
        expectedValue: condition.value,
        actualValue,
        result: conditionResult,
        logicalOperator: condition.logicalOperator
      });
      
      // Apply logical operator
      if (condition.logicalOperator === 'OR') {
        if (conditionResult) {
          result.result = true;
          break;
        }
      } else {
        if (!conditionResult) {
          result.result = false;
          break;
        }
      }
    }
    
    return result;
  }
  
  /**
   * Evaluate environment conditions
   */
  evaluateEnvironmentConditions(conditions, context, userAttributes) {
    const result = { result: true, conditions: [] };
    
    if (!conditions || conditions.length === 0) {
      return result;
    }
    
    // Add current environment to context
    const environmentAttributes = {
      ...context,
      currentTime: new Date().toISOString(),
      currentHour: new Date().getHours(),
      currentDay: new Date().toLocaleDateString('en-US', { weekday: 'lowercase' }),
      ...userAttributes
    };
    
    return this.evaluateConditions(conditions, environmentAttributes, 'environment');
  }
  
  /**
   * Check time-based access restrictions
   */
  evaluateTimeBasedAccess(timeBasedAccess) {
    if (!timeBasedAccess) return true;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
    
    // Check date range
    if (timeBasedAccess.validFrom && now < timeBasedAccess.validFrom) {
      return false;
    }
    
    if (timeBasedAccess.validUntil && now > timeBasedAccess.validUntil) {
      return false;
    }
    
    // Check allowed days
    if (timeBasedAccess.allowedDays && timeBasedAccess.allowedDays.length > 0) {
      if (!timeBasedAccess.allowedDays.includes(currentDay)) {
        return false;
      }
    }
    
    // Check allowed hours
    if (timeBasedAccess.allowedHours && timeBasedAccess.allowedHours.length > 0) {
      const isWithinHours = timeBasedAccess.allowedHours.some(timeSlot => {
        const startHour = parseInt(timeSlot.start.split(':')[0]);
        const endHour = parseInt(timeSlot.end.split(':')[0]);
        return currentHour >= startHour && currentHour <= endHour;
      });
      
      if (!isWithinHours) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Log evaluation for debugging and auditing
   */
  async logEvaluation(userId, resource, action, context, evaluationResults, finalDecision, evaluationTime) {
    try {
      await PolicyEvaluation.create({
        userId,
        resource: {
          modelName: resource.modelName,
          resourceId: resource._id?.toString()
        },
        action,
        requestContext: context,
        evaluatedPolicies: evaluationResults,
        finalDecision,
        evaluationTimeMs: evaluationTime,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      });
    } catch (error) {
      console.error('Failed to log policy evaluation:', error);
    }
  }
  
  /**
   * Get data scope for a user (what data they can see)
   */
  async getDataScope(userId, modelName, action = 'read') {
    const evaluation = await this.evaluate(userId, { modelName }, action);
    
    if (evaluation.decision === 'deny') {
      return { hasAccess: false, filter: null };
    }
    
    // Build MongoDB filter based on allowed conditions
    const filter = {};
    
    // Extract resource conditions from matched policies
    for (const policy of evaluation.policies) {
      if (policy.matched && policy.effect === 'allow') {
        // Add resource conditions to filter
        for (const condition of policy.conditions) {
          if (condition.type === 'resource' && condition.result) {
            // Convert ABAC conditions to MongoDB filter
            this.addToFilter(filter, condition);
          }
        }
      }
    }
    
    return { hasAccess: true, filter };
  }
  
  /**
   * Convert ABAC condition to MongoDB filter
   */
  addToFilter(filter, condition) {
    const field = condition.attribute;
    const operator = condition.operator;
    const value = condition.expectedValue;
    
    switch (operator) {
      case 'equals':
        filter[field] = value;
        break;
      case 'not_equals':
        filter[field] = { $ne: value };
        break;
      case 'in':
        filter[field] = { $in: value };
        break;
      case 'not_in':
        filter[field] = { $nin: value };
        break;
      case 'greater_than':
        filter[field] = { $gt: value };
        break;
      case 'less_than':
        filter[field] = { $lt: value };
        break;
      // Add more operators as needed
    }
  }
}

// Export singleton instance
export const abacEngine = new DynamicABACEngine();
export default abacEngine;