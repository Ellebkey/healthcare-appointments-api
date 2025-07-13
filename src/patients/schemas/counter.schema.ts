import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CounterDocument = Counter & Document;

@Schema({ collection: 'counters', _id: false })
export class Counter {
  @Prop({ required: true, type: String, _id: true })
  _id: string;

  @Prop({ required: true, default: 0 })
  seq: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);