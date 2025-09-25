import React, { useState, useMemo } from 'react';
import { Contact, ContactStatus } from '../../types';
import { useI18n } from '../../i18n';

interface ClientSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    clients: Contact[];
    onClientSelect: (client: Contact) => void;
    onClientCreate: (newClientData: Omit<Contact, 'id' | 'subsidiaryId'>) => void;
}

const ClientSelectionModal: React.FC<ClientSelectionModalProps> = ({ isOpen, onClose, clients, onClientSelect, onClientCreate }) => {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<'select' | 'create'>('select');
    const [searchTerm, setSearchTerm] = useState('');
    const [newClientData, setNewClientData] = useState({
        name: '',
        company: '',
        email: '',
        phone: '',
        address: '',
    });

    const filteredClients = useMemo(() => {
        return clients.filter(client => 
            client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [clients, searchTerm]);
    
    const handleNewClientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewClientData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onClientCreate({
            ...newClientData,
            since: new Date().toISOString().split('T')[0],
            isVerified: true, // Auto-verified for in-store creation
            password: '', // Default password, can be changed by user
            status: ContactStatus.ACTIVE,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex border-b">
                    <button onClick={() => setActiveTab('select')} className={`flex-1 py-3 font-semibold text-center ${activeTab === 'select' ? 'text-[#c6e911] border-b-2 border-[#c6e911]' : 'text-slate-500'}`}>{t('cashRegister.clientSection.selectTab')}</button>
                    <button onClick={() => setActiveTab('create')} className={`flex-1 py-3 font-semibold text-center ${activeTab === 'create' ? 'text-[#c6e911] border-b-2 border-[#c6e911]' : 'text-slate-500'}`}>{t('cashRegister.clientSection.createTab')}</button>
                </div>
                {activeTab === 'select' ? (
                    <div className="p-6">
                        <input
                            type="search"
                            placeholder={t('cashRegister.clientSection.searchClient')}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-md mb-4"
                        />
                        <ul className="max-h-60 overflow-y-auto divide-y divide-slate-200">
                            {filteredClients.map(client => (
                                <li key={client.id} onClick={() => onClientSelect(client)} className="p-3 hover:bg-slate-100 cursor-pointer">
                                    <p className="font-semibold">{client.name}</p>
                                    <p className="text-sm text-slate-500">{client.company}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">{t('configuration.form.name')}</label>
                            <input type="text" name="name" value={newClientData.name} onChange={handleNewClientChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">{t('configuration.form.company')}</label>
                            <input type="text" name="company" value={newClientData.company} onChange={handleNewClientChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700">{t('configuration.form.email')}</label>
                            <input type="email" name="email" value={newClientData.email} onChange={handleNewClientChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700">{t('configuration.form.phone')}</label>
                            <input type="tel" name="phone" value={newClientData.phone} onChange={handleNewClientChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700">{t('configuration.form.address')}</label>
                            <input type="text" name="address" value={newClientData.address} onChange={handleNewClientChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"/>
                        </div>
                        <button type="submit" className="w-full py-3 bg-[#c6e911] text-slate-800 font-bold rounded-lg hover:bg-[#adc40f]">{t('cashRegister.clientSection.createAndSelect')}</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ClientSelectionModal;