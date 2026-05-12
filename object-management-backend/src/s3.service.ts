import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand, CreateBucketCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3';

@Injectable()
export class S3Service implements OnModuleInit {
  private s3Client: S3Client;
  private readonly logger = new Logger(S3Service.name);
  private readonly bucket = process.env.S3_BUCKET || 'objects';
  private isCloudflare = false;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
    this.isCloudflare = endpoint.includes('cloudflarestorage.com');

    this.s3Client = new S3Client({
      endpoint: endpoint,
      region: process.env.S3_REGION || 'auto',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
      },
      forcePathStyle: !this.isCloudflare,
    });
  }

  async onModuleInit() {
    await this.ensureBucketExists();

    const endpoint = process.env.S3_ENDPOINT || '';
    if (endpoint.includes('localhost') || endpoint.includes('minio')) {
      await this.setPublicPolicy();
    }
  }

  private async ensureBucketExists() {
    if (this.isCloudflare) {
      this.logger.log(`Cloudflare R2 detected — skipping bucket check for "${this.bucket}". Ensure it exists in your R2 dashboard.`);
      return;
    }

    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Bucket "${this.bucket}" ready.`);
    } catch (error) {
      const isNotFound =
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404 ||
        error.name === 'NoSuchBucket';

      if (isNotFound) {
        this.logger.warn(`Bucket "${this.bucket}" not found. Attempting to create...`);
        try {
          await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucket }));
          this.logger.log(`Bucket "${this.bucket}" created successfully.`);
        } catch (createError) {
          this.logger.error(`Could not create bucket: ${createError.message}`);
        }
      } else {
        this.logger.error(`Bucket check failed with unexpected error: ${error.name} — ${error.message}`);
      }
    }
  }

  private async setPublicPolicy() {
    try {
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
      this.logger.log(`Public policy ensured for bucket "${this.bucket}".`);
    } catch (error) {
      this.logger.error(`Error setting bucket policy: ${error.message}`);
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    console.log('=== S3 SERVICE: UPLOAD ===');
    console.log('File details:', { originalname: file.originalname, mimetype: file.mimetype, size: file.size });
    console.log('S3 config:', { endpoint: process.env.S3_ENDPOINT, bucket: this.bucket, isCloudflare: this.isCloudflare });

    const filename = `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: filename,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
      console.log('S3 upload successful');
    } catch (s3Error) {
      console.error('S3 UPLOAD ERROR:', s3Error.message);
      console.error('S3 Error details:', s3Error);
      throw s3Error;
    }

    const publicUrl = process.env.PUBLIC_S3_URL || 'http://localhost:9000';
    const cleanPublicUrl = publicUrl.replace(/\/$/, '');

    // Cloudflare R2 Public URLs don't need the bucket name in the path
    // MinIO local URLs DO need the bucket name
    if (this.isCloudflare) {
      return `${cleanPublicUrl}/${this.bucket}/${filename}`;
    } else {
      return `${cleanPublicUrl}/${this.bucket}/${filename}`;
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      if (!fileUrl.startsWith('http')) return;

      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/');
      const key = pathParts[pathParts.length - 1];

      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      this.logger.log(`File ${key} deleted.`);
    } catch (error) {
      this.logger.error(`Delete error: ${error.message}`);
    }
  }
}