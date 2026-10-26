import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Subsidiary } from '../../types';
import { createSubsidiary, deleteSubsidiary, getSubsidiaries, updateSubsidiary, uploadSubsidiaryLogo } from '../../services/apiCommon/apiSubsidiaries';
import { useToast } from '../../context/ToastContext';
import IconPlus from '../icons/IconPlus';
import IconEdit from '../icons/IconEdit';
import IconDelete from '../icons/IconDelete';
import ConfirmationModal from '../common/ConfirmationModal';
import EmptyState from '../ui/EmptyState';
import TableSkeleton from '../ui/TableSkeleton';
import ConfigurationSearch from './ConfigurationSearch';
import { getImageUrl } from '../../utils/imageUtils';

type SubsidiaryForm = {
  subsidiaryName: string;
  address: string;
  phone: string;
  email: string;
  ifu: string;
  rccm: string;
  bankName: string;
  accountNumber: string;
  swiftCode: string;
  shareCapital: number;
  taxRate: number;
  isHeadquarter: boolean;
};

const EMPTY_FORM: SubsidiaryForm = {
  subsidiaryName: '', address: '', phone: '', email: '', ifu: '', rccm: '',
  bankName: '', accountNumber: '', swiftCode: '', shareCapital: 0, taxRate: 0.3,
  isHeadquarter: false,
};

const SubsidiaryManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Subsidiary | null>(null);
  const [deleting, setDeleting] = useState<Subsidiary | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<SubsidiaryForm>(EMPTY_FORM);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const { data: subsidiaries = [], isLoading } = useQuery<Subsidiary[]>({
    queryKey: ['subsidiaries'],
    queryFn: getSubsidiaries,
  });
  useEffect(() => {
    if (!logo) { setLogoPreview(null); return; }
    const previewUrl = URL.createObjectURL(logo);
    setLogoPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [logo]);
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return subsidiaries;
    return subsidiaries.filter((item) => [item.subsidiaryName, item.email, item.address, item.phone, item.ifu, item.rccm]
      .some((value) => value?.toLocaleLowerCase().includes(term)));
  }, [subsidiaries, search]);

  const closeForm = () => {
    setFormOpen(false); setEditing(null); setLogo(null); setFormError(''); setForm(EMPTY_FORM);
  };
  const openCreate = () => { closeForm(); setFormOpen(true); };
  const openEdit = (item: Subsidiary) => {
    setEditing(item);
    setForm({
      subsidiaryName: item.subsidiaryName || item.name || '', address: item.address || '',
      phone: item.phone || '', email: item.email || '', ifu: item.ifu || '', rccm: item.rccm || '',
      bankName: item.bankName || item.bankDetails?.bankName || '', accountNumber: item.accountNumber || item.bankDetails?.accountNumber || '',
      swiftCode: item.swiftCode || item.bankDetails?.swift || '', shareCapital: Number(item.shareCapital || 0),
      taxRate: Number(item.taxRate ?? 0.3), isHeadquarter: !!item.isHeadquarter,
    });
    setLogo(null); setFormError(''); setFormOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const saved = editing
        ? await updateSubsidiary(editing.id, form)
        : await createSubsidiary(form);
      if (!logo) return saved;
      try {
        return await uploadSubsidiaryLogo(saved.id, logo);
      } catch (error) {
        if (!editing) {
          const wrapped = new Error('La filiale a été créée mais le logo n’a pas pu être envoyé.') as Error & { createdSubsidiary?: Subsidiary };
          wrapped.createdSubsidiary = saved;
          throw wrapped;
        }
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['subsidiaries'] });
      toast.success('Filiale enregistrée', 'Les informations de la filiale ont été enregistrées.');
      closeForm();
    },
    onError: (error) => {
      const createdSubsidiary = (error as Error & { createdSubsidiary?: Subsidiary }).createdSubsidiary;
      if (createdSubsidiary) {
        setEditing(createdSubsidiary);
        void queryClient.invalidateQueries({ queryKey: ['subsidiaries'] });
        setFormError('La filiale a été créée, mais le logo n’a pas pu être envoyé. Réessayez l’envoi du logo.');
        return;
      }
      setFormError('Enregistrement impossible. Vérifiez les champs et réessayez.');
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSubsidiary(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['subsidiaries'] });
      toast.success('Filiale supprimée', 'La filiale a été supprimée.');
      setDeleting(null);
    },
    onError: () => toast.error('Suppression impossible', 'Vérifiez que la filiale ne contient plus de données rattachées.'),
  });

  const setField = <K extends keyof SubsidiaryForm>(key: K, value: SubsidiaryForm[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault(); setFormError(''); saveMutation.mutate();
  };

  return (
    <section className="rounded-xl bg-white p-6 shadow-md">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="text-xl font-semibold text-slate-800">Gestion des filiales</h3><p className="mt-1 text-sm text-slate-500">Coordonnées, informations administratives et identité visuelle.</p></div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-md bg-[#c6e911] px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-[#adc40f]"><IconPlus className="h-4 w-4" />Nouvelle filiale</button>
      </div>
      <ConfigurationSearch value={search} onChange={setSearch} placeholder="Rechercher une filiale..." />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase text-slate-700"><tr><th className="px-4 py-3">Logo</th><th className="px-4 py-3">Filiale</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Téléphone</th><th className="px-4 py-3">Ville / adresse</th><th className="px-4 py-3 text-center">Actions</th></tr></thead>
          <tbody>
            {isLoading ? <TableSkeleton rows={5} columns={6} /> : filtered.length === 0 ? <tr><td colSpan={6}><EmptyState icon="inbox" title="Aucune filiale" description={search ? 'Aucun résultat pour cette recherche.' : 'Créez la première filiale.'} /></td></tr> : filtered.map((item) => (
              <tr key={item.id} className="border-b hover:bg-slate-50">
                <td className="px-4 py-3"><div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded border bg-slate-50">{item.logoSvg ? <img src={getImageUrl(item.logoSvg)} alt={`Logo ${item.subsidiaryName}`} className="h-full w-full object-contain" /> : <span className="text-xs text-slate-400">—</span>}</div></td>
                <td className="px-4 py-3 font-semibold text-slate-800">{item.subsidiaryName || item.name}{item.isHeadquarter && <span className="ml-2 rounded bg-slate-100 px-2 py-1 text-xs">Siège</span>}</td>
                <td className="px-4 py-3">{item.email}</td><td className="px-4 py-3">{item.phone}</td><td className="px-4 py-3">{item.address}</td>
                <td className="px-4 py-3 text-center"><button onClick={() => openEdit(item)} className="mr-1 rounded-full p-2 text-slate-500 hover:bg-blue-100 hover:text-blue-600" aria-label="Modifier"><IconEdit className="h-5 w-5" /></button><button onClick={() => setDeleting(item)} className="rounded-full p-2 text-slate-500 hover:bg-red-100 hover:text-red-600" aria-label="Supprimer"><IconDelete className="h-5 w-5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {formOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeForm}>
        <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
          <form onSubmit={handleSubmit}>
            <div className="border-b p-6"><h3 className="text-xl font-bold text-slate-800">{editing ? 'Modifier la filiale' : 'Créer une filiale'}</h3></div>
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              {([
                ['subsidiaryName', 'Nom de la filiale'], ['email', 'Email'], ['phone', 'Téléphone'], ['address', 'Adresse'],
                ['ifu', 'IFU'], ['rccm', 'RCCM'], ['bankName', 'Banque'], ['accountNumber', 'Compte bancaire'], ['swiftCode', 'Code SWIFT'],
              ] as const).map(([key, label]) => <label key={key} className="text-sm font-medium text-slate-700">{label}<input required type={key === 'email' ? 'email' : 'text'} value={form[key]} onChange={(event) => setField(key, event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>)}
              <label className="text-sm font-medium text-slate-700">Capital social (FCFA)<input required min="0" type="number" value={form.shareCapital} onChange={(event) => setField('shareCapital', Number(event.target.value))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
              <label className="text-sm font-medium text-slate-700">Taux IS (%)<input required min="0" max="100" step="0.01" type="number" value={form.taxRate * 100} onChange={(event) => setField('taxRate', Number(event.target.value) / 100)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={form.isHeadquarter} onChange={(event) => setField('isHeadquarter', event.target.checked)} />Cette filiale est le siège</label>
              <label className="text-sm font-medium text-slate-700">Logo (PNG ou JPEG, 5 Mo max)<input type="file" accept="image/png,image/jpeg" onChange={(event) => setLogo(event.target.files?.[0] || null)} className="mt-1 block w-full text-sm" /></label>
              {logo && <div className="flex items-center gap-3 text-sm text-slate-500"><img src={logoPreview || ''} alt="Aperçu du logo" className="h-12 w-12 object-contain" />{logo.name}</div>}
              {formError && <p className="md:col-span-2 rounded bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
            </div>
            <div className="flex justify-end gap-3 border-t bg-slate-50 p-5"><button type="button" onClick={closeForm} className="rounded-md bg-slate-200 px-4 py-2 text-sm">Annuler</button><button disabled={saveMutation.isPending} className="rounded-md bg-[#c6e911] px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-50">{saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}</button></div>
          </form>
        </div>
      </div>}
      {deleting && <ConfirmationModal isOpen onClose={() => setDeleting(null)} onConfirm={() => deleteMutation.mutate(deleting.id)} title="Supprimer la filiale" message={`Confirmez-vous la suppression de ${deleting.subsidiaryName || deleting.name} ? Cette action échouera si des données y sont encore rattachées.`} />}
    </section>
  );
};

export default SubsidiaryManagement;
