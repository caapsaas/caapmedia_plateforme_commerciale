import React from 'react';
import { useI18n } from '../../i18n';

interface DocumentTableProps {
    columns: {
        label: string;
        key: string;
        align?: 'left' | 'center' | 'right';
        formatter?: (value: any) => string;
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
        <div className="mb-10">
            {title && (
                <h3 className="font-semibold text-slate-700 uppercase text-xs tracking-wide mb-4">
                    {title}
                </h3>
            )}
            <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-[#c6e911] bg-opacity-25 border-t-2 border-b-2 border-[#c6e911]">
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                scope="col"
                                className={`px-6 py-4 font-bold ${getAlignClass(col.align)}`}
                            >
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data && data.length > 0 ? (
                        data.map((row, index) => (
                            <tr key={index} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                                {columns.map((col) => (
                                    <td
                                        key={col.key}
                                        className={`px-6 py-4 ${
                                            index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                                        } ${getAlignClass(col.align)}`}
                                    >
                                        {col.formatter
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
                                className="px-6 py-4 text-center text-slate-500"
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
                                    ? 'bg-[#c6e911] bg-opacity-15 border-t-2 border-[#c6e911] text-slate-900'
                                    : 'bg-slate-50 border-t-2 border-slate-200 text-slate-800'
                            }`}
                        >
                            <td
                                colSpan={columns.length - 1}
                                className="px-6 py-4 text-right text-base"
                            >
                                {totalRow.label}:
                            </td>
                            <td
                                className={`px-6 py-4 text-right text-lg ${
                                    totalRow.isHighlighted ? 'text-[#c6e911]' : ''
                                }`}
                            >
                                {totalRow.value}
                            </td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
};

export default DocumentTable;
