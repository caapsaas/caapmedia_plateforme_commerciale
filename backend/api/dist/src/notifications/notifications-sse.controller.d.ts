import { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { JwtUser } from "../common/auth/jwt/jwt-user.interface";
import { NotificationsSseService } from './notifications-sse.service';
export declare class NotificationsSseController {
    private readonly sse;
    constructor(sse: NotificationsSseService);
    stream(user: JwtUser): Observable<MessageEvent>;
}
