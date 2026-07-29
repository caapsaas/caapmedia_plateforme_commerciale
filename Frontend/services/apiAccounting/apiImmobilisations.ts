import { api } from '../api';

export interface DepreciationResultLine {
  assetId: string;
  name: string;
  dotation: number;
  skipped?: string;
}

export interface DepreciationResult {
  year: number;
  totalDotation: number;
  assets: DepreciationResultLine[];
}

export const generateAnnualDepreciation = async (
  year: number,
  subsidiaryId?: string,
): Promise<DepreciationResult> => {
  const { data } = await api.post<DepreciationResult>(
    '/accounting/immobilisations/generate-depreciation',
    { year, subsidiaryId },
  );
  return data;
};

export interface DisposeFixedAssetDto {
  disposalDate: string;
  disposalAmount: number;
}

export const disposeFixedAsset = async (id: string, dto: DisposeFixedAssetDto) => {
  const { data } = await api.post(`/accounting/immobilisations/${id}/dispose`, dto);
  return data;
};
