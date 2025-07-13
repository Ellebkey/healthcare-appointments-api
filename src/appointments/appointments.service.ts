import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Appointment, AppointmentDocument } from './schemas/appointment.schema';
import { Counter, CounterDocument } from '../patients/schemas/counter.schema';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(Counter.name) private counterModel: Model<CounterDocument>,
  ) {}

  async findAll(query: QueryAppointmentDto): Promise<Appointment[]> {
    const filter: any = {};

    if (query.patient_id) {
      filter.patient_id = query.patient_id;
    }

    if (query.doctor) {
      filter.doctor = query.doctor;
    }

    return this.appointmentModel
      .find(filter)
      .select('id patient_id doctor appointment_date reason')
      .exec();
  }

  async findOne(id: number): Promise<Appointment> {
    const appointment = await this.appointmentModel
      .findOne({ id })
      .select('id patient_id doctor appointment_date reason')
      .exec();

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  async create(
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const counter = await this.counterModel.findOneAndUpdate(
      { _id: 'appointments' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );

    const appointment = new this.appointmentModel({
      ...createAppointmentDto,
      id: counter.seq,
    });

    return appointment.save();
  }
}
