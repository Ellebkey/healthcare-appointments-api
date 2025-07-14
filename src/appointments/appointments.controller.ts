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
}
