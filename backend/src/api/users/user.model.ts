// データベースの操作、記述とデータ構造の定義を記述
// データベースクエリの操作やテーブルの構造を反映したインターフェースの定義など

import { AppError } from '../../middleware/errorHandler';
import prisma from '../../config/database';
import { hashPassword } from '../../utils/authUtils';
import { formatToJapanTime } from '../../utils/dateUtils';
import { z } from 'zod';

export const convertGeneration = (generation: number | null): string => {
  if (generation === null) return '秘密';

  switch (generation) {
    case 15:
      return '１０代前半';
    case 20:
      return '１０代後半';
    case 25:
      return '２０代前半';
    case 30:
      return '２０代後半';
    case 35:
      return '３０代前半';
    case 40:
      return '３０代後半';
    case 45:
      return '４０代前半';
    case 50:
      return '４０代後半';
    case 55:
      return '５０代前半';
    case 60:
      return '５０代後半';
    case 65:
      return '６０代前半';
    case 70:
      return '６０代後半';
    default:
      return '７０歳以上';
  }
};

export const convertGender = (gender: string | null): string => {
  switch (gender) {
    case 'male':
      return '男性';
    case 'female':
      return '女性';
    default:
      return '秘密';
  }
};

// zodライブラリを使用してプロパティの型や制約を定義
export const userSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(50, 'ユーザー名は５０字以内です'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  passwordDigest: z.string().min(8, 'パスワードは８文字以上でなくてはなりません'),
  generation: z.number().int().min(15).max(70).nullable(),
  gender: z.enum(['mail', 'female']).nullable(),
});

// zodスキーマからTypeScriptの型を生成
export type UserInput = z.infer<typeof userSchema>;

// レスポンスのgeneration型を新たに文字列型として作り直す
export type UserResponse = Omit<UserInput, 'passwordDigest' | 'isActive' | 'lastLoginAt' | 'generation'> & {
  generation: string;
  createdAt: string;
  updatedAt: string;
};
export class UserModel {
  // ユーザーレスポンスを必要なものだけ表示するようにカスタマイズ
  formatUserResponse(user: any) {
    const { passwordDigest, isActive, lastLoginAt, ...userWithoutSensitiveInfo } = user;
    return {
      ...userWithoutSensitiveInfo,
      gender: convertGender(user.gender),
      generation: convertGeneration(user.generation),
      createdAt: formatToJapanTime(user.createdAt),
      updatedAt: formatToJapanTime(user.updatedAt),
    } as UserResponse;
  }

  // ユーザーデータのユニーク判定
  uniqueness = async (email: string, name?: string): Promise<boolean> => {
    const search = await prisma.user.findFirst({
      where: {
        OR: [{ name }, { email }],
      },
    });
    // searchが見つけられない（ユニーク）ならtrue、そうでなければfalseを返す
    return !search;
  };

  // ユーザー検索
  getUserById = async (id: number): Promise<UserResponse | AppError | undefined> => {
    if (isNaN(id)) {
      return new AppError('Invalid ID', 400);
    }
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (user) {
      return this.formatUserResponse(user);
    }
    return undefined;
  };

  // ユーザー作成
  createUser = async (userData: UserInput): Promise<UserResponse | AppError> => {
    // zodによるバリデーション検証
    const parseUser = await userSchema.safeParse(userData);
    if (!parseUser.success) {
      return new AppError(parseUser.error.message, 400);
    }
    const { name, email, generation, passwordDigest, gender } = parseUser.data;
    // パスワードのハッシュ化
    const hashedPassword = await hashPassword(passwordDigest);
    // ユーザーデータをデータベースへ登録
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordDigest: hashedPassword,
        generation,
        gender,
      },
    });
    return this.formatUserResponse(user);
  };

  // ユーザー更新
  updateUser = async (id: number, userData: UserInput): Promise<UserResponse | AppError> => {
    if (isNaN(id)) {
      return new AppError('Invalid ID', 400);
    }
    // zodによるバリデーション検証
    const parseUser = await userSchema.safeParse(userData);
    if (!parseUser.success) {
      return new AppError(parseUser.error.message, 400);
    }
    const { name, email, generation, passwordDigest, gender } = parseUser.data;
    // パスワードのハッシュ化
    const hashedPassword = await hashPassword(passwordDigest);
    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        generation,
        passwordDigest: hashedPassword,
        gender,
      },
    });
    return this.formatUserResponse(user);
  };

  // ユーザー削除
  deleteUser = async (id: number) => {
    if (isNaN(id)) {
      return new AppError('Invalid ID', 400);
    }
    return prisma.user.delete({
      where: { id },
    });
  };
}

export default new UserModel();
