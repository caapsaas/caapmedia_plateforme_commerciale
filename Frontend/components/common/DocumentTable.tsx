import React from 'react';
import { useI18n } from '../../i18n';

interface DocumentTableProps {
    columns: {
        label: string;
        key: string;
        align?: 'left' | 'center' | 'right';
        formatter?: (value: any) => string;
        // Pour un contenu riche (ex. détails de personnalisation produit) qu'un
        // simple formatter texte ne peut pas rendre — prioritaire sur formatter.
        render?: (row: any) => React.ReactNode;
    }[];
    data: any[];
    title?: string;
    totalRow?: {
        label: string;
        value: string;
        isHighlighted?: boolean;
    };
    emptyMessage?: string;
}

const DocumentTable: React.FC<DocumentTableProps> = ({
    columns,
    data,
    title,
    totalRow,
    emptyMessage = 'Aucune donnée'
}) => {
    const { t } = useI18n();

    const getAlignClass = (align?: 'left' | 'center' | 'right') => {
        switch (align) {
            case 'center':
                return 'text-center';
            case 'right':
                return 'text-right';
            default:
                return 'text-left';
        }
    };

    return (
        <div className="mb-8">
            {title && (
                <div className="mb-3 border-b border-slate-200 pb-2">
                    <h3 className="font-semibold text-slate-700 uppercase text-[11px] tracking-[0.1em]">{title}</h3>
                </div>
            )}
            <div className="overflow-hidden border-y border-slate-200">
            <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-[11px] text-slate-700 uppercase bg-slate-50 border-b-2 border-[#c6e911]">
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                scope="col"
                                className={`px-4 py-3 font-semibold tracking-wide ${getAlignClass(col.align)}`}
                            >
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data && data.length > 0 ? (
                        data.map((row, index) => (
                            <tr key={index} className="bg-white border-b border-slate-100 last:border-0">
                                {columns.map((col) => (
                                    <td
                                        key={col.key}
                                        className={`px-4 py-3 ${
                                            index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                                        } ${getAlignClass(col.align)}`}
                                    >
                                        {col.render
                                            ? col.render(row)
                                            : col.formatter
                                                ? col.formatter(row[col.key])
                                                : row[col.key] || '—'}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr className="bg-white border-b border-slate-100">
                            <td
                                colSpan={columns.length}
                                className="px-5 py-8 text-center text-slate-500"
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    )}
                </tbody>
                {totalRow && (
                    <tfoot>
                        <tr
                            className={`font-bold ${
                                totalRow.isHighlighted
                                    ? 'bg-slate-50 border-t border-slate-200 text-slate-900'
                                    : 'bg-slate-50 border-t border-slate-200 text-slate-800'
                            }`}
                        >
                            <td
                                colSpan={columns.length - 1}
                                className="px-5 py-4 text-right text-sm"
                            >
                                {totalRow.label}:
                            </td>
                            <td
                                className={`px-5 py-4 text-right text-lg ${
                                    totalRow.isHighlighted ? 'text-slate-900' : ''
                                }`}
                            >
                                {totalRow.value}
                            </td>
                        </tr>
                    </tfoot>
                )}
            </table>
            </div>
        </div>
    );
};

export default DocumentTable;
