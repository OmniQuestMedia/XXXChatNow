/**
 * Routes for workflow management API
 */

const express = require('express');
const workflowController = require('../controllers/workflowController');

const router = express.Router();

/**
 * @route GET /api/workflows/inactive
 * @desc Get inactive workflow runs
 * @query owner - Repository owner (required)
 * @query repo - Repository name (required)
 * @query inactivityDays - Custom inactivity threshold in days (optional)
 * @access Authenticated (requires GitHub token in Authorization header)
 */
router.get('/inactive', workflowController.getInactiveWorkflows);

/**
 * @route GET /api/workflows/:owner/:repo
 * @desc List all workflows in a repository
 * @param owner - Repository owner
 * @param repo - Repository name
 * @access Authenticated (requires GitHub token in Authorization header)
 */
router.get('/:owner/:repo', workflowController.listWorkflows);

/**
 * @route DELETE /api/workflows/:owner/:repo/runs/:runId
 * @desc Delete a specific workflow run
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param runId - Workflow run ID
 * @access Authenticated (requires GitHub token in Authorization header)
 */
router.delete('/:owner/:repo/runs/:runId', workflowController.deleteWorkflowRun);

/**
 * @route POST /api/workflows/:owner/:repo/runs/delete
 * @desc Delete multiple workflow runs
 * @param owner - Repository owner
 * @param repo - Repository name
 * @body runIds - Array of workflow run IDs to delete
 * @access Authenticated (requires GitHub token in Authorization header)
 */
router.post('/:owner/:repo/runs/delete', workflowController.deleteMultipleWorkflowRuns);

/**
 * @route POST /api/workflows/:owner/:repo/cleanup
 * @desc Cleanup all inactive workflows
 * @param owner - Repository owner
 * @param repo - Repository name
 * @body inactivityDays - Custom inactivity threshold in days (optional)
 * @access Authenticated (requires GitHub token in Authorization header)
 */
router.post('/:owner/:repo/cleanup', workflowController.cleanupInactiveWorkflows);

/**
 * @route POST /api/workflows/:owner/:repo/:workflowId/disable
 * @desc Disable a workflow
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param workflowId - Workflow ID or filename
 * @access Authenticated (requires GitHub token in Authorization header)
 */
router.post('/:owner/:repo/:workflowId/disable', workflowController.disableWorkflow);

/**
 * @route POST /api/workflows/:owner/:repo/:workflowId/enable
 * @desc Enable a workflow
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param workflowId - Workflow ID or filename
 * @access Authenticated (requires GitHub token in Authorization header)
 */
router.post('/:owner/:repo/:workflowId/enable', workflowController.enableWorkflow);

module.exports = router;
