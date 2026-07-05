export interface Notification {
    id?: number;
    user_id: number;
    message: string;
    type: string;
    is_read: boolean;
    created_at?: string;
}
export declare class NotificationModel {
    static findAllByUserId(userId: number): Promise<Notification[]>;
    static create(notification: Notification): Promise<number>;
    static markAsRead(id: number, userId: number): Promise<boolean>;
    static markAllAsRead(userId: number): Promise<boolean>;
}
//# sourceMappingURL=Notification.d.ts.map