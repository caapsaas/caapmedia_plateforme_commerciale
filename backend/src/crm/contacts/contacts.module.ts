import { Module } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { JwtModule } from '@nestjs/jwt';
import { ContactJwtStrategy } from 'src/common/auth/strategies/contact-jwt.strategy';

@Module({
  imports: [
    JwtModule.register({
      // Ces valeurs devraient être dans un fichier de configuration
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [ContactsController],
  providers: [ContactsService, ContactJwtStrategy],
  exports: [ContactsService], // Exporter le service pour qu'il soit utilisable par d'autres modules
})
export class ContactsModule {}
