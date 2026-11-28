import { api } from '../api';

export interface GlobalSearchResultItem {
  id: string;
  category:
    | 'ORDER'
    | 'PROFORMA'
    | 'CONTACT'
    | 'LEAD'
    | 'SUPPLIER'
    | 'EMPLOYEE'
    | 'ITEM'
    | 'EQUIPMENT';
  title: string;
  subtitle: string;
  status?: string;
  route: string;
}

export const globalSearch = async (q: string): Promise<GlobalSearchResultItem[]> => {
  const { data } = await api.get<GlobalSearchResultItem[]>('/search', {
    params: { q },
  });
  return data;
};
