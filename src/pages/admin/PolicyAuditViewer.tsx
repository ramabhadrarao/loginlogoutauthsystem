// src/pages/admin/PolicyAuditViewer.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Eye, Search, Filter, Calendar, Clock, User, Shield, CheckCircle, XCircle, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { abacApi } from '../../utils/abacApi';
import { PolicyEvaluation } from '../../types/abac';

const PolicyAuditViewer = () => {
  const [evaluations, setEvaluations] = useState<PolicyEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filters, setFilters] = useState({
    userId: '',
    modelName: '',
    action: '',
    decision: '',
    dateFrom: '',
    dateTo: ''
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage] = useState(20);
  
  // Expanded evaluation details
  const [expandedEvaluation, setExpandedEvaluation] = useState<string | null>(null);

  useEffect(() => {
    loadEvaluations();
  }, [currentPage, filters]);

  const loadEvaluations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      };
      
      const data = await abacApi.evaluations.getAll(params);
      
      setEvaluations(data.evaluations);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
      setCurrentPage(data.currentPage);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      userId: '',
      modelName: '',
      action: '',
      decision: '',
      dateFrom: '',
      dateTo: ''
    });
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const toggleEvaluationDetails = (evaluationId: string) => {
    setExpandedEvaluation(expandedEvaluation === evaluationId ? null : evaluationId);
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'allow':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'deny':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'indeterminate':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'allow':
        return 'bg-green-100 text-green-800';
      case 'deny':
        return 'bg-red-100 text-red-800';
      case 'indeterminate':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const exportAuditLog = () => {
    // Create CSV content
    const headers = ['Timestamp', 'User', 'Resource', 'Action', 'Decision', 'Duration', 'Policies Evaluated'];
    const csvContent = [
      headers.join(','),
      ...evaluations.map(eval => [
        new Date(eval.timestamp).toISOString(),
        eval.userId,
        `${eval.resource.modelName}${eval.resource.resourceId ? `:${eval.resource.resourceId}` : ''}`,
        eval.action,
        eval.finalDecision,
        formatDuration(eval.evaluationTimeMs),
        eval.evaluatedPolicies.length
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `abac-audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading && evaluations.length === 0) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Audit Logs</h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <div className="mt-4">
              <Button onClick={loadEvaluations} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Policy Evaluation Audit</h2>
          <p className="text-sm text-gray-500">
            Track and analyze all policy evaluations and access decisions
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={exportAuditLog}
            icon={<Download className="h-4 w-4" />}
            disabled={evaluations.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={loadEvaluations}
            icon={<RefreshCw className="h-4 w-4" />}
            isLoading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Evaluations</p>
                <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
              </div>
              <Eye className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Allowed</p>
                <p className="text-2xl font-bold text-green-600">
                  {evaluations.filter(e => e.finalDecision === 'allow').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Denied</p>
                <p className="text-2xl font-bold text-red-600">
                  {evaluations.filter(e => e.finalDecision === 'deny').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold text-gray-900">
                  {evaluations.length > 0 
                    ? formatDuration(evaluations.reduce((sum, e) => sum + e.evaluationTimeMs, 0) / evaluations.length)
                    : '0ms'
                  }
                </p>
              </div>
              <Clock className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Filter audit logs by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID
              </label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                placeholder="Enter user ID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resource Model
              </label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                value={filters.modelName}
                onChange={(e) => handleFilterChange('modelName', e.target.value)}
                placeholder="Student, Course, etc."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
              >
                <option value="">All Actions</option>
                <option value="create">Create</option>
                <option value="read">Read</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Decision
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                value={filters.decision}
                onChange={(e) => handleFilterChange('decision', e.target.value)}
              >
                <option value="">All Decisions</option>
                <option value="allow">Allow</option>
                <option value="deny">Deny</option>
                <option value="indeterminate">Indeterminate</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date From
              </label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date To
              </label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Evaluation Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evaluation Logs</CardTitle>
          <CardDescription>
            Showing {evaluations.length} of {totalCount} evaluation logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {evaluations.map((evaluation) => (
              <div key={evaluation._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getDecisionIcon(evaluation.finalDecision)}
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getDecisionColor(evaluation.finalDecision)}`}>
                        {evaluation.finalDecision.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      <span>{evaluation.userId}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Shield className="h-4 w-4" />
                      <span>{evaluation.resource.modelName}</span>
                      {evaluation.resource.resourceId && (
                        <span className="text-gray-400">#{evaluation.resource.resourceId}</span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{evaluation.action}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDuration(evaluation.evaluationTimeMs)}</span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(evaluation.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleEvaluationDetails(evaluation._id)}
                      className="text-indigo-600 hover:text-indigo-700"
                    >
                      {expandedEvaluation === evaluation._id ? 'Hide' : 'Details'}
                    </Button>
                  </div>
                </div>
                
                {/* Expanded Details */}
                {expandedEvaluation === evaluation._id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Evaluated Policies ({evaluation.evaluatedPolicies.length})
                        </h4>
                        <div className="space-y-2">
                          {evaluation.evaluatedPolicies.map((policy, index) => (
                            <div key={index} className="bg-gray-50 rounded p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">Policy ID: {policy.policyId}</span>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-0.5 text-xs rounded ${policy.matched ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {policy.matched ? 'Matched' : 'Not Matched'}
                                  </span>
                                  <span className={`px-2 py-0.5 text-xs rounded ${getDecisionColor(policy.effect)}`}>
                                    {policy.effect.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              
                              {policy.conditions && policy.conditions.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-medium text-gray-700 mb-1">Conditions:</h5>
                                  <div className="space-y-1">
                                    {policy.conditions.map((condition, condIndex) => (
                                      <div key={condIndex} className="text-xs text-gray-600 flex items-center space-x-2">
                                        <span className={`w-2 h-2 rounded-full ${condition.result ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        <span>
                                          {condition.attribute} {condition.operator} {JSON.stringify(condition.expectedValue)}
                                        </span>
                                        <span className="text-gray-400">
                                          (actual: {JSON.stringify(condition.actualValue)})
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {evaluations.length === 0 && (
              <div className="text-center py-12">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Evaluation Logs Found</h3>
                <p className="text-gray-500">
                  {Object.values(filters).some(v => v !== '') 
                    ? 'Try adjusting your filters or check back later'
                    : 'Policy evaluations will appear here as users access the system'
                  }
                </p>
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, totalCount)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">{totalCount}</span> results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      icon={<ChevronLeft className="h-4 w-4" />}
                    >
                      Previous
                    </Button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "primary" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      icon={<ChevronRight className="h-4 w-4" />}
                    >
                      Next
                    </Button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PolicyAuditViewer;