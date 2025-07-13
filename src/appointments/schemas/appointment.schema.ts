import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AppointmentDocument = Appointment & Document;

@Schema({
  collection: 'appointments',
  toJSON: {
    transform: (_doc, ret) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, __v, ...result } = ret;
      return result;
    },
  },
})
export class Appointment {
  @Prop({ required: true, unique: true })
  id: number;

  @Prop({ required: true })
  patient_id: number;

  @Prop({ required: true })
  doctor: string;

  @Prop({ required: true })
  appointment_date: string;

  @Prop({ required: true })
  reason: string;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);