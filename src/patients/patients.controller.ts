import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { Patient } from './schemas/patient.schema';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  async create(@Body() createPatientDto: CreatePatientDto): Promise<Patient> {
    return this.patientsService.create(createPatientDto);
  }

  @Get()
  async findAll(): Promise<Patient[]> {
    return this.patientsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Patient> {
    return this.patientsService.findOne(+id);
  }
}
