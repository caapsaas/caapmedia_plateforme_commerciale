import { api } from '../api';
import { CompanyDocument, DocumentCategory, DocumentStatus } from '../../types';

/**
 * DTO pour la création ou la mise à jour d'un document d'entreprise.
 * Nous utilisons FormData pour gérer le téléversement de fichiers.
 */
export interface SaveDocumentDto {
  id?: string;
  name: string;
  category: DocumentCategory;
  status: DocumentStatus;
  file?: File; // Le fichier à téléverser
}

/**
 * Récupère tous les documents de l'entreprise, potentiellement filtrés.
 */
export const getDocuments = async (): Promise<CompanyDocument[]> => {
  const { data } = await api.get<CompanyDocument[]>('/secretariat/documents');
  return data;
};

/**
 * Crée ou met à jour un document d'entreprise.
 * Gère le téléversement de fichiers en utilisant FormData.
 * @param documentData - Les données du document et le fichier.
 */
export const saveDocument = async (documentData: SaveDocumentDto): Promise<CompanyDocument> => {
  const formData = new FormData();
  formData.append('name', documentData.name);
  formData.append('category', documentData.category);
  formData.append('status', documentData.status);
  if (documentData.file) {
    formData.append('file', documentData.file);
  }

  const config = {
    headers: { 'Content-Type': 'multipart/form-data' },
  };

  return documentData.id
    ? (await api.patch<CompanyDocument>(`/secretariat/documents/${documentData.id}`, formData, config)).data
    : (await api.post<CompanyDocument>('/secretariat/documents', formData, config)).data;
};

/**
 * Supprime un document par son ID.
 */
export const deleteDocument = async (id: string): Promise<void> => {
  await api.delete(`/secretariat/documents/${id}`);
};
