// データベースの操作、記述とデータ構造の定義を記述
// データベースクエリの操作やテーブルの構造を反映したインターフェースの定義など

import { Review, Prisma, Image } from '@prisma/client';
import prisma from '../../config/database';
import { z } from 'zod';
import { AppError } from '../../middleware/errorHandler';

// zodライブラリを使用してプロパティの型や制約を定義
export const reviewSchema = z.object({
  userId: z.number().int().positive(),
  productId: z.number().int().positive(),
  brandId: z.number().int().positive(),
  storeId: z.number().int().positive().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(255),
  productName: z.string().min(1).max(255),
  price: z.number().min(0).optional(),
  purchaseDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  content: z.string().min(1).max(2000),
  image: z
    .array(
      z.object({
        imageUrl: z.string().url(),
        order: z.number().int().min(0),
        isMain: z.boolean(),
      }),
    )
    .optional(),
});

// zodスキーマからTypeScriptの型を生成
export type ReviewInput = z.infer<typeof reviewSchema>;

// reviewとimageを組み合わせた型
export type ReviewWithImages = Review & { image: Image[] };

// formatToJapanTime が文字列で返される為、型整合性を合わせる
export type ReviewJapanTime = Omit<Review, 'createdAt' | 'updatedAt' | 'purchaseDate'> & {
  createdAt: string;
  updatedAt: string;
  purchaseDate: string | null;
};

export class ReviewModel {
  // レビュー検索
  getReviewById = async (id: number): Promise<ReviewWithImages | AppError | undefined> => {
    if (isNaN(id)) {
      return new AppError('Invalid ID', 400);
    }
    const review = await prisma.review.findUnique({
      where: { id },
      include: { image: true },
    });
    if (review) {
      return review;
    }
    return undefined;
  };

  // レビューの生成
  createReview = async (reviewData: ReviewInput): Promise<ReviewWithImages | AppError> => {
    const parseReview = await reviewSchema.safeParse(reviewData);
    if (!parseReview.success) {
      return new AppError(parseReview.error.message, 400);
    }
    const { image, ...reviewDataWithoutImage } = parseReview.data;
    return await prisma.review.create({
      data: {
        ...reviewDataWithoutImage,
        price:
          reviewDataWithoutImage.price !== undefined
            ? new Prisma.Decimal(reviewDataWithoutImage.price.toString())
            : null,
        // ISO-8601形式の日時をDateオブジェクトへ変換
        purchaseDate: reviewDataWithoutImage.purchaseDate ? new Date(reviewDataWithoutImage.purchaseDate) : null,
        image: {
          create: image,
        },
      },
      include: { image: true },
    });
  };

  // レビュー更新
  updateReview = async (id: number, reviewData: ReviewInput): Promise<ReviewWithImages | AppError> => {
    if (isNaN(id)) {
      return new AppError('Invalid ID', 400);
    }
    const parseReview = await reviewSchema.safeParse(reviewData);
    if (!parseReview.success) {
      throw new AppError(parseReview.error.message, 400);
    }
    const { image, ...reviewDataWithoutImage } = parseReview.data;
    const review = await prisma.review.update({
      where: { id },
      data: {
        ...reviewDataWithoutImage,
        price:
          reviewDataWithoutImage.price !== undefined
            ? new Prisma.Decimal(reviewDataWithoutImage.price.toString())
            : null,
        // ISO-8601形式の日時をDateオブジェクトへ変換
        purchaseDate: reviewDataWithoutImage.purchaseDate ? new Date(reviewDataWithoutImage.purchaseDate) : null,
        image: {
          deleteMany: {},
          create: image,
        },
      },
      include: { image: true },
    });
    return review;
  };

  // レビュー削除
  deleteReview = async (id: number) => {
    if (isNaN(id)) {
      return new AppError('Invalid ID', 400);
    }
    return await prisma.review.delete({
      where: { id },
      include: { image: true },
    });
  };
}

export default new ReviewModel();
