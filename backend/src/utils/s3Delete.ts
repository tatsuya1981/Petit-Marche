import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { BUCKET_NAME, s3Client } from '../config/s3Client';

// S3から画像データを削除する関数
export const deleteS3Object = async (imageUrl: string): Promise<void> => {
  // URLをスラッシュで分割して配列にする処理
  const urlParts = imageUrl.split('/');
  // URLを分割した配列から４番目の要素から最後までの要素を取得して再度スラッシュで結合
  const key = urlParts.slice(3).join('/');

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  try {
    await s3Client.send(command);
    console.log(`Successfully deleted object from S3: ${key}`);
  } catch (error) {
    throw new Error(`Failed to delete object from S3: ${key}`);
  }
};
