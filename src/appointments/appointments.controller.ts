import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { FileUploadDto } from './dto/file-upload.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  async findAll(@Query() query: QueryAppointmentDto): Promise<any[]> {
    return this.appointmentsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<any> {
    return this.appointmentsService.findOne(+id);
  }

  @Post()
  async processCSV(@Body() fileUploadDto: FileUploadDto): Promise<{ message: string }> {
    await this.appointmentsService.queueCSVProcessing(fileUploadDto.filepath);
    return { message: 'CSV processing queued successfully' };
  }
}
