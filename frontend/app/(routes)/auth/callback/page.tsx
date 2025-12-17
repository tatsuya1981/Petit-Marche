'use client';

import styles from './page.module.scss';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

// useSearchParamsを使用するコンポーネントを分離
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const name = searchParams.get('name');

    if (token) {
      // トークンをローカルストレージに保存
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId || '');
      localStorage.setItem('email', email || '');
      localStorage.setItem('name', name || '');

      // ユーザーを指定ページにリダイレクト
      router.replace('/review');
    } else {
      // エラーの場合はログインページにリダイレクト
      router.push('/login?error=auth_failed');
    }
  }, [router, searchParams]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>認証中・・・</h1>
        <p className={styles.message}>しばらくお待ちください</p>
        <div className={styles.loadingSpinner} />
      </div>
    </div>
  );
}

// ローディング表示用コンポーネント
function LoadingFallback() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>読み込み中・・・</h1>
        <div className={styles.loadingSpinner} />
      </div>
    </div>
  );
}

// メインコンポーネント - Suspenseでラップ
export default function AuthCallback() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
