import { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserRole } from '@prisma/client';
export declare class NotificationsSseService {
    private readonly streams;
    private getOrCreateStream;
    subscribe(userId: string, activeRole: UserRole): Observable<MessageEvent>;
    push(userId: string, notification: object): void;
    pushToUsers(userIds: string[], notification: object): void;
}
