import { HttpException, Injectable } from '@nestjs/common';
import {
  EntityNotFoundException, QueueService, SearchRequest, StringHelper
} from 'src/kernel';
import { createTransport } from 'nodemailer';
import { SettingService } from 'src/modules/settings';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { render } from 'mustache';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { DBLoggerService } from 'src/modules/logger';
import { IMail } from '../interfaces';
import { EmailTemplateUpdatePayload } from '../payloads/email-template-update.payload';
import { EmailTemplate } from '../schemas/email-template.schema';

const TEMPLATE_DIR = join(process.env.TEMPLATE_DIR, 'emails');
@Injectable()
export class MailerService {
  private mailerQueue;

  constructor(
    @InjectModel(EmailTemplate.name) private readonly EmailTemplateModel: Model<EmailTemplate>,
    private readonly queueService: QueueService,
    private readonly logger: DBLoggerService
  ) {
    this.init();
  }

  private async init() {
    this.mailerQueue = this.queueService.createInstance('MAILER_QUEUE');
    this.mailerQueue.process(
      process.env.MAILER_CONCURRENCY || 1,
      this.process.bind(this)
    );
  }

  private async getTransport() {
    const host = SettingService.getValueByKey(SETTING_KEYS.SMTP_TRANSPORTER_HOST);
    const port = SettingService.getValueByKey(SETTING_KEYS.SMTP_TRANSPORTER_PORT);
    const user = SettingService.getValueByKey(SETTING_KEYS.SMTP_TRANSPORTER_USERNAME);
    const pass = SettingService.getValueByKey(SETTING_KEYS.SMTP_TRANSPORTER_PASSWORD);
    const secure = SettingService.getValueByKey(SETTING_KEYS.SMTP_TRANSPORTER_SECURE);
    if (!host || !port || !user || !pass) {
      throw new HttpException('Invalid confirguration!', 400);
    }

    return createTransport({
      host, port: parseInt(port, 10), secure: !!secure, auth: { user, pass }, tls: { rejectUnauthorized: false }
    });
  }

  private async getTemplate(template = 'default', isLayout = false): Promise<string> {
    const layout = await this.EmailTemplateModel.findOne({
      key: isLayout ? `layouts/${template}` : template
    });
    if (layout) return layout.content;

    // eslint-disable-next-line no-param-reassign
    template = StringHelper.getFileName(template, true);

    if (template === 'blank') {
      return isLayout ? '[[BODY]]' : '';
    }

    const layoutFile = isLayout ? join(TEMPLATE_DIR, 'layouts', `${template}.html`) : join(TEMPLATE_DIR, `${template}.html`);
    if (!existsSync(layoutFile)) {
      return isLayout ? '[[BODY]]' : '';
    }

    return readFileSync(layoutFile, 'utf8');
  }

  private async process(job: any, done: Function) {
    try {
      const transport = await this.getTransport();
      const data = job.data as IMail;
      let { html } = data;
      let layout = '[[BODY]]';
      let subject = '';
      if (!html && data.template) {
        // html = await this.getTemplate(data.template);
        const template = await this.EmailTemplateModel.findOne({
          key: {
            $in: [
              data.template,
              `${data.template}.html`
            ]
          }
        });
        if (!template) {
          html = '';
          layout = await this.getTemplate(data.layout, true);
        } else {
          html = template.content;
          subject = template.subject;
          layout = template.layout ? await this.getTemplate(template.layout, true) : '[[BODY]]';
        }
      }
      const settings = SettingService._settingCache;
      const siteName = SettingService.getValueByKey(SETTING_KEYS.SITE_NAME);
      const logoUrl = SettingService.getValueByKey(SETTING_KEYS.LOGO_URL);

      const body = html ? render(html, {
        ...data.data,
        siteName: siteName || process.env.SITENAME || process.env.DOMAIN,
        logoUrl,
        settings: settings ? { ...settings } : {}
      }) : '';
      const subjectHtml = render(subject || data.subject, {
        ...data.data,
        settings: settings ? { ...settings } : {}
      }) || subject || data.subject;

      html = render(layout, {
        siteName: siteName || process.env.SITENAME || process.env.DOMAIN,
        logoUrl,
        subject: subjectHtml
      }).replace('[[BODY]]', body);
      const senderConfig = SettingService.getValueByKey(SETTING_KEYS.SENDER_EMAIL);
      const senderEmail = senderConfig || process.env.SENDER_EMAIL;
      await transport.sendMail({
        from: senderEmail,
        to: Array.isArray(data.to) ? data.to.join(',') : data.to,
        cc: Array.isArray(data.cc) ? data.cc.join(',') : data.cc,
        bcc: Array.isArray(data.cc) ? data.cc.join(',') : data.cc,
        subject: subject || data.subject,
        html
      });
    } catch (e) {
      this.logger.error(e.stack || e);
    } finally {
      done();
    }
  }

  public async send(email: IMail) {
    await this.mailerQueue.createJob(email).save();
  }

  public async verify() {
    try {
      const transport = await this.getTransport();
      const siteName = SettingService.getValueByKey(SETTING_KEYS.SITE_NAME) || process.env.DOMAIN;
      const senderEmail = SettingService.getValueByKey(SETTING_KEYS.SENDER_EMAIL) || process.env.SENDER_EMAIL;
      const adminEmail = SettingService.getValueByKey(SETTING_KEYS.ADMIN_EMAIL) || process.env.ADMIN_EMAIL;
      return transport.sendMail({
        from: senderEmail,
        to: adminEmail,
        subject: `Test email ${siteName}`,
        html: 'Hello, this is test email!'
      });
    } catch (e) {
      return {
        hasError: true,
        error: e
      };
    }
  }

  public async getAllTemplates(req: SearchRequest) {
    const query = {} as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ''),
        'i'
      );
      query.$or = [
        {
          name: { $regex: regexp }
        },
        {
          subject: { $regex: regexp }
        }
      ];
    }
    let sort = {};
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    return this.EmailTemplateModel.find(query).sort(sort).lean();
  }

  public async findOne(id: string) {
    return this.EmailTemplateModel.findById(id).lean();
  }

  public async updateTemplate(id: string, payload: EmailTemplateUpdatePayload) {
    const template = await this.EmailTemplateModel.findById(id);
    if (!template) throw new EntityNotFoundException();

    template.subject = payload.subject;
    template.content = payload.content;
    template.layout = payload.layout;
    template.updatedAt = new Date();
    return template.save();
  }
}
