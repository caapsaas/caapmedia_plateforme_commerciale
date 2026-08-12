import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {}

  sendWelcomeEmail(email: string, tempPassword: string, contactName: string) {
    // TODO: Implémenter l'envoi d'email réel avec un service comme SendGrid, Nodemailer, etc.
    console.log(`
      📧 EMAIL DE BIENVENUE - À ENVOYER
      =====================================
      Destinataire: ${email}
      Sujet: Bienvenue sur CAAP Media - Vos identifiants de connexion
      
      Cher/Chère ${contactName},
      
      Votre compte client a été créé avec succès sur notre plateforme.
      
      Identifiants de connexion:
      - Email: ${email}
      - Mot de passe temporaire: ${tempPassword}
      
      Veuillez vous connecter et changer votre mot de passe lors de votre première connexion.
      
      Lien de connexion: ${this.configService.get('FRONTEND_URL') || 'https://caapmedia.com'}/client/login
      
      Cordialement,
      L'équipe CAAP Media
    `);

    // Simulation d'envoi réussi
    return { success: true, message: 'Email envoyé avec succès' };
  }

  sendPasswordResetEmail(
    email: string,
    tempPassword: string,
    contactName: string,
  ) {
    console.log(`
      📧 EMAIL DE RÉINITIALISATION - À ENVOYER
      ==========================================
      Destinataire: ${email}
      Sujet: CAAP Media - Réinitialisation de votre mot de passe
      
      Cher/Chère ${contactName},
      
      Votre mot de passe a été réinitialisé.
      
      Nouveau mot de passe temporaire: ${tempPassword}
      
      Veuillez vous connecter et changer votre mot de passe dès que possible.
      
      Lien de connexion: ${this.configService.get('FRONTEND_URL') || 'https://caapmedia.com'}/client/login
      
      Cordialement,
      L'équipe CAAP Media
    `);

    return {
      success: true,
      message: 'Email de réinitialisation envoyé avec succès',
    };
  }

  /**
   * Convocation envoyée automatiquement à chaque participant d'une réunion
   * créée par le secrétariat (voir SecretariatService.createMeeting).
   */
  sendMeetingInvitationEmail(
    email: string,
    participantName: string,
    meeting: {
      title: string;
      meetingDateTime: Date;
      meetingLocation?: string | null;
      agenda?: string | null;
      organizerName?: string | null;
    },
  ) {
    const formattedDate = meeting.meetingDateTime.toLocaleString('fr-FR', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    // TODO: Implémenter l'envoi d'email réel avec un service comme SendGrid, Nodemailer, etc.
    console.log(`
      📧 CONVOCATION À UNE RÉUNION - À ENVOYER
      =====================================
      Destinataire: ${email}
      Sujet: Convocation - ${meeting.title}

      Cher/Chère ${participantName},

      Vous êtes convié(e) à la réunion suivante :

      - Objet: ${meeting.title}
      - Date et heure: ${formattedDate}
      - Lieu: ${meeting.meetingLocation || 'À préciser'}
      - Organisée par: ${meeting.organizerName || 'Le secrétariat'}

      Ordre du jour:
      ${meeting.agenda || 'Communiqué ultérieurement.'}

      Lien de connexion: ${this.configService.get('FRONTEND_URL')}/dashboard

      Cordialement,
      L'équipe CAAP Media
    `);

    return { success: true, message: 'Convocation envoyée avec succès' };
  }

  sendAccountingAccessNotificationEmail(
    email: string,
    recipientName: string,
    subject: string,
    body: string,
  ) {
    // TODO: Implémenter l'envoi d'email réel avec un service comme SendGrid, Nodemailer, etc.
    console.log(`
      📧 EMAIL COMPTABILITÉ - À ENVOYER
      =====================================
      Destinataire: ${email}
      Sujet: ${subject}

      Cher/Chère ${recipientName},

      ${body}

      Lien de connexion: ${this.configService.get('FRONTEND_URL')}/dashboard

      Cordialement,
      L'équipe CAAP Media
    `);

    return { success: true, message: 'Email envoyé avec succès' };
  }
}
