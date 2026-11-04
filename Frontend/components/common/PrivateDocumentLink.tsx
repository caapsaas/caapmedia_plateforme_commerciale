import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { downloadPrivateDocument, privateDocumentUrl } from '../../services/privateDocuments';

type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string };

export default function PrivateDocumentLink({ href, download, children, ...props }: Props) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  let protectedHref = '#';
  try { protectedHref = privateDocumentUrl(href); } catch { /* Invalid links are reported on click. */ }
  return <>
    <a {...props} href={protectedHref} aria-busy={busy} aria-disabled={busy} onClick={async (event) => {
      event.preventDefault();
      if (busy) return;
      setBusy(true);
      setFailed(false);
      try { await downloadPrivateDocument(href, typeof download === 'string' ? download : undefined); }
      catch { setFailed(true); }
      finally { setBusy(false); }
    }}>{children}</a>
    {failed && <span role="alert" className="text-sm text-red-600">{t('common.error')}</span>}
  </>;
}
