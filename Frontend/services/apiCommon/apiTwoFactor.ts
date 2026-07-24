import { api } from '../api';

export interface TwoFactorSetupResponse {
  qrCodeDataUrl: string;
  secret: string;
}

export interface TwoFactorVerifyResponse {
  message: string;
  recoveryCodes: string[];
}

/**
 * Genere un nouveau secret TOTP + QR code pour l'utilisateur connecte.
 * Le 2FA n'est pas encore actif tant que verifyTwoFactor() n'a pas confirme
 * un premier code valide.
 */
export const setupTwoFactor = async (): Promise<TwoFactorSetupResponse> => {
  const { data } = await api.post<TwoFactorSetupResponse>('/auth/2fa/setup');
  return data;
};

/**
 * Confirme l'activation avec un code TOTP. Renvoie les codes de secours en
 * clair - a n'afficher qu'une seule fois, jamais recuperables ensuite.
 */
export const verifyTwoFactor = async (code: string): Promise<TwoFactorVerifyResponse> => {
  const { data } = await api.post<TwoFactorVerifyResponse>('/auth/2fa/verify', { code });
  return data;
};

export const disableTwoFactor = async (password: string, code: string): Promise<{ message: string }> => {
  const { data } = await api.post<{ message: string }>('/auth/2fa/disable', { password, code });
  return data;
};
