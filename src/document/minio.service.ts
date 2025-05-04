import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService {
  private readonly logger = new Logger(MinioService.name);
  private readonly minioClient: Minio.Client;
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    // Provide default values or throw if essential config is missing
    this.bucketName = this.configService.get<string>('MINIO_BUCKET_NAME', 'signatures'); // Default bucket name
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT');
    const port = this.configService.get<number>('MINIO_PORT');
    const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY');
    const secretKey = this.configService.get<string>('MINIO_SECRET_KEY');
    const useSSL = this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true';

    if (!endpoint || !port || !accessKey || !secretKey) {
      this.logger.error('MinIO configuration is incomplete. Check .env file.');
      throw new InternalServerErrorException('MinIO configuration is incomplete.');
    }

    this.minioClient = new Minio.Client({
      endPoint: endpoint,
      port: port,
      useSSL: useSSL,
      accessKey: accessKey,
      secretKey: secretKey,
    });

    this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    try {
      this.logger.log(`Checking if bucket "${this.bucketName}" exists...`);
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);
      if (!bucketExists) {
        this.logger.log(`Bucket "${this.bucketName}" does not exist. Creating...`);
        // Region 'us-east-1' is often a default/placeholder for MinIO
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        this.logger.log(`Bucket "${this.bucketName}" created successfully.`);
      } else {
        this.logger.log(`Bucket "${this.bucketName}" already exists.`);
      }
    } catch (err) {
      this.logger.error(`Error checking or creating bucket "${this.bucketName}":`, err);
      // Depending on the error, you might want to throw or handle differently
      throw new InternalServerErrorException(`Failed to ensure MinIO bucket exists: ${err.message}`);
    }
  }

  // Return type adjusted - putObject resolves with { etag: string, versionId: string | null }
  async uploadFile(fileName: string, fileBuffer: Buffer, mimetype: string): Promise<{ etag: string; versionId?: string | null }> {
    const metaData = {
      'Content-Type': mimetype,
      // You could add more metadata here, e.g., original filename
    };

    try {
      this.logger.log(`Uploading file "${fileName}" (size: ${fileBuffer.length} bytes) to bucket "${this.bucketName}"...`);
      // Pass buffer size explicitly as the 4th argument, metadata as the 5th
      const result = await this.minioClient.putObject(this.bucketName, fileName, fileBuffer, fileBuffer.length, metaData);
      this.logger.log(`File "${fileName}" uploaded successfully. ETag: ${result.etag}, VersionID: ${result.versionId}`);
      return result;
    } catch (err) {
      this.logger.error(`Error uploading file "${fileName}" to bucket "${this.bucketName}":`, err);
      throw new InternalServerErrorException(`Failed to upload file to MinIO: ${err.message}`);
    }
  }

  // TODO: Add methods for download, delete, list etc. later
}

