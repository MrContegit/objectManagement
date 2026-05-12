import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand, CreateBucketCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3';

@Injectable()
export class S3Service implements OnModuleInit {
  private s3Client: S3Client;
  private readonly logger = new Logger(S3Service.name);
  private readonly bucket = process.env.S3_BUCKET || 'objects';

  constructor() {
    this.s3Client = new S3Client({
      endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
      },
      forcePathStyle: true, 
    });
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Bucket "${this.bucket}" already exists.`);
    } catch (error) {
      this.logger.log(`Bucket "${this.bucket}" does not exist. Creating...`);
      try {
        await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Bucket "${this.bucket}" created successfully.`);
        
        // Set public policy
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'PublicRead',
              Effect: 'Allow',
              Principal: '*',
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucket}/*`],
            },
          ],
        };
        await this.s3Client.send(new PutBucketPolicyCommand({
          Bucket: this.bucket,
          Policy: JSON.stringify(policy),
        }));
        this.logger.log(`Public policy set for bucket "${this.bucket}".`);
      } catch (createError) {
        this.logger.error(`Error creating bucket: ${createError.message}`);
      }
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const filename = `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;
    
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: filename,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const publicUrl = process.env.PUBLIC_S3_URL || 'http://localhost:9000';
    return `${publicUrl}/${this.bucket}/${filename}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/');
      const key = pathParts[pathParts.length - 1];

      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      this.logger.log(`File ${key} deleted from S3.`);
    } catch (error) {
      this.logger.error(`Error deleting file from S3: ${error.message}`);
    }
  }
}