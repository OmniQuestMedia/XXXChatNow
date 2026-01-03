import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createHash } from 'crypto';
import { TipActivatedEventLog } from '../schemas';
import { TipActivatedDto } from '../dtos';

/**
 * Service for managing TipActivated event persistence and idempotency
 */
@Injectable()
export class TipActivatedEventLogService {
  private readonly logger = new Logger(TipActivatedEventLogService.name);

  constructor(
    @InjectModel(TipActivatedEventLog.name)
    private readonly eventLogModel: Model<TipActivatedEventLog>
  ) {}

  /**
   * Check if an event has already been emitted for this tipId
   * @param tipId The tip transaction ID
   * @returns true if event already exists, false otherwise
   */
  async hasEventBeenEmitted(tipId: string): Promise<boolean> {
    const existing = await this.eventLogModel.findOne({ tipId }).lean();
    return !!existing;
  }

  /**
   * Create a hash of the payload for integrity verification
   * @param payload The TipActivated event payload
   * @returns SHA256 hash of the payload
   */
  private createPayloadHash(payload: TipActivatedDto): string {
    const data = JSON.stringify({
      tipId: payload.tipId,
      userId: payload.userId,
      performerId: payload.performerId,
      amount: payload.amount,
      ledger: payload.ledger
    });
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Persist a TipActivated event to the log
   * This implements idempotency - if an event for this tipId already exists, this is a no-op
   * 
   * @param eventId Unique event ID (UUID)
   * @param payload The TipActivated event payload
   * @returns true if event was persisted, false if it already existed (idempotent)
   */
  async persistEvent(eventId: string, payload: TipActivatedDto): Promise<boolean> {
    try {
      // Check idempotency first
      const alreadyExists = await this.hasEventBeenEmitted(payload.tipId);
      if (alreadyExists) {
        this.logger.log(`Event already exists for tipId: ${payload.tipId}. Skipping (idempotent).`);
        return false;
      }

      const payloadHash = this.createPayloadHash(payload);

      const eventLog = new this.eventLogModel({
        tipId: payload.tipId,
        eventId,
        ledgerId: payload.ledger.ledgerId,
        sourceRef: payload.ledger.sourceRef,
        postedAt: new Date(payload.ledger.postedAt),
        payloadHash,
        createdAt: new Date()
      });

      await eventLog.save();
      
      this.logger.log(
        `Persisted TipActivated event: tipId=${payload.tipId}, ` +
        `eventId=${eventId}, ledgerId=${payload.ledger.ledgerId}`
      );

      return true;
    } catch (error) {
      // If we get a duplicate key error (E11000), it means another process
      // already created this event (race condition). This is still idempotent.
      if (error.code === 11000) {
        this.logger.log(
          `Duplicate key detected for tipId: ${payload.tipId}. ` +
          `Another process already persisted this event (idempotent).`
        );
        return false;
      }

      this.logger.error(
        `Failed to persist event for tipId: ${payload.tipId}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get event log by tipId
   * @param tipId The tip transaction ID
   * @returns The event log record or null if not found
   */
  async getEventByTipId(tipId: string): Promise<TipActivatedEventLog | null> {
    return this.eventLogModel.findOne({ tipId }).lean();
  }

  /**
   * Get event log by ledgerId
   * @param ledgerId The RRR ledger entry ID
   * @returns The event log record or null if not found
   */
  async getEventByLedgerId(ledgerId: string): Promise<TipActivatedEventLog | null> {
    return this.eventLogModel.findOne({ ledgerId }).lean();
  }
}
