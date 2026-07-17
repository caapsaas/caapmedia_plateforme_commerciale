import React, { useState, useMemo } from 'react';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { downloadCsvTemplate } from '../../utils/csvExporter';
import { Product } from '../../types';
import { PRODUCT_HIERARCHY, categoryToKeyMap } from '../../constants';
import IconFile from '../icons/IconFile';

interface ProductImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProductImportModal: React.FC<ProductImportModalProps> = ({ isOpen, onClose }) => {
    const { t } = useI18n();
    const { subsidiary } = useAuth();
    const { dispatch } = useAppContext();
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [importResult, setImportResult] = useState<{ successCount: number; errors: string[] } | null>(null);

    const subCategoryToMainCategoryMap = useMemo(() => {
        const map: Record<string, string> = {};
        PRODUCT_HIERARCHY.forEach(mainCat => {
            mainCat.subcategories.forEach(subCat => {
                map[subCat.name] = mainCat.category;
            });
        });
        return map;
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setImportResult(null);
        }
    };

    const handleImport = () => {
        if (!file) return;

        setIsProcessing(true);
        setImportResult(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const rows = text.split('\n').map(row => row.trim()).filter(row => row);
            
            if (rows.length < 2) {
                setImportResult({ successCount: 0, errors: ["Le fichier CSV est vide ou ne contient pas de lignes de données."] });
                setIsProcessing(false);
                return;
            }

            const header = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const expectedHeaders = ['name', 'category', 'description', 'stock', 'warehouse', 'range'];
            
            const headersMatch = expectedHeaders.every((h, i) => h === header[i]);
            if (!headersMatch) {
                 setImportResult({ successCount: 0, errors: [`En-têtes invalides. Attendu: ${expectedHeaders.join(',')}`] });
                 setIsProcessing(false);
                 return;
            }

            const newProducts: Product[] = [];
            const errors: string[] = [];
            const allCategories = new Set(Object.keys(categoryToKeyMap));

            for (let i = 1; i < rows.length; i++) {
                const rowData = rows[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(d => d.replace(/"/g, '').trim()) || [];
                const rowNumber = i + 1;

                if (rowData.length !== expectedHeaders.length) {
                    errors.push(`Ligne ${rowNumber}: Nombre de colonnes incorrect.`);
                    continue;
                }
                
                const productData = rowData.reduce((obj, val, index) => {
                    (obj as any)[expectedHeaders[index]] = val;
                    return obj;
                }, {} as any);
                
                const { name, category, stock } = productData;
                let hasError = false;

                if (!name) { errors.push(`Ligne ${rowNumber}: Le champ 'name' est requis.`); hasError = true; }
                if (!category) { errors.push(`Ligne ${rowNumber}: Le champ 'category' est requis.`); hasError = true; }
                if (category && !allCategories.has(category)) { errors.push(`Ligne ${rowNumber}: La catégorie '${category}' n'est pas valide.`); hasError = true; }

                const stockNum = parseFloat(stock);

                if (isNaN(stockNum)) { errors.push(`Ligne ${rowNumber}: 'stock' doit être un nombre.`); hasError = true; }

                if (hasError) continue;
                
                const mainCategory = subCategoryToMainCategoryMap[category] || 'Unknown';

                newProducts.push({
                    id: `P${Date.now()}-${i}`,
                    productName: name,
                    category,
                    mainCategory,
                    description: productData.description || '',
                    stock: stockNum,
                    warehouse: productData.warehouse || '',
                    range: productData.range || '',
                    subsidiaryId: subsidiary?.id ?? '',
                });
            }
            
            if (newProducts.length > 0) {
                dispatch({ type: 'ADD_BULK_PRODUCTS', payload: newProducts });
            }
            
            setImportResult({ successCount: newProducts.length, errors });
            setIsProcessing(false);
            setFile(null);
        };
        reader.onerror = () => {
            setImportResult({ successCount: 0, errors: ["Erreur lors de la lecture du fichier."] });
            setIsProcessing(false);
        }
        reader.readAsText(file);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h3 className="text-lg font-bold text-slate-900">Importer des produits depuis un CSV</h3>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <h4 className="font-semibold">Étape 1: Télécharger le modèle</h4>
                        <p className="text-sm text-slate-600 mb-2">Utilisez ce modèle pour vous assurer que vos données sont au bon format.</p>
                        <button type="button" onClick={downloadCsvTemplate} className="text-sm font-semibold text-[#c6e911] hover:underline">Télécharger le modèle CSV</button>
                    </div>

                    <div>
                        <h4 className="font-semibold">Étape 2: Charger votre fichier</h4>
                        <div className="mt-2 flex items-center gap-4">
                            <label htmlFor="csv-upload" className="cursor-pointer px-4 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                                Choisir un fichier
                            </label>
                            <input id="csv-upload" type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                            {file && <div className="flex items-center gap-2 text-sm"><IconFile className="h-5 w-5 text-slate-500"/><span>{file.name}</span></div>}
                        </div>
                    </div>

                    {importResult && (
                        <div className="mt-4 p-4 rounded-md bg-slate-50">
                            <h4 className="font-semibold">Résultat de l'importation</h4>
                            {importResult.successCount > 0 && <p className="text-green-600">{importResult.successCount} produits importés avec succès.</p>}
                            {importResult.errors.length > 0 && (
                                <div>
                                    <p className="text-red-600">{importResult.errors.length} erreurs trouvées:</p>
                                    <ul className="list-disc list-inside text-red-600 text-sm max-h-32 overflow-y-auto">
                                        {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">Fermer</button>
                    <button type="button" onClick={handleImport} disabled={!file || isProcessing} className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] disabled:bg-slate-400 transition-colors flex items-center justify-center min-w-[100px]">
                        {isProcessing ? (
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : "Importer"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductImportModal;
