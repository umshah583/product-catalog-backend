import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
    });
    this.bucketName = process.env.S3_BUCKET!;
  }

  async uploadImage(file: any): Promise<{ url: string; key: string }> {
    try {
      // Validate file type
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException('Only image files are allowed');
      }

      // Process image with sharp
      const processedImage = await sharp(file.buffer)
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer();

      // Generate unique key
      const key = `products/${uuidv4()}.webp`;

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: processedImage,
        ContentType: 'image/webp',
      });

      await this.s3Client.send(command);

      // Generate URL
      const url = `${process.env.S3_ENDPOINT}/${this.bucketName}/${key}`;

      return { url, key };
    } catch (error) {
      throw new BadRequestException('Failed to upload image');
    }
  }

  async uploadMultipleImages(files: any[]): Promise<{ url: string; key: string }[]> {
    const uploadPromises = files.map((file) => this.uploadImage(file));
    return Promise.all(uploadPromises);
  }

  async deleteImage(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      throw new BadRequestException('Failed to delete image');
    }
  }

  async deleteMultipleImages(keys: string[]): Promise<void> {
    const deletePromises = keys.map((key) => this.deleteImage(key));
    await Promise.all(deletePromises);
  }
}
