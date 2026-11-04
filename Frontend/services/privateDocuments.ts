import { api } from './api';
import { BACKEND_ORIGIN } from './apiConfig';

export function privateDocumentUrl(value: string): string {
  const url = new URL(value.replace(/\\/g, '/'), `${BACKEND_ORIGIN}/`);
  if (url.origin !== new URL(BACKEND_ORIGIN).origin) throw new Error('Invalid document origin');
  url.pathname = url.pathname
    .replace(/^\/public\/employee-documents\//, '/api-caapmedia/private-documents/employee-documents/')
    .replace(/^\/public\/uploads\/secretariat\//, '/api-caapmedia/private-documents/secretariat/');
  if (!url.pathname.startsWith('/api-caapmedia/private-documents/')) throw new Error('Invalid document path');
  return url.href;
}

export async function downloadPrivateDocument(url: string, filename?: string): Promise<void> {
  const response = await api.get<Blob>(privateDocumentUrl(url), { responseType: 'blob' });
  const objectUrl = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename || new URL(url, BACKEND_ORIGIN).pathname.split('/').pop() || 'document';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
