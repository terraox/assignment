export interface Task {
    id?: number;
    title: string;
    description?: string;
    priority: 'Low' | 'Medium' | 'High';
    status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
    start_date: string;
    due_date: string;
    assigned_employee_id: number | null;
    file_path?: string;
    created_at?: string;
    assigned_employee_name?: string;
}
interface FetchOptions {
    assigned_employee_id?: number;
}
export declare class TaskModel {
    static findAll(options?: FetchOptions): Promise<Task[]>;
    static findById(id: number): Promise<Task | null>;
    static create(task: Task): Promise<number>;
    static update(id: number, data: Partial<Task>): Promise<boolean>;
    static delete(id: number): Promise<boolean>;
    static getEmployeeIdByUserId(userId: number): Promise<number | null>;
}
export {};
//# sourceMappingURL=Task.d.ts.map