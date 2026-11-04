"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let EmailService = class EmailService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    sendWelcomeEmail(email, tempPassword, contactName) {
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
        return { success: true, message: 'Email envoyé avec succès' };
    }
    sendPasswordResetEmail(email, tempPassword, contactName) {
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
    sendMeetingInvitationEmail(email, participantName, meeting) {
        const formattedDate = meeting.meetingDateTime.toLocaleString('fr-FR', {
            dateStyle: 'full',
            timeStyle: 'short',
        });
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
    sendAccountingAccessNotificationEmail(email, recipientName, subject, body) {
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
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map