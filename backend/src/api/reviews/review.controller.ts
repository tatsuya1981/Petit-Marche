// HTTPレスポンスとリクエストの処理を記述

import { Request, Response, NextFunction } from 'express';
import reviewModel from './review.model';
import { AppError } from '../../middleware/errorHandler';
import multer from 'multer';
import { Review } from '@prisma/client';
import S3Service from '../../utils/s3Service';

const upload = multer({ storage: multer.memoryStorage() });

// Express.Multer.File に order と isMain を追加してカスタム
export interface CustomMulterFile extends Express.Multer.File {
  order: number; // 画像の順序
  isMain: boolean; // メイン画像であるかどうか
}

// レビュー獲得
export const get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const reviewId = parseInt(req.params.id, 10);
  try {
    const review = await reviewModel.findById(reviewId);
    // モデルの処理で返却値がundefinedかAppErrorのインスタンスであった場合の処理
    if (!review || review instanceof AppError || !review.images) {
      res.status(400).json({ error: 'Review not found or invalid request' });
      return;
    }

    // 並列処理で全てのURLをまとめて処理
    review.images = await Promise.all(
      review.images.map(async (img) => ({
        ...img,
        imageUrl: await S3Service.getSignedS3Url(img.imageUrl),
      })),
    );

    res.json(review);
  } catch (error) {
    if (error instanceof Error) {
      next(new AppError(error.message, 400));
    } else {
      next(error);
    }
  }
};

// レビュー作成 (Expressのミドルウェアチェーン使用)
export const create = [
  // upload メソッドによってフォームフィールドの名前と最大数を指定
  upload.array('image', 3),
  async (req: Request, res: Response, next: NextFunction): Promise<Review | void> => {
    //Multer によってアップロードされた image ファイルのデータを変数filesへ格納
    let files = req.files as CustomMulterFile[];
    const reviewData = req.body;
    // リクエストから order 情報の検証
    if (!req.body.orders || !Array.isArray(req.body.orders)) {
      return next(new AppError('Order information is required for each image', 400));
    }

    // Multer.file型にリクエストの情報を追加する処理
    files = files.map((file, index) => {
      file.order = parseInt(req.body.orders, 10);
      file.isMain = index === 0;
      return file;
    });
    try {
      const newReview = await reviewModel.createReview(reviewData, files);
      res.status(201).json(newReview);
    } catch (error) {
      if (error instanceof Error) {
        next(new AppError(error.message, 400));
      } else {
        next(error);
      }
    }
  },
];

// レビュー更新 (Expressのミドルウェアチェーン使用)
export const update = [
  // upload メソッドによってフォームフィールドの名前と最大数を指定
  upload.array('images', 3),
  async (req: Request, res: Response, next: NextFunction): Promise<Review | void> => {
    //Multer によってアップロードされたファイル情報を取得
    let files = req.files as CustomMulterFile[];
    const reviewId = parseInt(req.params.id, 10);
    const reviewData = req.body;

    // Multer.file型にフロントエンドからの情報を追加する処理
    files = files.map((file, index) => {
      file.order = parseInt(req.body.orders[index], 10);
      file.isMain = index === 0;
      return file;
    });
    try {
      const updateReview = await reviewModel.updateReview(reviewId, reviewData, files);
      res.json(updateReview);
    } catch (error) {
      if (error instanceof Error) {
        next(new AppError(error.message, 400));
      } else {
        next(error);
      }
    }
  },
];

// レビュー削除
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  const reviewId = parseInt(req.params.id, 10);
  try {
    await reviewModel.deleteReview(reviewId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error) {
      next(new AppError(error.message, 400));
    } else {
      next(error);
    }
  }
};
