import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AppointmentsService } from './appointments.service';
import { FileUploadDto } from './dto/file-upload.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    @InjectQueue('appointments') private appointmentsQueue: Queue,
  ) {}

  @Get()
  async findAll(@Query() query: QueryAppointmentDto): Promise<any[]> {
    return this.appointmentsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<any> {
    return this.appointmentsService.findOne(+id);
  }

  @Post()
  async processCSV(@Body() fileUploadDto: FileUploadDto): Promise<{ message: string; jobId: string }> {
    const job = await this.appointmentsQueue.add('process-csv', { filepath: fileUploadDto.filepath });
    return { 
      message: 'CSV processing queued successfully',
      jobId: job.id.toString()
    };
  }

  @Get('queue/status')
  async getQueueStatus() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.appointmentsQueue.getWaitingCount(),
      this.appointmentsQueue.getActiveCount(),
      this.appointmentsQueue.getCompletedCount(),
      this.appointmentsQueue.getFailedCount(),
    ]);

    const jobs = await this.appointmentsQueue.getJobs(['completed', 'failed', 'active', 'waiting'], 0, 10);
    
    return {
      counts: {
        waiting,
        active,
        completed,
        failed,
        total: waiting + active + completed + failed,
      },
      recentJobs: jobs.map(job => ({
        id: job.id,
        status: job.finishedOn ? 'completed' : job.failedReason ? 'failed' : job.processedOn ? 'active' : 'waiting',
        data: job.data,
        progress: job.progress(),
        createdAt: new Date(job.timestamp),
        processedAt: job.processedOn ? new Date(job.processedOn) : null,
        completedAt: job.finishedOn ? new Date(job.finishedOn) : null,
        failedReason: job.failedReason || null,
        result: job.returnvalue || null,
      })),
    };
  }

  @Get('queue/job/:id')
  async getJobStatus(@Param('id') id: string) {
    const job = await this.appointmentsQueue.getJob(id);
    
    if (!job) {
      return { error: 'Job not found' };
    }

    return {
      id: job.id,
      status: job.finishedOn ? 'completed' : job.failedReason ? 'failed' : job.processedOn ? 'active' : 'waiting',
      data: job.data,
      progress: job.progress(),
      createdAt: new Date(job.timestamp),
      processedAt: job.processedOn ? new Date(job.processedOn) : null,
      completedAt: job.finishedOn ? new Date(job.finishedOn) : null,
      failedReason: job.failedReason || null,
      result: job.returnvalue || null,
    };
  }
}
