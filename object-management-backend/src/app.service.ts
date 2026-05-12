import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectEntry } from './object.schema';
import { CreateObjectDto } from './create-object.dto';
import { S3Service } from './s3.service';
import { EventsGateway } from './events.gateway';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    @InjectModel(ObjectEntry.name) private model: Model<ObjectEntry>,
    private s3Service: S3Service,
    private eventsGateway: EventsGateway,
  ) {}

  async findAll(page: number, limit: number) {
    this.logger.log(`Fetching objects (page: ${page}, limit: ${limit})`);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.model.find().skip(skip).limit(limit).exec(),
      this.model.countDocuments().exec(),
    ]);
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(dto: CreateObjectDto, file: Express.Multer.File) {
    console.log('=== APP SERVICE: CREATE ===');
    console.log('dto:', dto);
    console.log('file:', file);

    if (!file) {
      console.error('NO FILE PROVIDED!');
      throw new Error('File is required');
    }

    if (!dto.title || !dto.description) {
      console.error('MISSING FIELDS!', { title: dto.title, description: dto.description });
      throw new Error('Title and description are required');
    }

    this.logger.log(`Creating object with title: ${dto.title}`);

    try {
      console.log('Uploading file to S3...');
      const imageUrl = await this.s3Service.uploadFile(file);
      console.log('File uploaded, URL:', imageUrl);

      console.log('Creating object in MongoDB...');
      const newObj = await this.model.create({ ...dto, imageUrl });
      console.log('Object created in DB:', newObj);

      this.eventsGateway.server.emit('objectCreated', newObj);
      return newObj;
    } catch (error) {
      console.error('ERROR IN CREATE:', error.message);
      console.error('Stack:', error.stack);
      throw error;
    }
  }

  async findOne(id: string) {
    this.logger.log(`Fetching object with id: ${id}`);
    return this.model.findById(id).exec();
  }

  async delete(id: string) {
    this.logger.log(`Deleting object with id: ${id}`);
    const obj = await this.model.findById(id).exec();
    if (!obj) {
      return null;
    }
    await this.s3Service.deleteFile(obj.imageUrl);
    await this.model.findByIdAndDelete(id).exec();
    this.eventsGateway.server.emit('objectDeleted', { _id: id });
    return obj;
  }
}
