export interface Employee {
    id?: number;
    user_id: number;
    department: string;
    designation: string;
    name?: string;
    email?: string;
    created_at?: string;
}
interface FetchOptions {
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    page?: number;
    limit?: number;
    department?: string;
}
export declare class EmployeeModel {
    static findAll(options?: FetchOptions): Promise<{
        data: Employee[];
        total: number;
    }>;
    static findById(id: number): Promise<Employee | null>;
    static create(employee: Employee): Promise<number>;
    static update(id: number, data: Partial<Employee>): Promise<boolean>;
    static delete(id: number): Promise<boolean>;
    static getDistinctDepartments(): Promise<string[]>;
}
export {};
//# sourceMappingURL=Employee.d.ts.map