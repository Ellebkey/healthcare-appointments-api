import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Model } from 'mongoose';
import { Queue } from 'bull';
import { Appointment, AppointmentDocument } from './schemas/appointment.schema';
import { Counter, CounterDocument } from '../patients/schemas/counter.schema';
import { Patient, PatientDocument } from '../patients/schemas/patient.schema';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(Counter.name) private counterModel: Model<CounterDocument>,
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
    @InjectQueue('appointments') private appointmentsQueue: Queue,
  ) {}

  async findAll(query: QueryAppointmentDto): Promise<any[]> {
    const pipeline: any[] = [];

    const matchStage: Record<string, any> = {};
    if (query.patient_id) {
      matchStage.patient_id = query.patient_id;
    }
    if (query.doctor) {
      matchStage.doctor = query.doctor;
    }
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    pipeline.push({
      $lookup: {
        from: 'patients',
        localField: 'patient_id',
        foreignField: 'id',
        as: 'patient_data',
      },
    });

    pipeline.push({
      $unwind: {
        path: '$patient_data',
        preserveNullAndEmptyArrays: true,
      },
    });

    pipeline.push({
      $project: {
        _id: 0,
        id: 1,
        doctor: 1,
        appointment_date: 1,
        reason: 1,
        patient: {
          $cond: {
            if: { $eq: ['$patient_data', null] },
            then: null,
            else: {
              id: '$patient_data.id',
              name: '$patient_data.name',
              age: '$patient_data.age',
              gender: '$patient_data.gender',
              contact: '$patient_data.contact',
            },
          },
        },
      },
    });

    return this.appointmentModel.aggregate(pipeline).limit(50).exec();
  }

  async findOne(id: number): Promise<any> {
    const pipeline = [
      { $match: { id } },

      {
        $lookup: {
          from: 'patients',
          localField: 'patient_id',
          foreignField: 'id',
          as: 'patient_data',
        },
      },

      {
        $unwind: {
          path: '$patient_data',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          _id: 0,
          id: 1,
          patient_id: 1,
          doctor: 1,
          appointment_date: 1,
          reason: 1,
          patient: {
            $cond: {
              if: { $eq: ['$patient_data', null] },
              then: null,
              else: {
                id: '$patient_data.id',
                name: '$patient_data.name',
                age: '$patient_data.age',
                gender: '$patient_data.gender',
                contact: '$patient_data.contact',
              },
            },
          },
        },
      },
    ];

    const results = await this.appointmentModel.aggregate(pipeline).exec();

    if (!results || results.length === 0) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return results[0];
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

  async queueCSVProcessing(filepath: string): Promise<void> {
    await this.appointmentsQueue.add('process-csv', { filepath });
  }
}
