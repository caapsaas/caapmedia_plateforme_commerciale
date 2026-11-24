import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '../../i18n';
import { getProformaPdf, Proforma } from '../../services/apiCrm/apiProformas';

export default function ProformaPdfActions({ proforma }: { proforma: Proforma }) {
  const { t } = useI18n();
  const [url, setUrl] = useState<string | null>(null);
  const pdf = useQuery({
    queryKey: ['proformas', 'pdf', proforma.id],
    queryFn: ({ signal }) => getProformaPdf(proforma.id, signal),
    gcTime: 0,
    retry: false,
  });

  useEffect(() => {
    if (!pdf.data) return;
    const objectUrl = URL.createObjectURL(pdf.data);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [pdf.data]);

  const filename = `proforma_${proforma.proformaNumber.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100)}.pdf`;
  const linkClass =
    'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100';

  if (pdf.isError) {
    return (
      <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
        <p>{t('proforma.previewError')}</p>
        <button type="button" className="mt-2 font-semibold underline" onClick={() => void pdf.refetch()}>
          {t('proforma.previewRetry')}
        </button>
      </div>
    );
  }

  if (!url)
    return (
      <p role="status" className="p-4 text-sm text-slate-600">
        {t('common.loading')}
      </p>
    );

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <a href={url} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {t('proforma.previewNewTab')}
      </a>
      <a href={url} download={filename} className={linkClass}>
        {t('common.exportPdf')}
      </a>
    </div>
  );
}
