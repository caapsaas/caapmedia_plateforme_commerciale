import { PreHireTrainingStatus } from '@prisma/client';
export declare class CreatePreHireTrainingDto {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    targetPosition: string;
    department?: string;
    mentorName?: string;
    startDate: Date;
    plannedEndDate?: Date;
    status?: PreHireTrainingStatus;
    progress?: number;
    acquiredClients?: number;
    acquiredProspects?: number;
    evaluation?: string;
    outcome?: string;
    notes?: string;
    subsidiaryId?: string;
}
declare const UpdatePreHireTrainingDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreatePreHireTrainingDto>>;
export declare class UpdatePreHireTrainingDto extends UpdatePreHireTrainingDto_base {
}
export {};
