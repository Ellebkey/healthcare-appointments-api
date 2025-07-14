import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentsProcessor } from './appointments.processor';
import { Appointment, AppointmentSchema } from './schemas/appointment.schema';
import { Counter, CounterSchema } from '../patients/schemas/counter.schema';
import { Patient, PatientSchema } from '../patients/schemas/patient.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Counter.name, schema: CounterSchema },
      { name: Patient.name, schema: PatientSchema },
    ]),
    BullModule.registerQueue({
      name: 'appointments',
    }),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsProcessor],
})
export class AppointmentsModule {}
