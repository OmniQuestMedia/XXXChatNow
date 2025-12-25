import {
  ForbiddenException, Injectable, Logger, OnModuleInit
} from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, ObjectId } from 'mongoose';
import { UserDto } from 'src/modules/user/dtos';
import { EntityNotFoundException, QueueEvent, QueueEventService } from 'src/kernel';
import * as firebase from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
// import { PushNotificationToken, PushNotificationTokenDocument } from '../schemas';
import { SUBS_NOTIFICATION, SUBS_NOTIFICATION_TOPIC } from 'src/modules/auth/constants';
import { InjectModel } from '@nestjs/mongoose';
import { SettingService } from 'src/modules/settings';
import { PushNotificationTokenPayload, PushNotificationTokenSearchPayload } from '../payloads';
import { FIREBASE_SETTING_KEYS, PUSH_NOTIFICATION_TOPIC } from '../constants';
import { PushNotificationToken } from '../schemas';

@Injectable()
export class PushNotificationTokenService implements OnModuleInit {
  private readonly logger = new Logger(PushNotificationTokenService.name);

  constructor(
    @InjectModel(PushNotificationToken.name) private readonly PushNotificationTokenModel: Model<PushNotificationToken>,
    private readonly queueEventService: QueueEventService,
    private readonly settingService: SettingService
  ) {

  }

  onModuleInit() {
    this.queueEventService.subscribe(
      SUBS_NOTIFICATION,
      SUBS_NOTIFICATION_TOPIC,
      this.handleCreateSubsNotification.bind(this)
    );
  }

  public findById(id: string | ObjectId) {
    return this.PushNotificationTokenModel.findById(id);
  }

  public async create(payload: PushNotificationTokenPayload, currentUser: any) {
    const [
      FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY
    ] = await Promise.all([
      this.settingService.getKeyValue(FIREBASE_SETTING_KEYS.FIREBASE_PROJECT_ID),
      this.settingService.getKeyValue(FIREBASE_SETTING_KEYS.FIREBASE_CLIENT_EMAIL),
      this.settingService.getKeyValue(FIREBASE_SETTING_KEYS.FIREBASE_PRIVATE_KEY)

    ]);

    // const app = firebase.initializeApp({
    //   credential: firebase.credential.cert({
    //     // type: 'service_account',
    //     // project_id: 'xmodel-ffe3b',
    //     // private_key_id: '9cbd6dfd4e733e8312a91da832db646546bf1f97',
    //     // private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCqV1C02KIpyx8w\ntSPxol5ox2yLcZK6ZHm9ShOw8P5uPt8EDNi2Bx5FHI+T/A7/nabab+d1TWwQLTnb\nNXmW+mtiKfXuOIfXlzxsAGveOIWV+6e6fIZ976gyt3sOh71muAWj87f/5lN7zWCN\nt00JQ9rsS0bwhvTm3/KcKIxxb+G8+E0gIXUxCqai8h7tSrwif9Moa84cj9/KpsOI\n7Cr++49jWDjexmS4uVV/E4njaHb4srDS32OHrlkTTltwJieHQWLNBq83QyTH3N2z\ndofAVrkjYDdo8iJZZBGhEJNK+pCUFOKugXymWXMC2sC6rpSQuqcgFJRUCs0C7k1t\n+OfBFUCZAgMBAAECggEAB6ni/yfp79BsKFBV/CaOcc9bElD7RXiEw5/kD+dfww0A\nEpoTW+kpEvnseb9y20w3+Abl1nCzxmyKeFLJFCJTF3kE0AFqFyh+Nuuz7q0DUZKf\nYrP8hwjzu8hmeGph+o+X7V7nLdOqeNzuFaIkDKEpZc0jNWoU9ZgovZ7TZr0eXlaI\nrREajMHPJxQ22g3Pxc5aaO/NUtBa2ET6ga3ZB3FWOyx+XNN7RX93EQStLibmW4dG\nZjAYDB41Y1wSwTkpwHtAOooG8frnF1ZoMF/AH2i3qnT9PL0/zue9ZJFZ6ubye9N+\nkuyqGmSHNnxdrmFCRXTCQ7eUaDRh3pUORa+TU0MHQQKBgQDb44JgRexwuhlM6sN7\ndOd0iAaUvch1tRBV07RVMa25nQb85FDc1cJjyZf6X+KkVobvh2RIUEZWw6r6vS30\nUIJNB04wgAuwYwU98EjHB6oScRAGueU3Y1QHd9Z6t8pHK3UrDb0xLutuhEQjO4q5\n8i6HCaop2otXi0sN1Qb//T8S0QKBgQDGUL2A2j42huvXPUs6ojXZaeUi6ozASiGg\nZjiZN5aI70dVTZs/TbzEQhKd5eMdOKshwmL+BnV3V/oEmMGA0mC7lKSdGngs9eGx\nflUrzgDoO73rKVfMmlRB4A6C/7rpLyX/vgF1s4s5f8wKcG26WHpZyLjOmebF02q9\nH6pRcZVzSQKBgQC3ItI4SqR08poV1MVA8om/JXeNtE7bshTL1smv1vNgzya9w46R\njrsbDxCz595EjwhNQM9F5w3eP5MMyDkY7WDItNfrTwntO1tnTdPfaEO+nkoBwBvn\nOKQIoEeS57Xh9pDcbdHvv6s33ZM+YN3Wpp0XvPXra+h33jyBZbYxyIMasQKBgAN3\nwfiQ2GmnrlQTNE+QKpTkrycPJurt4OynHPJA8JbwaDTrqH1Q5K4h4aV1MaV/Ki7q\n8UQz5LXzieGusiOIijx9eutsXRGcMxghd2fOsGFfOhD0ph5jzHlia56Kzj/pnSZ9\nshTW0OZuf6jnEmQhy/Hp+qFSO6DV85XfCeFmtRBRAoGBAMq5+ltYWJhoHugo6nrO\nu2KqjEsIz4LM9HgTOG+WAxmlzEoiCpT82VGXyHhEz5nZOFUpoWHam61/xyuDbxzb\nO2VZrGlqH44Kj2Mec/cs7iSOG9i0qQSFK7owiIhgcTzZPkm9bxavYjrq9KXpSojn\nnmWiyPZnUxSqXOxYMOaTeVfw\n-----END PRIVATE KEY-----\n',
    //     // client_email: 'firebase-adminsdk-tx5oh@xmodel-ffe3b.iam.gserviceaccount.com',
    //     // client_id: '103400328580978871288',
    //     // auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    //     // token_uri: 'https://oauth2.googleapis.com/token',
    //     // auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    //     // client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-tx5oh%40xmodel-ffe3b.iam.gserviceaccount.com',
    //     // universe_domain: 'googleapis.com'
    //     privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCqV1C02KIpyx8w\ntSPxol5ox2yLcZK6ZHm9ShOw8P5uPt8EDNi2Bx5FHI+T/A7/nabab+d1TWwQLTnb\nNXmW+mtiKfXuOIfXlzxsAGveOIWV+6e6fIZ976gyt3sOh71muAWj87f/5lN7zWCN\nt00JQ9rsS0bwhvTm3/KcKIxxb+G8+E0gIXUxCqai8h7tSrwif9Moa84cj9/KpsOI\n7Cr++49jWDjexmS4uVV/E4njaHb4srDS32OHrlkTTltwJieHQWLNBq83QyTH3N2z\ndofAVrkjYDdo8iJZZBGhEJNK+pCUFOKugXymWXMC2sC6rpSQuqcgFJRUCs0C7k1t\n+OfBFUCZAgMBAAECggEAB6ni/yfp79BsKFBV/CaOcc9bElD7RXiEw5/kD+dfww0A\nEpoTW+kpEvnseb9y20w3+Abl1nCzxmyKeFLJFCJTF3kE0AFqFyh+Nuuz7q0DUZKf\nYrP8hwjzu8hmeGph+o+X7V7nLdOqeNzuFaIkDKEpZc0jNWoU9ZgovZ7TZr0eXlaI\nrREajMHPJxQ22g3Pxc5aaO/NUtBa2ET6ga3ZB3FWOyx+XNN7RX93EQStLibmW4dG\nZjAYDB41Y1wSwTkpwHtAOooG8frnF1ZoMF/AH2i3qnT9PL0/zue9ZJFZ6ubye9N+\nkuyqGmSHNnxdrmFCRXTCQ7eUaDRh3pUORa+TU0MHQQKBgQDb44JgRexwuhlM6sN7\ndOd0iAaUvch1tRBV07RVMa25nQb85FDc1cJjyZf6X+KkVobvh2RIUEZWw6r6vS30\nUIJNB04wgAuwYwU98EjHB6oScRAGueU3Y1QHd9Z6t8pHK3UrDb0xLutuhEQjO4q5\n8i6HCaop2otXi0sN1Qb//T8S0QKBgQDGUL2A2j42huvXPUs6ojXZaeUi6ozASiGg\nZjiZN5aI70dVTZs/TbzEQhKd5eMdOKshwmL+BnV3V/oEmMGA0mC7lKSdGngs9eGx\nflUrzgDoO73rKVfMmlRB4A6C/7rpLyX/vgF1s4s5f8wKcG26WHpZyLjOmebF02q9\nH6pRcZVzSQKBgQC3ItI4SqR08poV1MVA8om/JXeNtE7bshTL1smv1vNgzya9w46R\njrsbDxCz595EjwhNQM9F5w3eP5MMyDkY7WDItNfrTwntO1tnTdPfaEO+nkoBwBvn\nOKQIoEeS57Xh9pDcbdHvv6s33ZM+YN3Wpp0XvPXra+h33jyBZbYxyIMasQKBgAN3\nwfiQ2GmnrlQTNE+QKpTkrycPJurt4OynHPJA8JbwaDTrqH1Q5K4h4aV1MaV/Ki7q\n8UQz5LXzieGusiOIijx9eutsXRGcMxghd2fOsGFfOhD0ph5jzHlia56Kzj/pnSZ9\nshTW0OZuf6jnEmQhy/Hp+qFSO6DV85XfCeFmtRBRAoGBAMq5+ltYWJhoHugo6nrO\nu2KqjEsIz4LM9HgTOG+WAxmlzEoiCpT82VGXyHhEz5nZOFUpoWHam61/xyuDbxzb\nO2VZrGlqH44Kj2Mec/cs7iSOG9i0qQSFK7owiIhgcTzZPkm9bxavYjrq9KXpSojn\nnmWiyPZnUxSqXOxYMOaTeVfw\n-----END PRIVATE KEY-----\n',
    //     projectId: 'xmodel-ffe3b',
    //     clientEmail: 'firebase-adminsdk-tx5oh@xmodel-ffe3b.iam.gserviceaccount.com'
    //   })
    // });

    const alreadyCreatedAps = getApps();
    const app = !alreadyCreatedAps.length ? firebase.initializeApp({
      credential: firebase.credential.cert({
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDI2zBqzrKS7Je+\nHBjh7mB09X8dp3i/yaxF9HzJ1iYTt//9PqQ7u4zR/dEbKqU8aNcjOntnOwcjg/QQ\nCWrbl7BEShKB0GNzXfAqNNm2xjmNQp8DkTquR5acGPwn2AljFhStD5pfjPNdSJ80\nSmZKrW6uMAjXo9JPxpIQkxindHdrCoi+imIrtvjqtPdFj9xBEhPPxR8WwL25F/fB\nkOvj14VrPPx+9FyG4mZkVbNgkkR5DEIgrrPctPL5eJQJEO8xmjqfb73suOpEf8b1\ncMz88uL2rJdb18s8GHCzrRczHJiMOF8KXDwXtWjGqBW9conOiJzNRmmnpnjHKpZ8\nOFnjQfWBAgMBAAECggEAY8zBUHi2sxk6xpvoYy5SIBsxV5c0gLsgzbuO26z7y3V0\nDS14ZjOo41hF88UrSAphx1/SHDdwsx1oAiXjwguraisR6g2UtKia4iXTfaUdyIov\nP5MEQL9SXuptNBD8jQ7WJC1qC4saCyI/9Lf4/qcRJRy58Ae2wqvMPM8SA3Zztauq\nvd6LTcxMu0LkuEDEa9sWq3wXlmKfdRTuOtmPtCGvYAB5lBTmmZaIxs297sgyHKo0\nk9bIyYjbhECM9et8xQhwn0F3iz2mod+HFAf9q5JJu5pN58kiWKF0d1Wovnfbxwuu\nH/tKzM5edTLW8rCU3wi7i2bCGqdPLp8tlspn8wc3LwKBgQD1YNcxI9Yn97lyPnW7\nRaEWzWUCYrKh5XARS2A2OqGq4Sb6t6anrq2FhN6L8k543N1obqOlpZTsXpqNKcyw\nCwYDQFHSTR4EGOujXjVwByQYrOgtBWhcWojXaDvHa8Qa32Yyr94ncimDV/J9kPH3\nC5sXBcQbLTHXEeMYKq47+aAMRwKBgQDRjPonDkHM1kpuIz0bhHbiYK5BZ7zCLAJI\nPNeBCL61LAMCQ/frbG1qeJ/P6mXcPwpn/Ejx1ydoS7lzAhb8df2rilLFdjhkCqEt\nhPoPOX0BA2ryYZszizsSDcuR0ptG4nn7HH8y3qLEcd8NHUYvWuEUvqaMXoMpP/dY\n2b265JB79wKBgFYAnSvR/auAffT2w1jh7LYLQ030vdtUiVTmcFBReHxl8b2KRNUc\nuiDEEyRFxw9BijCiJqVWRb4a4lx7vAwvsOnOz17APLb+7QgTavNa7WHgqHevH4bP\nDItDM0CQGum4Rx+Y2GpG7xnj50/vT39hB/inwrYrvv48fLXpr6vBsEDdAoGAQbrT\n2J5bO3JYRHXfPBtv4xBqeG+ewNVnHdufyYTBtTiJ9RL22CzZoVUW4/PlYZGQpQ94\nngtb/BYMpKuaJDSqjj1EO1Ya2B6RciLNASuKL2AwErlVInTg4YfcO/Bw7mop0v+c\nUouNSMtjKMzu7/m0snoe6dbXk3/SCVe7cL0zKP8CgYEAldwt/8CX2SUBh2i06QUg\nfM67GehrWdmUyIjBPis+mKfVZWC4oTNrdFjooVaz1q2jw6T/Z1r2UJz3nK/wQR7r\nfhgg79GrcGG/e4h859Gndg9CfgnUvMVio2J9V6VxUYgzvBFQTXJJVbeW+gBgGxrC\n4/tQncjvT/M9oLn9neRdo70=\n-----END PRIVATE KEY-----\n',
        projectId: FIREBASE_PROJECT_ID, // 'cathysol-portal',
        clientEmail: FIREBASE_CLIENT_EMAIL // 'firebase-adminsdk-s8oiz@cathysol-portal.iam.gserviceaccount.com'
      })
    }) : alreadyCreatedAps[0];

    const userType = currentUser.isPerformer ? 'performer' : 'user';

    const messaging = firebase.messaging(app);
    await messaging.subscribeToTopic([payload.registrationToken], PUSH_NOTIFICATION_TOPIC);
    await messaging.subscribeToTopic([payload.registrationToken], userType);
    await this.PushNotificationTokenModel.updateOne({
      userId: currentUser._id,
      registrationToken: payload.registrationToken
    }, {
      $set: {
        userType,
        ...payload
      }
    }, {
      upsert: true
    });

    return true;
  }

  public async delete(id: string | ObjectId, currentUser: UserDto) {
    const token = await this.findById(id) as any;
    if (!token) throw new EntityNotFoundException();
    if (!token.userId.equals(currentUser._id)) throw new ForbiddenException();
    await this.PushNotificationTokenModel.deleteOne({ _id: token._id });
    const [
      FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY
    ] = await Promise.all([
      this.settingService.getKeyValue(FIREBASE_SETTING_KEYS.FIREBASE_PROJECT_ID),
      this.settingService.getKeyValue(FIREBASE_SETTING_KEYS.FIREBASE_CLIENT_EMAIL),
      this.settingService.getKeyValue(FIREBASE_SETTING_KEYS.FIREBASE_PRIVATE_KEY)

    ]);
    // const app = firebase.initializeApp({
    //   credential: firebase.credential.cert({
    //     privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCqV1C02KIpyx8w\ntSPxol5ox2yLcZK6ZHm9ShOw8P5uPt8EDNi2Bx5FHI+T/A7/nabab+d1TWwQLTnb\nNXmW+mtiKfXuOIfXlzxsAGveOIWV+6e6fIZ976gyt3sOh71muAWj87f/5lN7zWCN\nt00JQ9rsS0bwhvTm3/KcKIxxb+G8+E0gIXUxCqai8h7tSrwif9Moa84cj9/KpsOI\n7Cr++49jWDjexmS4uVV/E4njaHb4srDS32OHrlkTTltwJieHQWLNBq83QyTH3N2z\ndofAVrkjYDdo8iJZZBGhEJNK+pCUFOKugXymWXMC2sC6rpSQuqcgFJRUCs0C7k1t\n+OfBFUCZAgMBAAECggEAB6ni/yfp79BsKFBV/CaOcc9bElD7RXiEw5/kD+dfww0A\nEpoTW+kpEvnseb9y20w3+Abl1nCzxmyKeFLJFCJTF3kE0AFqFyh+Nuuz7q0DUZKf\nYrP8hwjzu8hmeGph+o+X7V7nLdOqeNzuFaIkDKEpZc0jNWoU9ZgovZ7TZr0eXlaI\nrREajMHPJxQ22g3Pxc5aaO/NUtBa2ET6ga3ZB3FWOyx+XNN7RX93EQStLibmW4dG\nZjAYDB41Y1wSwTkpwHtAOooG8frnF1ZoMF/AH2i3qnT9PL0/zue9ZJFZ6ubye9N+\nkuyqGmSHNnxdrmFCRXTCQ7eUaDRh3pUORa+TU0MHQQKBgQDb44JgRexwuhlM6sN7\ndOd0iAaUvch1tRBV07RVMa25nQb85FDc1cJjyZf6X+KkVobvh2RIUEZWw6r6vS30\nUIJNB04wgAuwYwU98EjHB6oScRAGueU3Y1QHd9Z6t8pHK3UrDb0xLutuhEQjO4q5\n8i6HCaop2otXi0sN1Qb//T8S0QKBgQDGUL2A2j42huvXPUs6ojXZaeUi6ozASiGg\nZjiZN5aI70dVTZs/TbzEQhKd5eMdOKshwmL+BnV3V/oEmMGA0mC7lKSdGngs9eGx\nflUrzgDoO73rKVfMmlRB4A6C/7rpLyX/vgF1s4s5f8wKcG26WHpZyLjOmebF02q9\nH6pRcZVzSQKBgQC3ItI4SqR08poV1MVA8om/JXeNtE7bshTL1smv1vNgzya9w46R\njrsbDxCz595EjwhNQM9F5w3eP5MMyDkY7WDItNfrTwntO1tnTdPfaEO+nkoBwBvn\nOKQIoEeS57Xh9pDcbdHvv6s33ZM+YN3Wpp0XvPXra+h33jyBZbYxyIMasQKBgAN3\nwfiQ2GmnrlQTNE+QKpTkrycPJurt4OynHPJA8JbwaDTrqH1Q5K4h4aV1MaV/Ki7q\n8UQz5LXzieGusiOIijx9eutsXRGcMxghd2fOsGFfOhD0ph5jzHlia56Kzj/pnSZ9\nshTW0OZuf6jnEmQhy/Hp+qFSO6DV85XfCeFmtRBRAoGBAMq5+ltYWJhoHugo6nrO\nu2KqjEsIz4LM9HgTOG+WAxmlzEoiCpT82VGXyHhEz5nZOFUpoWHam61/xyuDbxzb\nO2VZrGlqH44Kj2Mec/cs7iSOG9i0qQSFK7owiIhgcTzZPkm9bxavYjrq9KXpSojn\nnmWiyPZnUxSqXOxYMOaTeVfw\n-----END PRIVATE KEY-----\n',
    //     projectId: 'xmodel-ffe3b',
    //     clientEmail: 'firebase-adminsdk-tx5oh@xmodel-ffe3b.iam.gserviceaccount.com'
    //   })
    // });

    const alreadyCreatedAps = getApps();
    const app = !alreadyCreatedAps.length ? firebase.initializeApp({
      credential: firebase.credential.cert({
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDI2zBqzrKS7Je+\nHBjh7mB09X8dp3i/yaxF9HzJ1iYTt//9PqQ7u4zR/dEbKqU8aNcjOntnOwcjg/QQ\nCWrbl7BEShKB0GNzXfAqNNm2xjmNQp8DkTquR5acGPwn2AljFhStD5pfjPNdSJ80\nSmZKrW6uMAjXo9JPxpIQkxindHdrCoi+imIrtvjqtPdFj9xBEhPPxR8WwL25F/fB\nkOvj14VrPPx+9FyG4mZkVbNgkkR5DEIgrrPctPL5eJQJEO8xmjqfb73suOpEf8b1\ncMz88uL2rJdb18s8GHCzrRczHJiMOF8KXDwXtWjGqBW9conOiJzNRmmnpnjHKpZ8\nOFnjQfWBAgMBAAECggEAY8zBUHi2sxk6xpvoYy5SIBsxV5c0gLsgzbuO26z7y3V0\nDS14ZjOo41hF88UrSAphx1/SHDdwsx1oAiXjwguraisR6g2UtKia4iXTfaUdyIov\nP5MEQL9SXuptNBD8jQ7WJC1qC4saCyI/9Lf4/qcRJRy58Ae2wqvMPM8SA3Zztauq\nvd6LTcxMu0LkuEDEa9sWq3wXlmKfdRTuOtmPtCGvYAB5lBTmmZaIxs297sgyHKo0\nk9bIyYjbhECM9et8xQhwn0F3iz2mod+HFAf9q5JJu5pN58kiWKF0d1Wovnfbxwuu\nH/tKzM5edTLW8rCU3wi7i2bCGqdPLp8tlspn8wc3LwKBgQD1YNcxI9Yn97lyPnW7\nRaEWzWUCYrKh5XARS2A2OqGq4Sb6t6anrq2FhN6L8k543N1obqOlpZTsXpqNKcyw\nCwYDQFHSTR4EGOujXjVwByQYrOgtBWhcWojXaDvHa8Qa32Yyr94ncimDV/J9kPH3\nC5sXBcQbLTHXEeMYKq47+aAMRwKBgQDRjPonDkHM1kpuIz0bhHbiYK5BZ7zCLAJI\nPNeBCL61LAMCQ/frbG1qeJ/P6mXcPwpn/Ejx1ydoS7lzAhb8df2rilLFdjhkCqEt\nhPoPOX0BA2ryYZszizsSDcuR0ptG4nn7HH8y3qLEcd8NHUYvWuEUvqaMXoMpP/dY\n2b265JB79wKBgFYAnSvR/auAffT2w1jh7LYLQ030vdtUiVTmcFBReHxl8b2KRNUc\nuiDEEyRFxw9BijCiJqVWRb4a4lx7vAwvsOnOz17APLb+7QgTavNa7WHgqHevH4bP\nDItDM0CQGum4Rx+Y2GpG7xnj50/vT39hB/inwrYrvv48fLXpr6vBsEDdAoGAQbrT\n2J5bO3JYRHXfPBtv4xBqeG+ewNVnHdufyYTBtTiJ9RL22CzZoVUW4/PlYZGQpQ94\nngtb/BYMpKuaJDSqjj1EO1Ya2B6RciLNASuKL2AwErlVInTg4YfcO/Bw7mop0v+c\nUouNSMtjKMzu7/m0snoe6dbXk3/SCVe7cL0zKP8CgYEAldwt/8CX2SUBh2i06QUg\nfM67GehrWdmUyIjBPis+mKfVZWC4oTNrdFjooVaz1q2jw6T/Z1r2UJz3nK/wQR7r\nfhgg79GrcGG/e4h859Gndg9CfgnUvMVio2J9V6VxUYgzvBFQTXJJVbeW+gBgGxrC\n4/tQncjvT/M9oLn9neRdo70=\n-----END PRIVATE KEY-----\n',
        projectId: FIREBASE_PROJECT_ID, // 'cathysol-portal',
        clientEmail: FIREBASE_CLIENT_EMAIL// 'firebase-adminsdk-s8oiz@cathysol-portal.iam.gserviceaccount.com'
      })
    }) : alreadyCreatedAps[0];

    const messaging = firebase.messaging(app);
    await messaging.unsubscribeFromTopic([token.registrationToken], PUSH_NOTIFICATION_TOPIC);
    if (token.userType) await messaging.unsubscribeFromTopic([token.registrationToken], token.userType);

    return true;
  }

  public async search(req: PushNotificationTokenSearchPayload, currentUser: UserDto) {
    const query: FilterQuery<any> = {
      userId: currentUser._id
    };

    const [data, total] = await Promise.all([
      this.PushNotificationTokenModel.find(query).limit(+req.limit).skip(+req.offset).lean()
        .exec(),
      this.PushNotificationTokenModel.countDocuments(query)
    ]);
    return {
      data,
      total
    };
  }

  public async handleCreateSubsNotification(event: QueueEvent) {
    try {
      const { performer, registrationToken, userAgent } = event.data;
      const payload = new PushNotificationTokenPayload(userAgent, registrationToken);
      await this.create(payload, performer);
    } catch (error) {
      this.logger.error('Failed to create subscription notification', error.stack);
    }
  }
}
