import { Injectable, OnModuleInit } from '@nestjs/common';
import { AgendaService } from 'src/kernel/infras/agenda';
import * as Agenda from 'agenda';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import { DBLoggerService } from 'src/modules/logger';
import { PerformerService } from '../services';

export const CHECK_ONLINE_STATUS_SCHEDULE = 'CHECK_ONLINE_STATUS_SCHEDULE';

@Injectable()
export class PerformerTask implements OnModuleInit {
  constructor(
    private readonly agendaService: AgendaService,
    private readonly socketUserService: SocketUserService,
    private readonly performerService: PerformerService,
    private readonly logger: DBLoggerService
  ) {
  }

  onModuleInit() {
    this.defineJobs();
  }

  private async defineJobs() {
    const collection = (this.agendaService as any)._collection;
    await collection.deleteMany({
      name: {
        $in: [CHECK_ONLINE_STATUS_SCHEDULE]
      }
    });

    this.agendaService.define(
      CHECK_ONLINE_STATUS_SCHEDULE,
      {},
      this.modelOnlineStatusHandler.bind(this)
    );
    this.agendaService.schedule('10 seconds from now', CHECK_ONLINE_STATUS_SCHEDULE, {});
  }

  async modelOnlineStatusHandler(
    job: Agenda.Job<any>,
    done: (err?: Error) => void
  ) {
    try {
      const query = job.attrs.data;
      const onlinePerformers = await this.performerService.find({
        ...query,
        isOnline: true
      });
      if (!onlinePerformers.length) {
        return;
      }

      await onlinePerformers.reduce(async (lp, performer) => {
        await lp;

        const connectedSocketIds = await this.socketUserService.getUserSocketIds(performer._id.toString());

        let offline = true;
        await connectedSocketIds.reduce(async (spm, sId) => {
          await spm;
          // remove unconencted socket
          if (!this.socketUserService.hasConnected(sId)) {
            await this.socketUserService.removeConnection(performer._id.toString(), sId);
          } else {
            offline = false;
          }
        }, Promise.resolve());

        if (!offline) {
          return Promise.resolve();
        }
        return this.performerService.offline(performer._id);
      }, Promise.resolve());
    } catch (err) {
      this.logger.error(err.stack || err, {
        context: 'PerformerTask'
      });
    } finally {
      await job.remove();
      this.agendaService.schedule('1 minute from now', CHECK_ONLINE_STATUS_SCHEDULE, {});
      typeof done === 'function' && done();
    }
  }
}
