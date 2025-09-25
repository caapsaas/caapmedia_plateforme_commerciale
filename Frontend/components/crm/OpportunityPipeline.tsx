

import React, { useState } from 'react';
import { Subsidiary, Contact, Opportunity, User, OpportunityStage } from '../../types';
import { useI18n } from '../../i18n';
import IconPlus from '../icons/IconPlus';
import OpportunityCard from './OpportunityCard';
import OpportunityFormModal from './OpportunityFormModal';

interface OpportunityPipelineProps {
    subsidiary: Subsidiary;
    currentUser: User;
    clients: Contact[];
    allClients: Contact[]; // To select any client when creating opps
    opportunities: Opportunity[];
    onSaveOpportunity: (data: Partial<Opportunity>) => void;
    onUpdateOpportunityStage: (oppId: string, newStage: OpportunityStage) => void;
    onWinOpportunity: (opportunity: Opportunity) => void;
}

const Column: React.FC<{
  stage: OpportunityStage;
  opportunities: Opportunity[];
  clients: Contact[];
  onDrop: (e: React.DragEvent<HTMLDivElement>, stage: OpportunityStage) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, oppId: string) => void;
  onCardClick: (opp: Opportunity) => void;
}> = ({ stage, opportunities, clients, onDrop, onDragOver, onDragLeave, onDragStart, onCardClick }) => {
    const { t, formatCurrency } = useI18n();
    const totalValue = opportunities.reduce((sum, o) => sum + o.value, 0);

    return (
        <div 
            className="w-72 bg-slate-100 rounded-lg flex-shrink-0 flex flex-col transition-colors duration-300"
            onDrop={(e) => onDrop(e, stage)}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
        >
            <div className="p-3 border-b border-slate-300">
                <h3 className="font-semibold text-slate-800">{t(`crm.opportunity.stages.${stage}`)}</h3>
                <p className="text-xs text-slate-500">{opportunities.length} opportunités - {formatCurrency(totalValue)}</p>
            </div>
            <div className="mt-4 space-y-3 h-full overflow-y-auto p-2">
                {opportunities.map(opp => (
                    <OpportunityCard 
                        key={opp.id}
                        opportunity={opp}
                        clientName={clients.find(c => c.id === opp.contactId)?.name || 'N/A'}
                        onDragStart={(e) => onDragStart(e, opp.id)}
                        onClick={() => onCardClick(opp)}
                    />
                ))}
            </div>
        </div>
    );
};


const OpportunityPipeline: React.FC<OpportunityPipelineProps> = (props) => {
    const { t } = useI18n();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);

    const handleOpenAddModal = () => {
        setEditingOpportunity(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (opportunity: Opportunity) => {
        setEditingOpportunity(opportunity);
        setIsModalOpen(true);
    };

    const handleSave = (data: Omit<Opportunity, 'id' | 'subsidiaryId' | 'userId'>) => {
        const saveData: Partial<Opportunity> = editingOpportunity ? { ...data, id: editingOpportunity.id } : data;
        props.onSaveOpportunity(saveData);
        setIsModalOpen(false);
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, opportunityId: string) => {
        e.dataTransfer.setData("opportunityId", opportunityId);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStage: OpportunityStage) => {
        e.preventDefault();
        const opportunityId = e.dataTransfer.getData("opportunityId");
        const opportunity = props.opportunities.find(o => o.id === opportunityId);
        
        if (opportunity && opportunity.stage !== newStage) {
            if(newStage === OpportunityStage.WON) {
                props.onWinOpportunity(opportunity);
            } else {
                props.onUpdateOpportunityStage(opportunityId, newStage);
            }
        }
        e.currentTarget.classList.remove('bg-slate-200');
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.add('bg-slate-200');
    };
    
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-slate-200');
    };
    
    const pipelineStages = Object.values(OpportunityStage);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold text-slate-800">{t('crm.tabs.pipeline')}</h2>
                 <button onClick={handleOpenAddModal} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                    <IconPlus className="h-4 w-4" />
                    <span>{t('crm.pipeline.addOpportunity')}</span>
                </button>
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-4">
                {pipelineStages.map(stage => (
                    <Column
                        key={stage}
                        stage={stage}
                        opportunities={props.opportunities.filter(o => o.stage === stage)}
                        clients={props.allClients}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDragStart={handleDragStart}
                        onCardClick={handleOpenEditModal}
                    />
                ))}
            </div>

             {isModalOpen && (
                <OpportunityFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    opportunity={editingOpportunity}
                    clients={props.allClients}
                    products={[]} // Note: products are not available here, might need to pass them down
                />
            )}
        </div>
    );
};

export default OpportunityPipeline;