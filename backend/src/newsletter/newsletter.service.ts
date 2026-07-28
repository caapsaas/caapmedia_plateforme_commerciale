import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/utils/prisma/prisma.service';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';

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
      throw new ConflictException(
        'Cet e-mail est déjà inscrit à notre newsletter.',
      );
    }

    // Créer la nouvelle inscription
    return this.prisma.newsletter.create({
      data: {
        id: generateId(ID_PREFIXES.NEWSLETTER),
        email,
      },
    });
  }
}
