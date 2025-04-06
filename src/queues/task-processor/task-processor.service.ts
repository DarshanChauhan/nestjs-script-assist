import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TasksService } from '../../modules/tasks/tasks.service';

@Injectable()
@Processor('task-processing')
export class TaskProcessorService extends WorkerHost {
  private readonly logger = new Logger(TaskProcessorService.name);

  constructor(private readonly tasksService: TasksService) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);

    try {
      switch (job.name) {
        case 'task-status-update':
          return await this.handleStatusUpdate(job);
        case 'overdue-tasks-notification':
          return await this.handleOverdueTasks(job);
        default:
          this.logger.warn(`Unknown job type: ${job.name}`);
          return { success: false, error: 'Unknown job type' };
      }
    } catch (error) {
      this.logger.error(
        `Failed to mark job ${job.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  private async handleStatusUpdate(job: Job) {
    const { taskId, status } = job.data;

    if (!taskId || !status) {
      return { success: false, error: 'Missing required data' };
    }

    try {
      const task = await this.tasksService.updateStatus(taskId, status);
      return {
        success: true,
        taskId: task.id,
        newStatus: task.status,
      };
    } catch (err) {
      this.logger.error(`Failed to update task status: ${err}`);
      return { success: false, error: 'Task update failed' };
    }
  }

  private async handleOverdueTasks(job: Job) {
    this.logger.debug('Processing overdue tasks notification');

    const { overdueTaskIds } = job.data;

    if (!Array.isArray(overdueTaskIds)) {
      return { success: false, error: 'Invalid or missing overdueTaskIds array' };
    }

    const results = [];

    for (const taskId of overdueTaskIds) {
      try {
        await this.tasksService.markAsOverdue(taskId);
        results.push({ taskId, success: true });
      } catch (err) {
        this.logger.error(`Failed to mark task ${taskId} as overdue: ${err}`);
        results.push({ taskId, success: false, error: err });
      }
    }

    return {
      success: true,
      processed: results.length,
      details: results,
    };
  }
}
