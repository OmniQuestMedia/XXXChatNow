import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { QueueEventService, QueueEvent } from 'src/kernel';
import {
  ACCEPT_SPIN_WHEEL_CHANNEL
} from 'src/modules/payment/constants';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import { EVENT } from 'src/kernel/constants';
import { ConversationService } from 'src/modules/message/services';
import { generateUuid } from 'src/kernel/helpers/string.helper';
import { PurchaseItemService } from '../services';

const ACCEPT_SPIN_WHEEL = 'ACCEPT_SPIN_WHEEL';

@Injectable()
export class AcceptSpinWheelListener {
  constructor(
    private readonly socketUserService: SocketUserService,
    @Inject(forwardRef(() => PurchaseItemService))
    private readonly purchaseItemService: PurchaseItemService,
    private readonly queueEventService: QueueEventService,
    private readonly conversationService: ConversationService
  ) {
    this.queueEventService.subscribe(
      ACCEPT_SPIN_WHEEL_CHANNEL,
      ACCEPT_SPIN_WHEEL,
      this.handleListen.bind(this)
    );
  }

  public async handleListen(
    event: QueueEvent
  ): Promise<any> {
    if (event.eventName === EVENT.CREATED) {
      const [conversation] = await Promise.all([
        event.data.conversationId && this.conversationService.findById(event.data.conversationId)
      ]);
      if (!conversation) return;

      await this.socketUserService.emitToRoom(
        this.conversationService.serializeConversation(conversation._id, conversation.type),
        `message_created_conversation_${conversation._id}`,
        {
          text: event.data.name,
          _id: generateUuid(),
          conversationId: conversation._id,
          isSystem: true,
          type: 'accept-wheel',
          performerId:  event.data.performerId,
          wheelResultId: event.data.wheelResultId
        });
        return;
    }
    if (event.eventName !== 'accepted') return;

    await this.purchaseItemService.spinWheel(event.data);
  }
}