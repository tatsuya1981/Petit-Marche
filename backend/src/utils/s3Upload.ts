import { PutObjectCommand } from '@aws-sdk/client-s3';
import { BUCKET_NAME, s3Client } from '../config/s3Client';
import { v4 } from 'uuid';

export const uploadToS3 = async (file: Express.Multer.File): Promise<string> => {
  // ユニークなファイル名を生成
  const key = `reviews/${v4()}-${file.originalname}`;

  // S3へアップロードするためのデータ
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'private',
  });
  try {
    // S3へファイルをアップロード
    await s3Client.send(command);
    // アップロードしたファイルのURLを返す
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload file');
  }
};
