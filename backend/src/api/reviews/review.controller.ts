// HTTPレスポンスとリクエストの処理を記述

import { Request, Response, NextFunction } from 'express';
import reviewModel, { ReviewWithImages } from './review.model';
import { AppError } from '../../middleware/errorHandler';
import multer from 'multer';
import { getSignedS3Url } from '../../utils/s3GetSignedUrl';
import { uploadToS3 } from '../../utils/s3Upload';
import { Review } from '@prisma/client';
import { deleteS3Object } from '../../utils/s3Delete';

const upload = multer({ storage: multer.memoryStorage() });

// imageの型ガード関数
function isReviewWithImages(review: ReviewWithImages | AppError | undefined): review is ReviewWithImages {
  return review !== undefined && !(review instanceof AppError) && 'image' in review;
}

// 画像処理をする関数
const processImages = async (files: Express.Multer.File[]) => {
  if (files && files.length > 0) {
    const imageUrls = await Promise.all(files.map(uploadToS3));
    // indexをorder番号として使用し、メイン画像を０とする
    return imageUrls.map((url, index) => ({
      imageUrl: url,
      order: index,
      isMain: index === 0,
    }));
  }
  return [];
};

// レビュー獲得
export const get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const reviewId = parseInt(req.params.id, 10);
  try {
    const review = await reviewModel.getReviewById(reviewId);
    if (!review) {
      throw new AppError('Review not found', 400);
    }
    // 画像がある場合画像URLを署名付きURLに置き換える
    if (isReviewWithImages(review) && review.image && review.image.length > 0) {
      // 並列処理で全てのURLをまとめて処理
      review.image = await Promise.all(
        review.image.map(async (img) => ({
          ...img,
          imageUrl: await getSignedS3Url(img.imageUrl),
        })),
      );
    }
    res.json(review);
  } catch (error) {
    next(error);
  }
};

// レビュー作成 (Expressのミドルウェアチェーン使用)
export const create = [
  // Multerミドルウェアにより３つまでの画像をアップロード処理
  upload.array('image', 3),
  async (req: Request, res: Response, next: NextFunction): Promise<Review | void> => {
    //Multerミドルウェアによりreqオブジェクトにプロパティ追加
    const files = req.files as Express.Multer.File[];
    const reviewData = req.body;
    // リクエストの画像ファイルを専用関数でS3へアップロード
    const processedImages = await processImages(files);
    // レビューデータへ処理済みの画像URLを追加
    const reviewAddImages = {
      ...reviewData,
      image: processedImages,
    };
    try {
      const newReview = await reviewModel.createReview(reviewAddImages);
      res.status(201).json(newReview);
    } catch (error) {
      next(error);
    }
  },
];

// レビュー更新 (Expressのミドルウェアチェーン使用)
export const update = [
  upload.array('image', 3),
  async (req: Request, res: Response, next: NextFunction): Promise<Review | void> => {
    //Multerミドルウェアによりreqオブジェクトにプロパティ追加
    const files = req.files as Express.Multer.File[];
    const reviewId = parseInt(req.params.id, 10);
    const reviewData = req.body;
    // リクエストの画像ファイルを専用関数でS3へアップロード
    const processedImages = await processImages(files);
    // レビューデータへ処理済みの画像URLを追加
    const reviewAddImages = {
      ...reviewData,
      image: processedImages,
    };
    try {
      const updateReview = await reviewModel.updateReview(reviewId, reviewAddImages);
      res.json(updateReview);
    } catch (error) {
      next(error);
    }
  },
];

// レビュー削除
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  const reviewId = parseInt(req.params.id, 10);
  // S3の画像データ削除の為レビュー内容を取得
  const review = await reviewModel.getReviewById(reviewId);
  if (!review) {
    throw new AppError('Review not found', 400);
  }
  try {
    if (isReviewWithImages(review) && review.image && review.image.length > 0) {
      // 逐次処理で１個ずつ画像削除処理を行う
      for (const image of review.image) {
        // レビューのimageからurlを取得しdeleteS3Objectへ渡す
        await deleteS3Object(image.imageUrl);
      }
    }
    await reviewModel.deleteReview(reviewId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
