import React from 'react';
import ProformasManagement from '../components/crm/ProformasManagement';

// Page autonome "Proforma" — même découpage que gmo (Facture Proforma est
// une entrée à part dans le sidebar, pas un onglet du CRM).
const ProformaPage: React.FC = () => <ProformasManagement />;

export default ProformaPage;
