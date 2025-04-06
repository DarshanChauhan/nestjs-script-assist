import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TaskStatus } from './enums/task-status.enum';
import { TaskPriority } from './enums/task-priority.enum';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,

    @InjectQueue('task-processing')
    private taskQueue: Queue,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const task = this.tasksRepository.create(createTaskDto);
    const savedTask = await this.tasksRepository.save(task);

    await this.taskQueue.add('task-status-update', {
      taskId: savedTask.id,
      status: savedTask.status,
    });

    return savedTask;
  }

  async findAll(): Promise<Task[]> {
    return this.tasksRepository.find({ relations: ['user'] });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({ where: { id }, relations: ['user'] });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);
    const originalStatus = task.status;

    Object.assign(task, updateTaskDto);

    const updatedTask = await this.tasksRepository.save(task);

    if (originalStatus !== updatedTask.status) {
      await this.taskQueue.add('task-status-update', {
        taskId: updatedTask.id,
        status: updatedTask.status,
      });
    }

    return updatedTask;
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.tasksRepository.remove(task);
  }

  async findWithFilters(status?: string, priority?: string, page = 1, limit = 10): Promise<any> {
    const query = this.tasksRepository.createQueryBuilder('task');

    if (status) query.andWhere('task.status = :status', { status });
    if (priority) query.andWhere('task.priority = :priority', { priority });

    query.skip((page - 1) * limit).take(limit);

    const [data, count] = await query.getManyAndCount();

    return {
      data,
      count,
      page,
      limit,
    };
  }

  async getStats() {
    const tasks = await this.tasksRepository.find();

    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
      inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
      pending: tasks.filter(t => t.status === TaskStatus.PENDING).length,
      highPriority: tasks.filter(t => t.priority === TaskPriority.HIGH).length,
    };
  }

  async updateStatus(id: string, status: string): Promise<Task> {
    const task = await this.findOne(id);
    task.status = status as TaskStatus;
    return this.tasksRepository.save(task);
  }

  async batchProcess(operations: { tasks: string[]; action: string }) {
    const { tasks: taskIds, action } = operations;
    const results = [];

    for (const taskId of taskIds) {
      try {
        let result;
        switch (action) {
          case 'complete':
            result = await this.update(taskId, { status: TaskStatus.COMPLETED });
            break;
          case 'delete':
            await this.remove(taskId);
            result = { message: 'Deleted' };
            break;
          default:
            throw new HttpException(`Unknown action: ${action}`, HttpStatus.BAD_REQUEST);
        }
        results.push({ taskId, success: true, result });
      } catch (error) {
        results.push({
          taskId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  async markAsOverdue(taskId: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({ where: { id: taskId } });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    task.status = TaskStatus.OVERDUE;
    return await this.tasksRepository.save(task);
  }
}
