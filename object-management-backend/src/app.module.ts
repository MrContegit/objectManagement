import { Module } from '@nestjs/common';
import { join } from 'path';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ObjectEntry, ObjectEntrySchema } from './object.schema';
import { S3Service } from './s3.service';
import { EventsGateway } from './events.gateway';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/objects'),
    MongooseModule.forFeature([{ name: ObjectEntry.name, schema: ObjectEntrySchema }]),
  ],
  controllers: [AppController],
  providers: [AppService, S3Service, EventsGateway],
})
export class AppModule {}
