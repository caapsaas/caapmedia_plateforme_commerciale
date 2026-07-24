import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Prisma, User, UserRole, CrmTaskStatus } from '@prisma/client';

@Injectable()
export class CrmtasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto, creator: User) {
    // Vérifier que le contact existe et appartient à la même filiale
    const contact = await this.prisma.contact.findFirst({
      where: {
        id: createTaskDto.contactId,
        subsidiaryId: creator.subsidiaryId,
      },
    });

    if (!contact) {
      throw new NotFoundException(
        `Contact with ID "${createTaskDto.contactId}" not found in this subsidiary.`,
      );
    }

    // La tâche est assignée à l'utilisateur qui la crée
    return this.prisma.crmTask.create({
      data: {
        ...createTaskDto,
        userId: creator.id,
        status: CrmTaskStatus.TODO, // Définir le statut par défaut
        dueDate: new Date(createTaskDto.dueDate),
      },
    });
  }

  async findAll(user: User) {
    const isSuperAdmin = user.userRole === UserRole.SUPER_ADMIN;
    const where: Prisma.CrmTaskWhereInput = isSuperAdmin
      ? {}
      : { user: { subsidiaryId: user.subsidiaryId } };

    if (!isSuperAdmin) {
      const privilegedRoles: UserRole[] = [
        UserRole.ADMIN,
        UserRole.SECRETARY,
        UserRole.FINANCIAL_DIRECTOR,
      ];
      if (!privilegedRoles.includes(user.userRole)) {
        where.userId = user.id;
      }
    }

    return this.prisma.crmTask.findMany({
      where,
      include: {
        contact: { select: { contactName: true } },
        opportunity: { select: { opportunityName: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findOne(id: string, user: User) {
    const task = await this.prisma.crmTask.findUnique({
      where: { id },
      include: { contact: true, opportunity: true },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found.`);
    }
    // Vérifier que l'utilisateur a le droit de voir cette tâche
    const privilegedRoles: UserRole[] = [
      UserRole.ADMIN,
      UserRole.SECRETARY,
      UserRole.FINANCIAL_DIRECTOR,
    ];
    if (!privilegedRoles.includes(user.userRole) && task.userId !== user.id) {
      throw new ForbiddenException('You are not allowed to view this task.');
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, user: User) {
    await this.findOne(id, user); // Vérifie l'existence et les droits
    return this.prisma.crmTask.update({ where: { id }, data: updateTaskDto });
  }

  async remove(id: string, user: User) {
    await this.findOne(id, user); // Vérifie l'existence et les droits
    return this.prisma.crmTask.delete({ where: { id } });
  }

  async updateStatus(id: string, status: CrmTaskStatus, user: User) {
    await this.findOne(id, user); // Vérifie l'existence et les droits
    return this.prisma.crmTask.update({
      where: { id },
      data: { status },
    });
  }
}
