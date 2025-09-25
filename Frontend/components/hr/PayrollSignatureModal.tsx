import React from 'react';
import { PayrollRecord } from '../../types';
import { useI18n } from '../../i18n';
import SignaturePad from '../common/SignaturePad';

interface PayrollSignatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSignature: (recordId: string, signature: string) => void;
    record: PayrollRecord;
}

const PayrollSignatureModal: React.FC<PayrollSignatureModalProps> = ({ isOpen, onClose, onSaveSignature, record }) => {
    const { t } = useI18n();

    const handleSave = (signature: string) => {
        if(signature) {
            onSaveSignature(record.id, signature);
        }
    };

    if (!isOpen) return null;

    return (
        <SignaturePad 
            onSave={handleSave}
            onClose={onClose}
            title={t('configuration.modal.payrollSignatureTitle', { employeeName: record.employeeName })}
            clearLabel={t('hr.modals.sign.clear')}
            saveLabel={t('common.save')}
        />
    );
};

export default PayrollSignatureModal;
