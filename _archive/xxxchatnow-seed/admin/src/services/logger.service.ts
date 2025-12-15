import { APIRequest } from './api-request';

export class LoggerService extends APIRequest {
  findHttpExceptionLogs(query: Record<string, any> = {}) {
    return this.get(
      this.buildUrl('/admin/logger/http-exception-logs', query)
    );
  }

  findRequestLogs(query: Record<string, any> = {}) {
    return this.get(
      this.buildUrl('/admin/logger/request-logs', query)
    );
  }

  findSystemLogs(query: Record<string, any> = {}) {
    return this.get(
      this.buildUrl('/admin/logger/system-logs', query)
    );
  }
}

export const loggerService = new LoggerService();
