import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PatientDocument = Patient & Document;

@Schema({
  collection: 'patients',
  toJSON: {
    transform: (_doc, ret) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, __v, ...result } = ret;
      return result;
    },
  },
})
export class Patient {
  @Prop({ required: true, unique: true })
  id: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  age: number;

  @Prop({ required: true })
  gender: string;

  @Prop({ required: true })
  contact: string;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);
