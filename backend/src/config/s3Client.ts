import { S3Client } from '@aws-sdk/client-s3';

// 環境変数が存在するかどうかチェック
const getRequiredEnvVar = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
};

// S3クライアントの設定
export const s3Client = new S3Client({
  region: getRequiredEnvVar('AWS_REGION'),
  credentials: {
    accessKeyId: getRequiredEnvVar('AWS_ACCESS_KEY_ID'),
    secretAccessKey: getRequiredEnvVar('AWS_SECRET_ACCESS_KEY'),
  },
});

export const BUCKET_NAME = process.env.S3_BUCKET_NAME;
