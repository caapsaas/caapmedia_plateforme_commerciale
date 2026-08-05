import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject, merge, interval, map } from 'rxjs';

/**
 * Diffusion temps réel des notifications — un flux RxJS par utilisateur
 * connecté (`Subject`), poussé par `NotificationsService` à la création
 * d'une notification. Le heartbeat garde la connexion HTTP ouverte à travers
 * d'éventuels proxys/reverse-proxys qui coupent les connexions idle.
 */
@Injectable()
export class NotificationsSseService {
  private readonly streams = new Map<string, Subject<MessageEvent>>();

  private getOrCreateStream(userId: string): Subject<MessageEvent> {
    let stream = this.streams.get(userId);
    if (!stream) {
      stream = new Subject<MessageEvent>();
      this.streams.set(userId, stream);
    }
    return stream;
  }

  subscribe(userId: string): Observable<MessageEvent> {
    const heartbeat = interval(30_000).pipe(
      map((): MessageEvent => ({ type: 'heartbeat', data: {} })),
    );
    return merge(this.getOrCreateStream(userId).asObservable(), heartbeat);
  }

  push(userId: string, notification: object): void {
    this.streams
      .get(userId)
      ?.next({ type: 'notification', data: notification });
  }

  pushToUsers(userIds: string[], notification: object): void {
    for (const userId of userIds) this.push(userId, notification);
  }
}
