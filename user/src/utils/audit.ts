/**
 * Audit Logging Utility
 * 
 * Client-side utility for logging sensitive operations to the audit API.
 * Must be called before any menu-triggered sensitive flow.
 * 
 * Security:
 * - NEVER logs PII (names, emails, addresses, payment details)
 * - NEVER logs sensitive values (tokens, passwords, balances)
 * - Only logs action type, menuKey, and non-sensitive metadata
 * 
 * Usage Examples:
 * ```typescript
 * // Slot machine spin
 * await logAuditEvent('slot-machine-spin', 'games', { betAmount: 10 });
 * 
 * // Redeem points
 * await logAuditEvent('redeem-points', 'loyalty', { pointsAmount: 100 });
 * 
 * // Admin operation
 * await logAuditEvent('admin-update-user', 'admin-users', { action: 'suspend' });
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
   * @param action - Action type (e.g., 'slot-machine-spin', 'redeem-points')
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
      'fullName'
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
 * Log an audit event for a sensitive operation
 * 
 * Call this function when a menu action triggers:
 * - Game launches (slot machine, wheel spin)
 * - Point redemptions
 * - Admin operations
 * - Financial transactions
 * - Any state-changing sensitive flow
 * 
 * @param action - Action identifier (e.g., 'slot-machine-spin')
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
