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
        },
      });
    }
  
    async findAll(user: User) {
      const where: Prisma.CrmTaskWhereInput = {
        user: {
          subsidiaryId: user.subsidiaryId,
        },
      };

      // Un utilisateur standard (ex: COMMERCIAL) ne voit que ses propres tâches.
      // Un ADMIN ou HR_MANAGER voit toutes les tâches de la filiale.
      const privilegedRoles: UserRole[] = [UserRole.ADMIN];
      if (!privilegedRoles.includes(user.userRole.toUpperCase() as UserRole)) {
        where.userId = user.id;
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
      if (task.userId !== user.id) {
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
  }
  