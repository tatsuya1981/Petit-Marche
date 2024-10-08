import styles from './index.module.scss';

export const ReviewTitle = () => {
  return (
    <>
      <div className={styles.container}>
        <h1 className={styles.title}>新規レビュー</h1>
        <p className={styles.message}>気になったあの商品についてどんどんレビューしよう！</p>
      </div>
      <div className={styles.textContainer}>
        <p className={styles.text}>印は必須項目です</p>
      </div>
    </>
  );
};
