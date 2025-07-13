import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './schemas/appointment.schema';
import { FileUploadDto } from './dto/file-upload.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  async findAll(@Query() query: QueryAppointmentDto): Promise<Appointment[]> {
    return this.appointmentsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Appointment> {
    return this.appointmentsService.findOne(+id);
  }

  @Post()
  async processCSV(@Body() fileUploadDto: FileUploadDto): Promise<{ message: string }> {
    // For now, just return a success message
    // CSV processing will be implemented in steps 6-7
    return { message: 'CSV processing queued successfully' };
  }
}
