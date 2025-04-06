import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Task } from '../../modules/tasks/entities/task.entity';
import { TaskStatus } from '../../modules/tasks/enums/task-status.enum';

@Injectable()
export class OverdueTasksService {
  private readonly logger = new Logger(OverdueTasksService.name);

  constructor(
    @InjectQueue('task-processing')
    private taskQueue: Queue,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkOverdueTasks() {
    this.logger.debug('Checking for overdue tasks...');

    const now = new Date();
    const overdueTasks = await this.tasksRepository.find({
      where: {
        dueDate: LessThan(now),
        status: TaskStatus.PENDING,
      },
    });

    this.logger.log(`Found ${overdueTasks.length} overdue tasks`);

    //  Sequential approach
    for (const task of overdueTasks) {
      await this.taskQueue.add('process-overdue-task', {
        taskId: task.id,
      });
    }

    //  Parallel approach with queue options
    // await Promise.all(
    //   overdueTasks.map(task =>
    //     this.taskQueue.add(
    //       'process-overdue-task',
    //       { taskId: task.id },
    //       { attempts: 3, backoff: { type: 'exponential', delay: 5000 } } // retries + backoff
    //     )
    //   )
    // );

    this.logger.log(`Queued ${overdueTasks.length} overdue tasks for processing`);
    this.logger.debug('Overdue tasks check completed');
  }
}
