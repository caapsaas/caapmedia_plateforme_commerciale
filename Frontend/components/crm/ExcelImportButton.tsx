import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

export interface ExcelColumn {
    key: string;
    label: string;
    aliases?: string[];
    required?: boolean;
    validate?: (value: string) => boolean;
    defaultValue?: unknown;
    valueMap?: Record<string, unknown>;
    combineFrom?: string[];
    exactHeaderOnly?: boolean;
}

interface ExcelImportButtonProps {
    columns: ExcelColumn[];
    onImport: (rows: Record<string, unknown>[]) => Promise<{ imported: number; failed: number } | void> | { imported: number; failed: number } | void;
    title: string;
}

const normalize = (value: unknown) => String(value ?? '').trim().toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
const isPlaceholder = (value: unknown) => ['nontrouve', 'nontrouvee', 'nonconfirme', 'na', '-'].includes(normalize(value));
const SPREADSHEET_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const xmlElements = (root: Document | Element, name: string) => Array.from(root.getElementsByTagNameNS(SPREADSHEET_NS, name));

const csvRows = (text: string): string[][] => {
    const rows: string[][] = [];
    let row: string[] = [], field = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"' && quoted && text[i + 1] === '"') { field += '"'; i++; }
        else if (char === '"') quoted = !quoted;
        else if ((char === ',' || char === ';' || char === '\t') && !quoted) { row.push(field.trim()); field = ''; }
        else if ((char === '\n' || char === '\r') && !quoted) { if (char === '\r' && text[i + 1] === '\n') i++; row.push(field.trim()); if (row.some(Boolean)) rows.push(row); row = []; field = ''; }
        else field += char;
    }
    row.push(field.trim()); if (row.some(Boolean)) rows.push(row);
    return rows;
};

const readXlsx = async (buffer: ArrayBuffer): Promise<unknown[][]> => {
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    const decoder = new TextDecoder();
    const files = new Map<string, Uint8Array>();
    const signature = 0x02014b50;
    let offset = -1;
    for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65558); i--) if (view.getUint32(i, true) === 0x06054b50) { offset = view.getUint32(i + 16, true); break; }
    if (offset < 0) throw new Error('Le fichier Excel est invalide.');
    while (offset + 46 < bytes.length && view.getUint32(offset, true) === signature) {
        const method = view.getUint16(offset + 10, true), compressedSize = view.getUint32(offset + 20, true);
        const nameLength = view.getUint16(offset + 28, true), extraLength = view.getUint16(offset + 30, true), commentLength = view.getUint16(offset + 32, true);
        const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
        const local = view.getUint32(offset + 42, true), localName = view.getUint16(local + 26, true), localExtra = view.getUint16(local + 28, true);
        const start = local + 30 + localName + localExtra;
        const payload = bytes.slice(start, start + compressedSize);
        if (method === 0) files.set(name, payload);
        else if (method === 8) {
            const stream = new Blob([payload]).stream().pipeThrough(new DecompressionStream('deflate-raw' as CompressionFormat));
            files.set(name, new Uint8Array(await new Response(stream).arrayBuffer()));
        }
        offset += 46 + nameLength + extraLength + commentLength;
    }
    const xml = (name: string) => { const value = files.get(name); if (!value) throw new Error(`Feuille Excel absente : ${name}`); return new DOMParser().parseFromString(decoder.decode(value), 'application/xml'); };
    let strings: string[] = [];
    if (files.has('xl/sharedStrings.xml')) strings = xmlElements(xml('xl/sharedStrings.xml'), 'si').map(si => xmlElements(si, 't').map(t => t.textContent || '').join(''));
    const sheetName = [...files.keys()].find(name => /^xl\/worksheets\/sheet\d+\.xml$/.test(name));
    if (!sheetName) throw new Error('Aucune feuille trouvée dans le fichier Excel.');
    const sheet = xml(sheetName);
    const cells = xmlElements(sheet, 'c');
    const matrix: unknown[][] = [];
    for (const cell of cells) {
        const ref = cell.getAttribute('r') || '';
        const letters = ref.match(/[A-Z]+/)?.[0] || '';
        const rowIndex = Number(ref.match(/\d+/)?.[0] || 1) - 1;
        const colIndex = [...letters].reduce((n, char) => n * 26 + char.charCodeAt(0) - 64, 0) - 1;
        const value = xmlElements(cell, 'v')[0]?.textContent || '';
        const result = cell.getAttribute('t') === 's' ? (strings[Number(value)] || '') : cell.getAttribute('t') === 'inlineStr' ? xmlElements(cell, 't')[0]?.textContent || '' : value;
        matrix[rowIndex] ||= [];
        matrix[rowIndex][colIndex] = result;
    }
    return matrix;
};

function ExcelImportButton({ columns, onImport, title }: ExcelImportButtonProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');

    const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        setMessage('');
        setBusy(true);
        try {
            const matrix = /\.csv$/i.test(file.name) ? csvRows(await file.text()) : await readXlsx(await file.arrayBuffer());
            const aliases = (column: ExcelColumn) => [column.label, column.key, ...(column.aliases || [])].map(normalize);
            const matchHeader = (header: string, column: ExcelColumn) => {
                const normalizedHeader = normalize(header);
                const names = aliases(column);
                if (column.exactHeaderOnly) return names.includes(normalizedHeader);
                return names.some(name => normalizedHeader === name || (normalizedHeader.length >= 5 && name.includes(normalizedHeader)) || (name.length >= 5 && normalizedHeader.includes(name)));
            };
            const headerCandidates = matrix.map((row, index) => {
                const recognizedCells = row.reduce((count, cell) => count + Number(columns.some(column => matchHeader(String(cell ?? ''), column))), 0);
                const requiredMatches = columns.filter(column => column.required && row.some(cell => matchHeader(String(cell ?? ''), column))).length;
                return { index, score: recognizedCells, requiredMatches };
            });
            const bestHeader = headerCandidates.reduce((best, candidate) => candidate.score > best.score ? candidate : best, { index: -1, score: 0, requiredMatches: 0 });
            // One coincidental word in a title or data row must never be enough to
            // classify it as the header. Require several recognized column labels.
            const headerRow = bestHeader.score >= Math.min(3, columns.length) && bestHeader.requiredMatches > 0 ? bestHeader.index : -1;
            if (headerRow < 0) {
                const detectedRows = matrix.slice(0, 15).map((row, index) => `${index + 1}: ${row.filter(Boolean).map(String).join(' | ')}`).filter(row => !row.endsWith(': '));
                throw new Error(`En-têtes introuvables. Colonnes attendues : ${columns.filter(column => column.required).map(column => column.aliases?.[0] || column.label).join(', ')}. Lignes lues : ${detectedRows.join(' — ') || 'aucune cellule lisible'}.`);
            }
            const headers = matrix[headerRow].map(normalize);
            const indexes = columns.map(column => {
                // Prefer the canonical label/key over secondary aliases. In particular,
                // « Nom » and « Entreprise » must map to their distinct CRM fields even
                // when the spreadsheet lists « Entreprise » first.
                const exact = aliases(column).map(alias => headers.indexOf(alias)).find(index => index >= 0) ?? -1;
                return exact >= 0 || column.exactHeaderOnly ? exact : headers.findIndex(header => aliases(column).some(alias =>
                    alias.length >= 4 && header.length >= 4 && (header.includes(alias) || alias.includes(header))
                ));
            });
            const missing = columns.filter((column, index) => column.required && indexes[index] < 0);
            if (missing.length) throw new Error(`Colonnes obligatoires non reconnues : ${missing.map(column => column.aliases?.[0] || column.label).join(', ')}. En-têtes détectés : ${matrix[headerRow].filter(Boolean).join(', ')}.`);
            const mappedColumns = indexes.filter(index => index >= 0).length;
            const rows = matrix.slice(headerRow + 1).map(row => {
                const item: Record<string, unknown> = {};
                columns.forEach((column, index) => {
                    if (column.combineFrom) {
                        item[column.key] = column.combineFrom.flatMap(label => {
                            const sourceIndex = headers.indexOf(normalize(label));
                            const value = sourceIndex < 0 ? '' : String(row[sourceIndex] ?? '').trim();
                            return value && !isPlaceholder(value) ? [`${label}: ${value}`] : [];
                        }).join('\n');
                        return;
                    }
                    const raw = indexes[index] < 0 ? '' : row[indexes[index]];
                    let value: unknown = String(raw ?? '').trim();
                    if (isPlaceholder(value)) value = '';
                    if (column.valueMap && value) value = column.valueMap[normalize(value)] ?? column.defaultValue ?? value;
                    item[column.key] = value || column.defaultValue || '';
                });
                // Les fichiers de prospection ont souvent une seule colonne « Entreprise ».
                // Le modèle CRM exige aussi un nom de piste : réutiliser cette valeur évite
                // de rejeter un fichier utile ou de créer une piste sans nom.
                if (columns.some(column => column.key === 'leadName') && columns.some(column => column.key === 'company')) {
                    const leadName = String(item.leadName ?? '').trim();
                    const company = String(item.company ?? '').trim();
                    if (!leadName && company) item.leadName = company;
                    if (!company && leadName) item.company = leadName;
                }
                return item;
            }).filter(row => columns.some(column => String(row[column.key] ?? '').trim()));
            if (!rows.length) throw new Error('Aucune ligne de données trouvée.');
            const validRows = rows.filter(row => columns.every(column => {
                const value = String(row[column.key] ?? '').trim();
                return (!column.required || !!value) && (!value || !column.validate || column.validate(value));
            }));
            const skipped = rows.length - validRows.length;
            if (!validRows.length) throw new Error('Aucune ligne exploitable : vérifiez les champs obligatoires.');
            const summary = `${validRows.length} ${title.toLocaleLowerCase()} seront traitées. ${mappedColumns} champ(s) CRM reconnus sur ${columns.length}${skipped ? ` ; ${skipped} ligne(s) seront ignorées car un champ obligatoire est manquant ou invalide` : ''}. Continuer ?`;
            if (!window.confirm(summary)) return;
            const result = await onImport(validRows);
            const imported = result?.imported ?? validRows.length;
            const failed = result?.failed ?? 0;
            setMessage(`${imported} ligne(s) importée(s)${skipped ? `, ${skipped} ignorée(s)` : ''}${failed ? `, ${failed} échec(s)` : ''}.`);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Impossible de lire ce fichier Excel.');
        } finally {
            setBusy(false);
        }
    };

    return <div className="flex items-center gap-2">
        <input ref={inputRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={handleFile} />
        <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-50 disabled:opacity-50">
            <Upload className="h-4 w-4" />{busy ? 'Importation…' : 'Importer Excel'}
        </button>
        {message && <span role="status" className="text-xs text-slate-600">{message}</span>}
    </div>;
}

export default ExcelImportButton;
