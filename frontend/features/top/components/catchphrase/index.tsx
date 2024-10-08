import React from 'react';
import styles from './index.module.scss';
import Image from 'next/image';
import Link from 'next/link';

const images = ['/store0.jpg', '/store1.jpg', '/store2.jpg', '/store3.jpg'];

const Catchphrase = () => {
  return (
    <div className={styles.container}>
      {images.map((src, index) => (
        <div key={src} className={`${styles.image} ${styles[`src${index}`]}`}>
          <Image src={src} alt="main_image" fill style={{ objectFit: 'cover' }} priority={index === 0} />
        </div>
      ))}
      <div className={styles.overlay}>
        <h1 className={styles.catchphrase}>
          <span className={styles.text}>
            <p className={styles.word}>気</p>
            <p className={styles.word}>に</p>
            <p className={styles.word}>な</p>
            <p className={styles.word}>る</p>
            <p className={styles.word}>あ</p>
            <p className={styles.word}>の</p>
            <p className={styles.word}>新</p>
            <p className={styles.word}>商</p>
            <p className={styles.word}>品</p>
          </span>
          <span className={styles.text}>
            <p className={styles.wordBlocks}>みんなで共有してみませんか</p>
          </span>
        </h1>
        <Link href="" className={styles.link}>
          <button className={styles.button}>新規登録でレビュー！</button>
        </Link>
      </div>
    </div>
  );
};

export default Catchphrase;
