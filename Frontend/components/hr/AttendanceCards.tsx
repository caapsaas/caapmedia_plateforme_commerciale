import React from 'react';
import DynamicQrDisplay from './DynamicQrDisplay';

interface AttendanceCardsProps {
  subsidiary: any;
}

const AttendanceCards: React.FC<AttendanceCardsProps> = ({ subsidiary }) => {
  return (
    <div className="space-y-6">
      <DynamicQrDisplay key={subsidiary.id} />
    </div>
  );
};

export default AttendanceCards;
