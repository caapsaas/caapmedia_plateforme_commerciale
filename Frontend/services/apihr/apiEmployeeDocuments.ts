import { api } from '../api';

interface UploadedFile {
  fieldname: string;
  url: string;
  originalname: string;
}

interface UploadDocumentsResponse {
  uploadedFiles: UploadedFile[];
}

export const uploadEmployeeDocuments = async (
  files: { fieldname: string; file: File }[],
): Promise<UploadDocumentsResponse> => {
  const formData = new FormData();

  for (const { fieldname, file } of files) {
    formData.append(fieldname, file, file.name);
  }

  const response = await api.post(
    '/hr/employees/upload-documents',
    formData,
    {
      headers: {
        'Content-Type': undefined,
      },
    }
  );

  return response.data;
};

export const deleteEmployeeDocument = async (url: string): Promise<void> => {
  if (!url) return;

  try {
    await api.post('/hr/employees/delete-document', { url });
  } catch (error) {
    console.error('Error deleting document:', error);
    // Non-blocking error — don't throw
  }
};

export const getUploadedFileUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${window.location.origin}${url}`;
};
