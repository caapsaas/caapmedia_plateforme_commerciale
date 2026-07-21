import React, { useState } from 'react';
import { useI18n } from '../../i18n';
import { LeaveRecord, LeaveType } from '../../types';
import LeaveBalanceWidget from './LeaveBalanceWidget';
import FormInput from '../ui/FormInput';
import FormSelect from '../ui/FormSelect';
import Button from '../ui/Button';
import { Plus, X, FileText } from '../ui/Icons';

interface LeaveManagementSectionProps {
  leaveBalance: {
    annual: number;
    sick: number;
    personal: number;
    maternity: number;
    paternity: number;
    other: number;
    unpaid: number;
  };
  leaveRecords: LeaveRecord[];
  onBalanceUpdate: (balance: any) => void;
  onRecordsUpdate: (records: LeaveRecord[]) => void;
}

const LeaveManagementSection: React.FC<LeaveManagementSectionProps> = ({
  leaveBalance,
  leaveRecords,
  onBalanceUpdate,
  onRecordsUpdate,
}) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'balance' | 'records'>('balance');
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<LeaveRecord>>({
    leaveRecordType: LeaveType.ANNUAL,
    startDate: '',
    endDate: '',
    days: 0,
  });
  const [recordErrors, setRecordErrors] = useState<Record<string, string>>({});

  const leaveTypes = [
    { key: 'annual', label: t('hr.leaveType.annual') },
    { key: 'sick', label: t('hr.leaveType.sick') },
    { key: 'personal', label: t('hr.leaveType.personal') },
    { key: 'maternity', label: t('hr.leaveType.maternity') },
    { key: 'paternity', label: t('hr.leaveType.paternity') },
    { key: 'other', label: t('hr.leaveType.other') },
  ];

  const handleBalanceChange = (field: string, value: number) => {
    onBalanceUpdate({
      ...leaveBalance,
      [field]: Math.max(0, value),
    });
  };

  const validateRecord = (): boolean => {
    const errors: Record<string, string> = {};

    if (!newRecord.startDate) {
      errors.startDate = t('hr.leaves.validation.startDateRequired');
    }
    if (!newRecord.endDate) {
      errors.endDate = t('hr.leaves.validation.endDateRequired');
    }
    if (newRecord.startDate && newRecord.endDate && newRecord.startDate > newRecord.endDate) {
      errors.endDate = t('hr.leaves.validation.endDateAfterStart');
    }
    if (!newRecord.days || newRecord.days <= 0) {
      errors.days = t('hr.leaves.validation.daysRequired');
    }

    setRecordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddRecord = () => {
    if (!validateRecord()) return;

    const leaveType = newRecord.leaveRecordType || LeaveType.ANNUAL;
    const daysToDeduct = newRecord.days || 0;

    // Map LeaveType to balance key
    const balanceKeyMap: Record<LeaveType, keyof typeof leaveBalance> = {
      [LeaveType.ANNUAL]: 'annual',
      [LeaveType.SICK]: 'sick',
      [LeaveType.PERSONAL]: 'personal',
      [LeaveType.MATERNITY]: 'maternity',
      [LeaveType.PATERNITY]: 'paternity',
      [LeaveType.OTHER]: 'other',
      [LeaveType.UNPAID]: 'unpaid',
    };

    const balanceKey = balanceKeyMap[leaveType];
    const currentBalance = leaveBalance[balanceKey] || 0;

    // Check if enough balance
    if (currentBalance < daysToDeduct) {
      setRecordErrors({
        days: `${t('hr.leaves.validation.insufficientBalance')} (${t('hr.leaves.available')}: ${currentBalance.toFixed(1)})`,
      });
      return;
    }

    const record: LeaveRecord = {
      leaveRecordType: leaveType,
      startDate: newRecord.startDate || '',
      endDate: newRecord.endDate || '',
      days: daysToDeduct,
    };

    // Update records
    onRecordsUpdate([...leaveRecords, record]);

    // Deduct from balance
    const updatedBalance = {
      ...leaveBalance,
      [balanceKey]: currentBalance - daysToDeduct,
    };
    onBalanceUpdate(updatedBalance);

    // Reset form
    setNewRecord({
      leaveRecordType: LeaveType.ANNUAL,
      startDate: '',
      endDate: '',
      days: 0,
    });
    setShowAddRecord(false);
    setRecordErrors({});
  };

  const handleRemoveRecord = (index: number) => {
    const recordToRemove = leaveRecords[index];
    if (!recordToRemove) return;

    // Map LeaveType to balance key
    const balanceKeyMap: Record<LeaveType, keyof typeof leaveBalance> = {
      [LeaveType.ANNUAL]: 'annual',
      [LeaveType.SICK]: 'sick',
      [LeaveType.PERSONAL]: 'personal',
      [LeaveType.MATERNITY]: 'maternity',
      [LeaveType.PATERNITY]: 'paternity',
      [LeaveType.OTHER]: 'other',
      [LeaveType.UNPAID]: 'unpaid',
    };

    const balanceKey = balanceKeyMap[recordToRemove.leaveRecordType];
    const currentBalance = leaveBalance[balanceKey] || 0;

    // Restore days to balance
    const updatedBalance = {
      ...leaveBalance,
      [balanceKey]: currentBalance + recordToRemove.days,
    };
    onBalanceUpdate(updatedBalance);

    // Remove record
    onRecordsUpdate(leaveRecords.filter((_, i) => i !== index));
  };

  const getLeaveTypeLabel = (type: LeaveType): string => {
    const found = leaveTypes.find(
      (lt) => lt.key === type.toLowerCase()
    );
    return found ? found.label : type;
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('balance')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'balance'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('hr.form.leavesSection.tabBalance')}
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'records'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('hr.form.leavesSection.tabRecords')}
        </button>
      </div>

      {/* Balance Tab */}
      {activeTab === 'balance' && (
        <div className="space-y-6">
          {/* Current Balance Display */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              {t('hr.leaves.currentBalance')}
            </h3>
            <LeaveBalanceWidget leaveBalance={leaveBalance} />
          </div>

          {/* Edit Balance */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              {t('hr.leaves.configureBalance')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {leaveTypes.map(({ key, label }) => (
                <FormInput
                  key={key}
                  label={label}
                  name={key}
                  type="number"
                  value={leaveBalance[key as keyof typeof leaveBalance] || 0}
                  onChange={(e) =>
                    handleBalanceChange(key, parseFloat(e.target.value) || 0)
                  }
                  min="0"
                  step="0.5"
                  helperText={t('hr.leaves.daysHelper')}
                />
              ))}
            </div>

            {/* Unpaid Leave */}
            <div className="mt-4">
              <FormInput
                label={t('hr.leaveBalance.unpaidLeave')}
                name="unpaid"
                type="number"
                value={leaveBalance.unpaid || 0}
                onChange={(e) =>
                  handleBalanceChange('unpaid', parseFloat(e.target.value) || 0)
                }
                min="0"
                step="0.5"
                helperText={t('hr.leaves.unpaidHelperText')}
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-blue-800">
              {t('hr.leaves.balanceInfo')}
            </p>
          </div>
        </div>
      )}

      {/* Records Tab */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          {/* Add Record Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-900">
              {t('hr.leaves.leaveHistory')} ({leaveRecords.length})
            </h3>
            <button
              onClick={() => setShowAddRecord(!showAddRecord)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={16} />
              {t('hr.leaves.addLeaveRecord')}
            </button>
          </div>

          {/* Add Leave Record Form */}
          {showAddRecord && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormSelect
                  label={t('hr.leaves.leaveType')}
                  name="leaveType"
                  value={newRecord.leaveRecordType || LeaveType.ANNUAL}
                  onChange={(e) =>
                    setNewRecord({
                      ...newRecord,
                      leaveRecordType: e.target.value as LeaveType,
                    })
                  }
                  options={Object.values(LeaveType).map((type) => ({
                    value: type,
                    label: getLeaveTypeLabel(type),
                  }))}
                />
                <FormInput
                  label={t('hr.leaves.days')}
                  name="days"
                  type="number"
                  value={newRecord.days || 0}
                  onChange={(e) =>
                    setNewRecord({
                      ...newRecord,
                      days: parseFloat(e.target.value) || 0,
                    })
                  }
                  error={recordErrors.days}
                  min="1"
                  step="0.5"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label={t('hr.leaves.startDate')}
                  name="startDate"
                  type="date"
                  value={newRecord.startDate || ''}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, startDate: e.target.value })
                  }
                  error={recordErrors.startDate}
                  required
                />
                <FormInput
                  label={t('hr.leaves.endDate')}
                  name="endDate"
                  type="date"
                  value={newRecord.endDate || ''}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, endDate: e.target.value })
                  }
                  error={recordErrors.endDate}
                  required
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowAddRecord(false);
                    setRecordErrors({});
                  }}
                >
                  {t('hr.cancel')}
                </Button>
                <Button variant="primary" onClick={handleAddRecord}>
                  {t('hr.leaves.addRecord')}
                </Button>
              </div>
            </div>
          )}

          {/* Leave Records List */}
          {leaveRecords.length > 0 ? (
            <div className="space-y-2">
              {leaveRecords.map((record, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={16} className="text-slate-600" />
                      <p className="font-semibold text-slate-900">
                        {getLeaveTypeLabel(record.leaveRecordType)}
                      </p>
                      <span className="text-sm font-bold text-blue-600">
                        {record.days} {t('hr.leaveBalance.days')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {new Date(record.startDate).toLocaleDateString()} →{' '}
                      {new Date(record.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveRecord(index)}
                    className="text-red-600 hover:text-red-800 transition"
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-500 text-sm">
                {t('hr.leaves.noRecords')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeaveManagementSection;
