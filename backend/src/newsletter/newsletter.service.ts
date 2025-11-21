import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/utils/prisma/prisma.service';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';

@Injectable()
export class NewsletterService {
  constructor(private prisma: PrismaService) {}

  async create(createNewsletterDto: CreateNewsletterDto) {
    const { email } = createNewsletterDto;

    // Vérifier si l'e-mail existe déjà
    const existingSubscriber = await this.prisma.newsletter.findUnique({
      where: { email },
    });

    if (existingSubscriber) {
      throw new ConflictException('Cet e-mail est déjà inscrit à notre newsletter.');
    }

    // Créer la nouvelle inscription
    return this.prisma.newsletter.create({ data: { email } });
  }
}
