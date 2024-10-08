import { useState } from 'react';
import styles from './index.module.scss';

export const Rating = () => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  return (
    <>
      <div className={styles.container}>
        <div className={styles.textContainer}>
          <p className={styles.text}>星評価（満点は星５つ）</p>
        </div>
        <div className={styles.ratingContainer}></div>
      </div>
    </>
  );
};
