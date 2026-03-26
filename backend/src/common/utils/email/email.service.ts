import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {}

  async sendWelcomeEmail(email: string, tempPassword: string, contactName: string) {
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
      
      Lien de connexion: ${this.configService.get('FRONTEND_URL')}/client/login
      
      Cordialement,
      L'équipe CAAP Media
    `);
    
    // Simulation d'envoi réussi
    return { success: true, message: 'Email envoyé avec succès' };
  }

  async sendPasswordResetEmail(email: string, tempPassword: string, contactName: string) {
    console.log(`
      📧 EMAIL DE RÉINITIALISATION - À ENVOYER
      ==========================================
      Destinataire: ${email}
      Sujet: CAAP Media - Réinitialisation de votre mot de passe
      
      Cher/Chère ${contactName},
      
      Votre mot de passe a été réinitialisé.
      
      Nouveau mot de passe temporaire: ${tempPassword}
      
      Veuillez vous connecter et changer votre mot de passe dès que possible.
      
      Lien de connexion: ${this.configService.get('FRONTEND_URL')}/client/login
      
      Cordialement,
      L'équipe CAAP Media
    `);
    
    return { success: true, message: 'Email de réinitialisation envoyé avec succès' };
  }
}
