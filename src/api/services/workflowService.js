/**
 * Service for managing GitHub Actions workflows
 * Handles interaction with GitHub API for workflow operations
 */

const { Octokit } = require('@octokit/rest');
const config = require('../config/workflows.config');

class WorkflowService {
  constructor(githubToken) {
    if (!githubToken) {
      throw new Error('GitHub token is required');
    }
    
    this.octokit = new Octokit({
      auth: githubToken,
      baseUrl: config.github.baseUrl,
    });
  }

  /**
   * Get all workflow runs for a repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {Object} options - Additional options (per_page, page, status)
   * @returns {Promise<Array>} List of workflow runs
   */
  async getWorkflowRuns(owner, repo, options = {}) {
    try {
      const params = {
        owner,
        repo,
        per_page: options.per_page || config.maxWorkflowRunsPerPage,
        page: options.page || 1,
      };

      if (options.status) {
        params.status = options.status;
      }

      const response = await this.octokit.actions.listWorkflowRunsForRepo(params);
      return response.data.workflow_runs;
    } catch (error) {
      throw new Error(`Failed to fetch workflow runs: ${error.message}`);
    }
  }

  /**
   * Identify inactive workflow runs based on last update time
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} inactivityDays - Number of days to consider as inactive
   * @returns {Promise<Array>} List of inactive workflow runs
   */
  async getInactiveWorkflowRuns(owner, repo, inactivityDays = null) {
    const threshold = inactivityDays || config.inactivityThresholdDays;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - threshold);

    const allRuns = await this.getWorkflowRuns(owner, repo);
    
    return allRuns.filter(run => {
      const updatedAt = new Date(run.updated_at);
      return updatedAt < cutoffDate && config.cleanupStatuses.includes(run.status);
    });
  }

  /**
   * Delete a workflow run
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} runId - Workflow run ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteWorkflowRun(owner, repo, runId) {
    try {
      await this.octokit.actions.deleteWorkflowRun({
        owner,
        repo,
        run_id: runId,
      });
      
      return {
        success: true,
        runId,
        message: 'Workflow run deleted successfully',
      };
    } catch (error) {
      throw new Error(`Failed to delete workflow run ${runId}: ${error.message}`);
    }
  }

  /**
   * Delete multiple inactive workflow runs
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {Array<number>} runIds - Array of workflow run IDs to delete
   * @returns {Promise<Object>} Summary of deletion results
   */
  async deleteMultipleWorkflowRuns(owner, repo, runIds) {
    const results = {
      successful: [],
      failed: [],
      total: runIds.length,
    };

    for (const runId of runIds) {
      try {
        await this.deleteWorkflowRun(owner, repo, runId);
        results.successful.push(runId);
      } catch (error) {
        results.failed.push({
          runId,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Delete all inactive workflow runs for a repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} inactivityDays - Optional custom inactivity threshold
   * @returns {Promise<Object>} Summary of deletion results
   */
  async cleanupInactiveWorkflows(owner, repo, inactivityDays = null) {
    const inactiveRuns = await this.getInactiveWorkflowRuns(owner, repo, inactivityDays);
    
    if (inactiveRuns.length === 0) {
      return {
        message: 'No inactive workflow runs found',
        total: 0,
        successful: [],
        failed: [],
      };
    }

    const runIds = inactiveRuns.map(run => run.id);
    const results = await this.deleteMultipleWorkflowRuns(owner, repo, runIds);
    
    return {
      message: `Cleanup completed: ${results.successful.length} deleted, ${results.failed.length} failed`,
      ...results,
    };
  }

  /**
   * Disable a workflow
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} workflowId - Workflow ID or filename
   * @returns {Promise<Object>} Result
   */
  async disableWorkflow(owner, repo, workflowId) {
    try {
      await this.octokit.actions.disableWorkflow({
        owner,
        repo,
        workflow_id: workflowId,
      });
      
      return {
        success: true,
        workflowId,
        message: 'Workflow disabled successfully',
      };
    } catch (error) {
      throw new Error(`Failed to disable workflow ${workflowId}: ${error.message}`);
    }
  }

  /**
   * Enable a workflow
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} workflowId - Workflow ID or filename
   * @returns {Promise<Object>} Result
   */
  async enableWorkflow(owner, repo, workflowId) {
    try {
      await this.octokit.actions.enableWorkflow({
        owner,
        repo,
        workflow_id: workflowId,
      });
      
      return {
        success: true,
        workflowId,
        message: 'Workflow enabled successfully',
      };
    } catch (error) {
      throw new Error(`Failed to enable workflow ${workflowId}: ${error.message}`);
    }
  }

  /**
   * List all workflows in a repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Array>} List of workflows
   */
  async listWorkflows(owner, repo) {
    try {
      const response = await this.octokit.actions.listRepoWorkflows({
        owner,
        repo,
      });
      
      return response.data.workflows;
    } catch (error) {
      throw new Error(`Failed to list workflows: ${error.message}`);
    }
  }
}

module.exports = WorkflowService;
