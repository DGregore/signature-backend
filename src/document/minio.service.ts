import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { Readable } from 'stream'; // Import Readable stream

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

  // Upload file
  async uploadFile(fileName: string, fileBuffer: Buffer, mimetype: string): Promise<{ etag: string; versionId?: string | null }> {
    const metaData = {
      'Content-Type': mimetype,
    };

    try {
      this.logger.log(`Uploading file "${fileName}" (size: ${fileBuffer.length} bytes) to bucket "${this.bucketName}"...`);
      const result = await this.minioClient.putObject(this.bucketName, fileName, fileBuffer, fileBuffer.length, metaData);
      this.logger.log(`File "${fileName}" uploaded successfully. ETag: ${result.etag}, VersionID: ${result.versionId}`);
      return result;
    } catch (err) {
      this.logger.error(`Error uploading file "${fileName}" to bucket "${this.bucketName}":`, err);
      throw new InternalServerErrorException(`Failed to upload file to MinIO: ${err.message}`);
    }
  }

  // Download file
  async downloadFile(fileName: string): Promise<Readable> {
    try {
      this.logger.log(`Attempting to download file "${fileName}" from bucket "${this.bucketName}"...`);
      // First, check if the object exists to provide a better error message
      await this.minioClient.statObject(this.bucketName, fileName);
      // If statObject doesn't throw, the object exists, proceed to get it
      const stream = await this.minioClient.getObject(this.bucketName, fileName);
      this.logger.log(`Successfully retrieved stream for file "${fileName}".`);
      return stream;
    } catch (err) {
      // Check if the error is because the object doesn't exist
      if (err.code === 'NoSuchKey' || err.code === 'NotFound') {
        this.logger.error(`File "${fileName}" not found in bucket "${this.bucketName}".`);
        throw new NotFoundException(`Arquivo "${fileName}" não encontrado no armazenamento.`);
      }
      // Handle other potential errors
      this.logger.error(`Error downloading file "${fileName}" from bucket "${this.bucketName}":`, err);
      throw new InternalServerErrorException(`Falha ao baixar o arquivo do MinIO: ${err.message}`);
    }
  }

  // Delete file
  async deleteFile(fileName: string): Promise<void> {
    try {
      this.logger.log(`Attempting to delete file "${fileName}" from bucket "${this.bucketName}"...`);
      await this.minioClient.removeObject(this.bucketName, fileName);
      this.logger.log(`File "${fileName}" deleted successfully from bucket "${this.bucketName}".`);
    } catch (err) {
      // Log the error but maybe don't throw if deletion failure is not critical?
      // Or re-throw as InternalServerErrorException
      this.logger.error(`Error deleting file "${fileName}" from bucket "${this.bucketName}":`, err);
      throw new InternalServerErrorException(`Falha ao excluir o arquivo do MinIO: ${err.message}`);
    }
  }
}

