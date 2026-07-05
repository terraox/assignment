export interface User {
    id?: number;
    name: string;
    email: string;
    password?: string;
    role: 'Admin' | 'Employee';
    created_at?: string;
}
export declare class UserModel {
    static findByEmail(email: string): Promise<User | null>;
    static findById(id: number): Promise<User | null>;
    static create(user: User): Promise<number>;
}
//# sourceMappingURL=User.d.ts.map