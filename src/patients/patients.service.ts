import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Patient, PatientDocument } from './schemas/patient.schema';
import { Counter, CounterDocument } from './schemas/counter.schema';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
    @InjectModel(Counter.name) private counterModel: Model<CounterDocument>,
  ) {}

  async create(createPatientDto: CreatePatientDto): Promise<Patient> {
    const counter = await this.counterModel.findOneAndUpdate(
      { _id: 'patients' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );

    const patient = new this.patientModel({
      ...createPatientDto,
      id: counter.seq,
    });

    return patient.save();
  }

  async findAll(): Promise<Patient[]> {
    return this.patientModel.find().select('id name age gender contact').limit(50).exec();
  }

  async findOne(id: number): Promise<Patient> {
    const patient = await this.patientModel
      .findOne({ id })
      .select('id name age gender contact')
      .exec();

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return patient;
  }
}
