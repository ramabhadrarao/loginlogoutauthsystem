// src/types/abac.ts
export interface AttributeDefinition {
  _id: string;
  name: string;
  displayName: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'reference' | 'array';
  referenceModel?: string;
  possibleValues?: Array<{ value: string; label: string }>;
  isRequired: boolean;
  isActive: boolean;
  category: 'user' | 'resource' | 'environment' | 'context';
  description?: string;
  validationRules?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface PolicyCondition {
  attribute: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'between' | 'same_as_user' | 'different_from_user';
  value: any;
  referenceUserAttribute?: string;
  logicalOperator: 'AND' | 'OR';
}

export interface PolicyRule {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  priority: number;
  subject: string;
  subjectConditions: PolicyCondition[];
  resource: {
    modelName: string;
    resourceConditions: PolicyCondition[];
  };
  actions: string[];
  environmentConditions: PolicyCondition[];
  effect: 'allow' | 'deny';
  timeBasedAccess?: {
    validFrom?: Date;
    validUntil?: Date;
    allowedHours?: Array<{ start: string; end: string }>;
    allowedDays?: string[];
  };
  createdBy: string;
  lastModifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserAttribute {
  _id: string;
  userId: string;
  attributeName: string;
  attributeValue: any;
  setBy: string;
  validFrom: Date;
  validUntil?: Date;
  isActive: boolean;
}

export interface PolicyEvaluation {
  _id: string;
  userId: string;
  resource: {
    modelName: string;
    resourceId?: string;
  };
  action: string;
  evaluatedPolicies: Array<{
    policyId: string;
    matched: boolean;
    effect: string;
    conditions: Array<{
      attribute: string;
      operator: string;
      expectedValue: any;
      actualValue: any;
      result: boolean;
    }>;
  }>;
  finalDecision: 'allow' | 'deny' | 'indeterminate';
  evaluationTimeMs: number;
  timestamp: Date;
}