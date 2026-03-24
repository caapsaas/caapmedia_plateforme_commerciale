// Type compatibility test for Equipment interfaces
import { Equipment, EquipmentStatus } from './types/models';
import { CreateEquipmentDto } from './services/apiMaintenance/apiEquipment';

// Test that CreateEquipmentDto is compatible with Omit<Equipment, 'id' | 'subsidiaryId' | 'maintenanceHistory'>
type TestType = Omit<Equipment, 'id' | 'subsidiaryId' | 'maintenanceHistory'>;

const testCreateDto: CreateEquipmentDto = {
    equipmentName: 'Test Equipment',
    acquisitionDate: '2024-01-01',
    acquisitionValue: 1000,
    status: EquipmentStatus.OPERATIONAL,
    lastMaintenanceDate: '2024-01-01',
    nextMaintenanceDate: '2024-02-01'
};

// This should work now - assigning CreateEquipmentDto to the expected type
const testAssignment: TestType = testCreateDto;

console.log('Type compatibility test passed!');
console.log('CreateEquipmentDto:', testCreateDto);
console.log('Test assignment:', testAssignment);
