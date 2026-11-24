import { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import FormRenderer, { type SpecValues } from '../common/FormRenderer';
import { getFormDefinition } from '../../services/apiE-commerce/apiProductSpecs';
import { SpecFieldType } from '../../types';
import { X } from 'lucide-react';
import { useI18n } from '../../i18n';
import type { Proforma, ProformaConversionInput } from '../../services/apiCrm/apiProformas';

interface ConvertProformaModalProps {
  proforma: Proforma;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (input: ProformaConversionInput) => void;
}

export default function ConvertProformaModal({ proforma, isPending, onClose, onConfirm }: ConvertProformaModalProps) {
  const { t, formatCurrency } = useI18n();
  const [paymentDueDate, setPaymentDueDate] = useState('');
  const [specValues, setSpecValues] = useState<Record<string, SpecValues>>({});
  const [designFiles, setDesignFiles] = useState<Record<string, File | undefined>>({});
  const productIds = [...new Set<string>(proforma.items.map((item) => item.productId))];
  const definitions = useQueries({
    queries: productIds.map((productId) => ({
      queryKey: ['product-form-definition', productId],
      queryFn: () => getFormDefinition(productId),
    })),
  });
  const definitionsByProduct = new Map(productIds.map((productId, index) => [productId, definitions[index]?.data]));
  const loading = definitions.some((definition) => definition.isPending);
  const failed = definitions.some((definition) => definition.isError);
  const missingRequiredFile = proforma.items.some((item) => {
    const schema = definitionsByProduct.get(item.productId);
    const fields = schema
      ? [...schema.ungroupedSpecifications, ...schema.groups.flatMap((group) => group.specifications)]
      : [];
    return fields.some((field) => field.type === SpecFieldType.UPLOAD && field.required) && !designFiles[item.id];
  });
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Africa/Douala' });
  const canConvert =
    !isPending && !loading && !failed && !!paymentDueDate && paymentDueDate >= today && !missingRequiredFile;

  return (
    <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="convert-proforma-title"
        className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          if (canConvert)
            onConfirm({
              paymentDueDate,
              items: proforma.items.map((item) => ({
                id: item.id,
                specValues: specValues[item.id],
                designFile: designFiles[item.id],
              })),
            });
        }}
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 p-4 sm:px-6">
          <div>
            <h2 id="convert-proforma-title" className="text-lg font-bold text-slate-900">
              {t('proforma.actions.convert')}
            </h2>
            <p className="text-sm text-slate-600">
              {proforma.proformaNumber} · {proforma.clientName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            aria-label={t('common.close')}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 space-y-4 overflow-auto p-4 sm:px-6">
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm">
            {proforma.items.map((item, index) => (
              <li key={index} className="flex justify-between gap-3 py-2">
                <span>
                  {item.quantity} × {item.product?.name ?? item.productId}
                </span>
                <span className="shrink-0 font-semibold">
                  {formatCurrency(Number(item.unitPrice) * item.quantity, 2)}
                </span>
              </li>
            ))}
            <li className="flex justify-between gap-3 py-2 font-bold">
              <span>{t('proforma.form.lineTotal')}</span>
              <span>{formatCurrency(Number(proforma.totalAmount), 2)}</span>
            </li>
          </ul>
          {loading && (
            <p role="status" className="text-sm text-slate-600">
              {t('common.loading')}
            </p>
          )}
          {failed && (
            <div role="alert" className="text-sm text-red-700">
              {t('proforma.conversionSpecsError')}{' '}
              <button
                type="button"
                className="underline"
                onClick={() =>
                  definitions.forEach((definition) => {
                    if (definition.isError) void definition.refetch();
                  })
                }
              >
                {t('proforma.previewRetry')}
              </button>
            </div>
          )}
          {!loading &&
            !failed &&
            proforma.items.map((item) => {
              const schema = definitionsByProduct.get(item.productId);
              if (!schema) return null;
              const fields = [
                ...schema.ungroupedSpecifications,
                ...schema.groups.flatMap((group) => group.specifications),
              ];
              const requiredFile = fields.some((field) => field.type === SpecFieldType.UPLOAD && field.required);
              const withoutUploads = (specifications: typeof schema.ungroupedSpecifications) =>
                specifications.filter((field) => field.type !== SpecFieldType.UPLOAD);
              return (
                <fieldset
                  key={item.id}
                  disabled={isPending}
                  className="space-y-3 rounded-xl border border-slate-200 p-3"
                >
                  <legend className="px-1 text-sm font-semibold text-slate-900">
                    {item.quantity} × {item.product?.name ?? item.productId}
                  </legend>
                  {fields.some((field) => field.type !== SpecFieldType.UPLOAD) && (
                    <FormRenderer
                      schema={{
                        ...schema,
                        ungroupedSpecifications: withoutUploads(schema.ungroupedSpecifications),
                        groups: schema.groups.flatMap((group) => {
                          const specifications = withoutUploads(group.specifications);
                          return specifications.length ? [{ ...group, specifications }] : [];
                        }),
                      }}
                      values={specValues[item.id] ?? {}}
                      onChange={(key, value) =>
                        setSpecValues((current) => ({
                          ...current,
                          [item.id]: { ...current[item.id], [key]: value },
                        }))
                      }
                      readOnly={isPending}
                    />
                  )}
                  <label className="block text-sm font-medium text-slate-800">
                    {t('proforma.conversionDesignFile')}
                    {requiredFile ? ' *' : ''}
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      className="mt-1 block w-full text-sm text-slate-600"
                      onChange={(event) =>
                        setDesignFiles((current) => ({ ...current, [item.id]: event.target.files?.[0] }))
                      }
                    />
                  </label>
                </fieldset>
              );
            })}
          <label className="block text-sm font-semibold text-slate-800">
            {t('proforma.conversionDueDate')}
            <input
              required
              type="date"
              min={today}
              value={paymentDueDate}
              disabled={isPending}
              onChange={(event) => setPaymentDueDate(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
            />
          </label>
          <p className="text-sm text-slate-600">{t('proforma.conversionPendingValidation')}</p>
        </div>
        <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-200 p-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg px-4 py-2 text-sm font-semibold hover:bg-slate-100"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={!canConvert}
            className="rounded-lg bg-[#c6e911] px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-[#adc40f] disabled:opacity-50"
          >
            {t(isPending ? 'common.loading' : 'proforma.actions.convert')}
          </button>
        </footer>
      </form>
    </div>
  );
}
