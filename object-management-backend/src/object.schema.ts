import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ObjectEntry extends Document {
    @Prop({ required: true }) title: string;
    @Prop({ required: true }) description: string;
    @Prop({ required: true }) imageUrl: string;
    createdAt: Date;
    updatedAt: Date;
}

export const ObjectEntrySchema = SchemaFactory.createForClass(ObjectEntry);