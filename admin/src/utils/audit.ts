/**
 * Audit Logging Utility (Admin)
 * 
 * Admin-side utility for logging sensitive operations to the audit API.
 * Must be called before any admin menu-triggered sensitive flow.
 * 
 * Security:
 * - NEVER logs PII (names, emails, addresses, payment details)
 * - NEVER logs sensitive values (tokens, passwords, balances)
 * - Only logs action type, menuKey, and non-sensitive metadata
 * 
 * Usage Examples:
 * ```typescript
 * // User suspension
 * await logAuditEvent('admin-suspend-user', 'admin-users', { reason: 'violation' });
 * 
 * // Configuration change
 * await logAuditEvent('admin-update-config', 'admin-settings', { section: 'billing' });
 * 
 * // Payout approval
 * await logAuditEvent('admin-approve-payout', 'admin-payouts', { status: 'approved' });
 * ```
 * 
 * References:
 * - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md
 * - DECISIONS.md (Audit requirements)
 */

import { APIRequest } from '../services/api-request';

export interface AuditEventData {
  action: string;
  menuKey?: string;
  metadata?: Record<string, any>;
}

class AuditService extends APIRequest {
  /**
   * Log an audit event to the API
   * 
   * @param action - Action type (e.g., 'admin-suspend-user', 'admin-update-config')
   * @param menuKey - Optional menu identifier that triggered the action
   * @param metadata - Optional non-sensitive metadata (no PII, no sensitive values)
   * @returns Promise resolving to the API response
   * 
   * @throws Error if API call fails
   */
  async logEvent(
    action: string,
    menuKey?: string,
    metadata?: Record<string, any>
  ): Promise<any> {
    // Validate no PII or sensitive data in metadata
    if (metadata) {
      const sanitized = this.sanitizeMetadata(metadata);
      return this.post('/audit/event', {
        action,
        menuKey,
        metadata: sanitized
      });
    }

    return this.post('/audit/event', {
      action,
      menuKey
    });
  }

  /**
   * Sanitize metadata to ensure no PII or sensitive data
   * Removes fields that commonly contain sensitive information
   */
  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'apiKey',
      'email',
      'phone',
      'address',
      'ssn',
      'creditCard',
      'cardNumber',
      'cvv',
      'pin',
      'balance',
      'amount',
      'payout',
      'earnings',
      'name',
      'firstName',
      'lastName',
      'fullName',
      'userId',
      'username',
      'ip',
      'ipAddress'
    ];

    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(metadata)) {
      const lowerKey = key.toLowerCase();
      
      // Skip if key contains sensitive terms
      const isSensitive = sensitiveKeys.some(term => 
        lowerKey.includes(term.toLowerCase())
      );
      
      if (!isSensitive && value !== null && value !== undefined) {
        // Only include primitive types, not objects that might contain sensitive data
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          sanitized[key] = value;
        }
      }
    }

    return sanitized;
  }
}

const auditService = new AuditService();

/**
 * Log an audit event for a sensitive admin operation
 * 
 * Call this function when an admin menu action triggers:
 * - User management (suspend, ban, role changes)
 * - Payout approvals/rejections
 * - Configuration changes
 * - Financial adjustments
 * - Any privileged admin operation
 * 
 * @param action - Action identifier (e.g., 'admin-suspend-user')
 * @param menuKey - Optional menu identifier
 * @param metadata - Optional non-sensitive metadata
 */
export async function logAuditEvent(
  action: string,
  menuKey?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await auditService.logEvent(action, menuKey, metadata);
  } catch (error) {
    // Log error but don't block the operation
    console.error('Failed to log audit event:', error);
  }
}

export default auditService;
