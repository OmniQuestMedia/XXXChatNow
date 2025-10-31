import {
  Injectable, Logger, OnModuleInit
} from '@nestjs/common';
import { QueueEvent, QueueEventService } from 'src/kernel';
import { EVENT } from 'src/kernel/constants';
import { ConversationService } from 'src/modules/message/services';
import { Model } from 'mongoose';
import { findLastIndex } from 'lodash';
import { generateUuid } from 'src/kernel/helpers/string.helper';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import { InjectModel } from '@nestjs/mongoose';
import { STREAM_GOAL_CHANNEL } from '../constant';
import { StreamGoalsService } from '../services';
import { Goal } from '../dtos';
import { StreamGoal } from '../schemas';

const TIPPING_PERFORMER_SUCCESS = 'TIPPING_PERFORMER_SUCCESS';

@Injectable()
export class StreamGoalListener implements OnModuleInit {
  private logger = new Logger(StreamGoalListener.name);

  constructor(
    @InjectModel(StreamGoal.name) private readonly streamGoal: Model<StreamGoal>,

    private readonly streamGoalService: StreamGoalsService,
    private readonly conversationService: ConversationService,
    private readonly queueEventService: QueueEventService,
    private readonly socketUserService: SocketUserService
  ) {}

  onModuleInit() {
    this.queueEventService.subscribe(
      STREAM_GOAL_CHANNEL,
      TIPPING_PERFORMER_SUCCESS,
      this.subscriber.bind(this)
    );
  }

  async subscriber(event: QueueEvent) {
    try {
      const {
        eventName,
        data: { conversationId, token = 0 }
      } = event;
      if (eventName !== EVENT.CREATED || !conversationId || token <= 0) return;
      const conversation = await this.conversationService.findById(
        conversationId
      );
      if (!conversation) return;
      if (conversation.streamId) {
        const streamGoal = await this.streamGoal.findOne({ streamId: conversation.streamId });
        if (!streamGoal) return;

        await this.streamGoalService.updateRemainBalance(conversation.streamId, token);

        const arr = streamGoal.goals.sort((a, b) => a.token > b.token) as Goal[];
        const index = findLastIndex(arr, ((x) => x.token <= streamGoal.remainToken));
        const next = findLastIndex(arr, ((x) => x.token <= streamGoal.remainToken + token));

        if (next > index) {
          const message = {
            conversationId: conversation._id,
            _id: generateUuid(),
            text: `&#128681 Goal #${arr[next].ordering} - ${arr[next].name} reached`,
            type: 'notification'
          };

          await Promise.all([
            conversation
              && this.socketUserService.emitToRoom(
                this.conversationService.serializeConversation(
                  conversation._id,
                  conversation.type
                ),
                `message_created_conversation_${conversation._id}`,
                message
              )
          ]);
        }
      }
    } catch (e) {
      this.logger.error(e);
    }
  }
}
