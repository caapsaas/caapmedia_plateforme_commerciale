export declare class WorkflowStepDto {
    equipmentId: string;
    stepOrder: number;
}
export declare class CreateWorkflowDto {
    name: string;
    description?: string;
    itemId?: string;
    isActive?: boolean;
    steps: WorkflowStepDto[];
}
export declare class UpdateWorkflowDto {
    name?: string;
    description?: string;
    itemId?: string | null;
    isActive?: boolean;
    steps?: WorkflowStepDto[];
}
