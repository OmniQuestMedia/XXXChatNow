/**
 * Configuration for workflow management API
 * Defines thresholds for identifying inactive workflows
 */

module.exports = {
  // Days of inactivity before a workflow is considered inactive
  inactivityThresholdDays: process.env.WORKFLOW_INACTIVITY_THRESHOLD_DAYS || 90,
  
  // Maximum number of workflow runs to fetch per request
  maxWorkflowRunsPerPage: process.env.MAX_WORKFLOW_RUNS_PER_PAGE || 100,
  
  // GitHub API configuration
  github: {
    apiVersion: '2022-11-28',
    baseUrl: process.env.GITHUB_API_BASE_URL || 'https://api.github.com',
  },
  
  // Workflow statuses considered for cleanup
  cleanupStatuses: ['completed', 'cancelled', 'failure', 'timed_out'],
  
  // Whether to actually delete or just mark for deletion (soft delete)
  softDelete: process.env.WORKFLOW_SOFT_DELETE === 'true' || false,
};
