import React from 'react';
import { Opportunity } from '../../types';
import { useI18n } from '../../i18n';
import IconShoppingCart from '../icons/IconShoppingCart';
import IconDocumentText from '../icons/IconDocumentText';

interface OpportunityCardProps {
    opportunity: Opportunity;
    clientName: string;
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
    onClick: () => void;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity, clientName, onDragStart, onClick }) => {
    const { t, formatCurrency } = useI18n();

    const getSourceIcon = () => {
        switch (opportunity.source) {
            case 'web_order':
                return <span title="Commande Web"><IconShoppingCart className="h-5 w-5 text-purple-500" /></span>;
            case 'quote_request':
                return <span title="Demande de Devis"><IconDocumentText className="h-5 w-5 text-sky-500" /></span>;
            default:
                return null;
        }
    };

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onClick={onClick}
            className="bg-white rounded-md shadow p-4 border-l-4 border-[#c6e911] cursor-pointer hover:shadow-lg transition-shadow"
        >
            <div className="flex justify-between items-start">
                <h4 className="font-bold text-slate-800 pr-2">{opportunity.name}</h4>
                {getSourceIcon()}
            </div>
            <p className="text-sm text-slate-600">{clientName}</p>
            <p className="text-lg font-bold text-slate-900 mt-2">{formatCurrency(opportunity.value)}</p>
            <p className="text-xs text-slate-500 mt-1">Date de clôture: {opportunity.closeDate}</p>
        </div>
    );
};

export default OpportunityCard;