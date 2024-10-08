// HTTPレスポンスとリクエストの処理を記述

import { User } from '@prisma/client';
import { AppError } from '../../middleware/errorHandler';
import userModel, { UserInput } from './user.model';
import { NextFunction, Request, Response } from 'express';
import { isPrismaError } from '../../utils/isPrismaError';

// ユーザー情報検索
export const get = async (req: Request, res: Response, next: NextFunction) => {
  const userId = parseInt(req.params.id, 10);
  try {
    const user = await userModel.getUserById(userId);
    if (user === undefined) {
      throw new AppError('not found user', 404);
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// ユーザー情報作成
export const create = async (req: Request, res: Response, next: NextFunction): Promise<User | void> => {
  const { name, email, generation, gender, passwordDigest } = req.body;
  // ユーザーデータのユニーク判定
  const isUnique = await userModel.uniqueness(name, email);
  if (!isUnique) {
    return next(new AppError('Name and email address are already in use', 400));
  }
  try {
    const newUser = await userModel.createUser({
      name,
      email,
      generation,
      gender,
      passwordDigest,
    });
    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
};

// ユーザー情報更新
export const update = async (req: Request, res: Response, next: NextFunction): Promise<User | void> => {
  const userId = await parseInt(req.params.id);
  const userData: UserInput = req.body;
  const { email } = req.body;
  // Prisma Clientが発生させる特定のエラーコードを定数へ格納
  const notFoundRecord = 'P2025';
  // メールのユニーク判定
  const isUnique = await userModel.uniqueness(email);
  if (!isUnique) {
    return next(new AppError('email address are already in use', 400));
  }
  try {
    const store = await userModel.updateUser(userId, userData);
    res.status(200).json(store);
  } catch (error: unknown) {
    if (isPrismaError(error)) {
      if (error.code === notFoundRecord) {
        return next(new AppError('not found user', 404));
      }
    }
    next(error);
  }
};

// ユーザー情報削除
export const remove = async (req: Request, res: Response, next: NextFunction): Promise<UserInput | void> => {
  const userId = await parseInt(req.params.id);
  try {
    await userModel.deleteUser(userId);
    res.status(204).send();
  } catch (error: unknown) {
    if (isPrismaError(error)) {
      if (error.code === 'P2025') {
        return next(new AppError('not found user', 404));
      }
    }
    next(error);
  }
};
