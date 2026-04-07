import { api } from '../api';

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read?: boolean;
  createdAt?: string;
}

export interface AdminNotificationPayload {
  type: string;
  title: string;
  message: string;
  data: {
    transactionId?: string;
    subsidiaryId?: string;
    createdBy?: string;
    userName?: string;
  };
}

// Envoyer une notification aux administrateurs
export const sendAdminNotification = async (payload: AdminNotificationPayload): Promise<void> => {
  try {
    await api.post('/notifications/admin', payload);
  } catch (error) {
    console.error('Error sending admin notification:', error);
    throw error;
  }
};

// Envoyer une notification au directeur financier
export const sendFinancialDirectorNotification = async (payload: AdminNotificationPayload): Promise<void> => {
  try {
    await api.post('/notifications/financial-director', payload);
  } catch (error) {
    console.error('Error sending financial director notification:', error);
    throw error;
  }
};

// Envoyer un email spécifique à nalobert@gmail.com lors de la création de transaction par le directeur financier
export const sendEmailToNalobert = async (transactionData: {
  description: string;
  amount: number;
  creatorName: string;
  subsidiaryName: string;
  transactionType: string;
}): Promise<void> => {
  try {
    await api.post('/notifications/email-nalobert', {
      to: 'nalobert@gmail.com',
      subject: `Nouvelle transaction financière créée par ${transactionData.creatorName}`,
      message: `
        Bonjour,

        Une nouvelle transaction financière a été créée par ${transactionData.creatorName} (Directeur Financier).

        Détails de la transaction :
        - Description : ${transactionData.description}
        - Montant : ${transactionData.amount} €
        - Type : ${transactionData.transactionType}
        - Société : ${transactionData.subsidiaryName}
        - Date de création : ${new Date().toLocaleString('fr-FR')}

        Cordialement,
        Système de gestion financière
      `,
      transactionData
    });
  } catch (error) {
    console.error('Error sending email to nalobert:', error);
    throw error;
  }
};

// Récupérer les notifications de l'utilisateur courant
export const getUserNotifications = async (): Promise<NotificationData[]> => {
  try {
    const { data: response } = await api.get<NotificationData[]>('/notifications/user');
    return response;
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    throw error;
  }
};

// Marquer une notification comme lue
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    await api.patch(`/notifications/${notificationId}/read`);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Récupérer le nombre de notifications non lues
export const getUnreadNotificationsCount = async (): Promise<number> => {
  try {
    const { data: response } = await api.get<number>('/notifications/unread-count');
    return response;
  } catch (error) {
    console.error('Error fetching unread notifications count:', error);
    throw error;
  }
};
