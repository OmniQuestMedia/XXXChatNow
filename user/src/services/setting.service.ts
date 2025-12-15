import { ISetting } from 'src/interfaces';

import { APIRequest, IResponse } from './api-request';

export class SettingService extends APIRequest {
  all(group = ''): Promise<IResponse<ISetting>> {
    return this.get(this.buildUrl('/settings/public', { group }));
  }

  valueByKeys(keys: string[]): Promise<IResponse<any>> {
    return this.post('/settings/keys', { keys });
  }

  menus() {
    return this.get('/menus');
  }
}

export const settingService = new SettingService();
