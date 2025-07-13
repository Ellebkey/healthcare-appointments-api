import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { Patient, PatientSchema } from './schemas/patient.schema';
import { Counter, CounterSchema } from './schemas/counter.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Patient.name, schema: PatientSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
  ],
  controllers: [PatientsController],
  providers: [PatientsService],
})
export class PatientsModule {}
