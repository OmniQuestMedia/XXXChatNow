import { Injectable } from '@nestjs/common';
import * as firebase from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

import { SettingService } from 'src/modules/settings';
import { FIREBASE_SETTING_KEYS, PUSH_NOTIFICATION_TOPIC } from '../constants';
import { PushNotificationMessage } from '../payloads';

@Injectable()
export class PushNotificationService {
  constructor(
    private readonly settingService: SettingService
  ) { }

  async sendMessage(payload: PushNotificationMessage) {
    const alreadyCreatedAps = getApps();
    const [
      FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY
    ] = await Promise.all([
      this.settingService.getKeyValue(FIREBASE_SETTING_KEYS.FIREBASE_PROJECT_ID),
      this.settingService.getKeyValue(FIREBASE_SETTING_KEYS.FIREBASE_CLIENT_EMAIL),
      this.settingService.getKeyValue(FIREBASE_SETTING_KEYS.FIREBASE_PRIVATE_KEY)

    ]);
    const app = !alreadyCreatedAps.length ? firebase.initializeApp({

      credential: firebase.credential.cert({
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDI2zBqzrKS7Je+\nHBjh7mB09X8dp3i/yaxF9HzJ1iYTt//9PqQ7u4zR/dEbKqU8aNcjOntnOwcjg/QQ\nCWrbl7BEShKB0GNzXfAqNNm2xjmNQp8DkTquR5acGPwn2AljFhStD5pfjPNdSJ80\nSmZKrW6uMAjXo9JPxpIQkxindHdrCoi+imIrtvjqtPdFj9xBEhPPxR8WwL25F/fB\nkOvj14VrPPx+9FyG4mZkVbNgkkR5DEIgrrPctPL5eJQJEO8xmjqfb73suOpEf8b1\ncMz88uL2rJdb18s8GHCzrRczHJiMOF8KXDwXtWjGqBW9conOiJzNRmmnpnjHKpZ8\nOFnjQfWBAgMBAAECggEAY8zBUHi2sxk6xpvoYy5SIBsxV5c0gLsgzbuO26z7y3V0\nDS14ZjOo41hF88UrSAphx1/SHDdwsx1oAiXjwguraisR6g2UtKia4iXTfaUdyIov\nP5MEQL9SXuptNBD8jQ7WJC1qC4saCyI/9Lf4/qcRJRy58Ae2wqvMPM8SA3Zztauq\nvd6LTcxMu0LkuEDEa9sWq3wXlmKfdRTuOtmPtCGvYAB5lBTmmZaIxs297sgyHKo0\nk9bIyYjbhECM9et8xQhwn0F3iz2mod+HFAf9q5JJu5pN58kiWKF0d1Wovnfbxwuu\nH/tKzM5edTLW8rCU3wi7i2bCGqdPLp8tlspn8wc3LwKBgQD1YNcxI9Yn97lyPnW7\nRaEWzWUCYrKh5XARS2A2OqGq4Sb6t6anrq2FhN6L8k543N1obqOlpZTsXpqNKcyw\nCwYDQFHSTR4EGOujXjVwByQYrOgtBWhcWojXaDvHa8Qa32Yyr94ncimDV/J9kPH3\nC5sXBcQbLTHXEeMYKq47+aAMRwKBgQDRjPonDkHM1kpuIz0bhHbiYK5BZ7zCLAJI\nPNeBCL61LAMCQ/frbG1qeJ/P6mXcPwpn/Ejx1ydoS7lzAhb8df2rilLFdjhkCqEt\nhPoPOX0BA2ryYZszizsSDcuR0ptG4nn7HH8y3qLEcd8NHUYvWuEUvqaMXoMpP/dY\n2b265JB79wKBgFYAnSvR/auAffT2w1jh7LYLQ030vdtUiVTmcFBReHxl8b2KRNUc\nuiDEEyRFxw9BijCiJqVWRb4a4lx7vAwvsOnOz17APLb+7QgTavNa7WHgqHevH4bP\nDItDM0CQGum4Rx+Y2GpG7xnj50/vT39hB/inwrYrvv48fLXpr6vBsEDdAoGAQbrT\n2J5bO3JYRHXfPBtv4xBqeG+ewNVnHdufyYTBtTiJ9RL22CzZoVUW4/PlYZGQpQ94\nngtb/BYMpKuaJDSqjj1EO1Ya2B6RciLNASuKL2AwErlVInTg4YfcO/Bw7mop0v+c\nUouNSMtjKMzu7/m0snoe6dbXk3/SCVe7cL0zKP8CgYEAldwt/8CX2SUBh2i06QUg\nfM67GehrWdmUyIjBPis+mKfVZWC4oTNrdFjooVaz1q2jw6T/Z1r2UJz3nK/wQR7r\nfhgg79GrcGG/e4h859Gndg9CfgnUvMVio2J9V6VxUYgzvBFQTXJJVbeW+gBgGxrC\n4/tQncjvT/M9oLn9neRdo70=\n-----END PRIVATE KEY-----\n',
        projectId: FIREBASE_PROJECT_ID, // 'cathysol-portal',
        clientEmail: FIREBASE_CLIENT_EMAIL// 'firebase-adminsdk-s8oiz@cathysol-portal.iam.gserviceaccount.com'
      })
    }) : alreadyCreatedAps[0];

    const messaging = firebase.messaging(app);

    // to do create group/topic for type

    if (payload.type === 'user' || payload.type === 'performer') {
      messaging.send({
        data: {
          ...payload
        },
        // notification: {
        //   title: payload.title,
        //   body: payload.message
        // },
        topic: payload.type
      });
      return;
    }

    messaging.send({
      data: {
        ...payload
      },
      // notification: {
      //   title: payload.title,
      //   body: payload.message
      // },
      topic: PUSH_NOTIFICATION_TOPIC
    });
  }
}
