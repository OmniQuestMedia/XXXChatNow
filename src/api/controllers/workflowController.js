/**
 * Controller for workflow management endpoints
 * Handles HTTP requests and responses for workflow operations
 */

const WorkflowService = require('../services/workflowService');

class WorkflowController {
  /**
   * Get inactive workflow runs
   * GET /api/workflows/inactive
   */
  async getInactiveWorkflows(req, res) {
    try {
      const { owner, repo, inactivityDays } = req.query;

      if (!owner || !repo) {
        return res.status(400).json({
          error: 'Missing required parameters: owner and repo',
        });
      }

      const githubToken = req.headers.authorization?.replace('Bearer ', '');
      if (!githubToken) {
        return res.status(401).json({
          error: 'GitHub token required in Authorization header',
        });
      }

      const workflowService = new WorkflowService(githubToken);
      const inactiveRuns = await workflowService.getInactiveWorkflowRuns(
        owner,
        repo,
        inactivityDays ? parseInt(inactivityDays, 10) : null
      );

      return res.status(200).json({
        success: true,
        count: inactiveRuns.length,
        workflows: inactiveRuns.map(run => ({
          id: run.id,
          name: run.name,
          status: run.status,
          conclusion: run.conclusion,
          created_at: run.created_at,
          updated_at: run.updated_at,
          html_url: run.html_url,
        })),
      });
    } catch (error) {
      console.error('Error fetching inactive workflows:', error);
      return res.status(500).json({
        error: 'Failed to fetch inactive workflows',
        message: error.message,
      });
    }
  }

  /**
   * Delete a specific workflow run
   * DELETE /api/workflows/:owner/:repo/runs/:runId
   */
  async deleteWorkflowRun(req, res) {
    try {
      const { owner, repo, runId } = req.params;

      if (!owner || !repo || !runId) {
        return res.status(400).json({
          error: 'Missing required parameters: owner, repo, and runId',
        });
      }

      const githubToken = req.headers.authorization?.replace('Bearer ', '');
      if (!githubToken) {
        return res.status(401).json({
          error: 'GitHub token required in Authorization header',
        });
      }

      const workflowService = new WorkflowService(githubToken);
      const result = await workflowService.deleteWorkflowRun(
        owner,
        repo,
        parseInt(runId, 10)
      );

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Error deleting workflow run:', error);
      return res.status(500).json({
        error: 'Failed to delete workflow run',
        message: error.message,
      });
    }
  }

  /**
   * Delete multiple workflow runs
   * POST /api/workflows/:owner/:repo/runs/delete
   */
  async deleteMultipleWorkflowRuns(req, res) {
    try {
      const { owner, repo } = req.params;
      const { runIds } = req.body;

      if (!owner || !repo) {
        return res.status(400).json({
          error: 'Missing required parameters: owner and repo',
        });
      }

      if (!runIds || !Array.isArray(runIds) || runIds.length === 0) {
        return res.status(400).json({
          error: 'runIds must be a non-empty array',
        });
      }

      const githubToken = req.headers.authorization?.replace('Bearer ', '');
      if (!githubToken) {
        return res.status(401).json({
          error: 'GitHub token required in Authorization header',
        });
      }

      const workflowService = new WorkflowService(githubToken);
      const results = await workflowService.deleteMultipleWorkflowRuns(
        owner,
        repo,
        runIds
      );

      return res.status(200).json({
        success: true,
        ...results,
      });
    } catch (error) {
      console.error('Error deleting multiple workflow runs:', error);
      return res.status(500).json({
        error: 'Failed to delete multiple workflow runs',
        message: error.message,
      });
    }
  }

  /**
   * Cleanup all inactive workflows
   * POST /api/workflows/:owner/:repo/cleanup
   */
  async cleanupInactiveWorkflows(req, res) {
    try {
      const { owner, repo } = req.params;
      const { inactivityDays } = req.body;

      if (!owner || !repo) {
        return res.status(400).json({
          error: 'Missing required parameters: owner and repo',
        });
      }

      const githubToken = req.headers.authorization?.replace('Bearer ', '');
      if (!githubToken) {
        return res.status(401).json({
          error: 'GitHub token required in Authorization header',
        });
      }

      const workflowService = new WorkflowService(githubToken);
      const results = await workflowService.cleanupInactiveWorkflows(
        owner,
        repo,
        inactivityDays ? parseInt(inactivityDays, 10) : null
      );

      return res.status(200).json({
        success: true,
        ...results,
      });
    } catch (error) {
      console.error('Error cleaning up inactive workflows:', error);
      return res.status(500).json({
        error: 'Failed to cleanup inactive workflows',
        message: error.message,
      });
    }
  }

  /**
   * Disable a workflow
   * POST /api/workflows/:owner/:repo/:workflowId/disable
   */
  async disableWorkflow(req, res) {
    try {
      const { owner, repo, workflowId } = req.params;

      if (!owner || !repo || !workflowId) {
        return res.status(400).json({
          error: 'Missing required parameters: owner, repo, and workflowId',
        });
      }

      const githubToken = req.headers.authorization?.replace('Bearer ', '');
      if (!githubToken) {
        return res.status(401).json({
          error: 'GitHub token required in Authorization header',
        });
      }

      const workflowService = new WorkflowService(githubToken);
      const result = await workflowService.disableWorkflow(
        owner,
        repo,
        workflowId
      );

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Error disabling workflow:', error);
      return res.status(500).json({
        error: 'Failed to disable workflow',
        message: error.message,
      });
    }
  }

  /**
   * Enable a workflow
   * POST /api/workflows/:owner/:repo/:workflowId/enable
   */
  async enableWorkflow(req, res) {
    try {
      const { owner, repo, workflowId } = req.params;

      if (!owner || !repo || !workflowId) {
        return res.status(400).json({
          error: 'Missing required parameters: owner, repo, and workflowId',
        });
      }

      const githubToken = req.headers.authorization?.replace('Bearer ', '');
      if (!githubToken) {
        return res.status(401).json({
          error: 'GitHub token required in Authorization header',
        });
      }

      const workflowService = new WorkflowService(githubToken);
      const result = await workflowService.enableWorkflow(
        owner,
        repo,
        workflowId
      );

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Error enabling workflow:', error);
      return res.status(500).json({
        error: 'Failed to enable workflow',
        message: error.message,
      });
    }
  }

  /**
   * List all workflows
   * GET /api/workflows/:owner/:repo
   */
  async listWorkflows(req, res) {
    try {
      const { owner, repo } = req.params;

      if (!owner || !repo) {
        return res.status(400).json({
          error: 'Missing required parameters: owner and repo',
        });
      }

      const githubToken = req.headers.authorization?.replace('Bearer ', '');
      if (!githubToken) {
        return res.status(401).json({
          error: 'GitHub token required in Authorization header',
        });
      }

      const workflowService = new WorkflowService(githubToken);
      const workflows = await workflowService.listWorkflows(owner, repo);

      return res.status(200).json({
        success: true,
        count: workflows.length,
        workflows: workflows.map(workflow => ({
          id: workflow.id,
          name: workflow.name,
          path: workflow.path,
          state: workflow.state,
          created_at: workflow.created_at,
          updated_at: workflow.updated_at,
          html_url: workflow.html_url,
        })),
      });
    } catch (error) {
      console.error('Error listing workflows:', error);
      return res.status(500).json({
        error: 'Failed to list workflows',
        message: error.message,
      });
    }
  }
}

module.exports = new WorkflowController();
