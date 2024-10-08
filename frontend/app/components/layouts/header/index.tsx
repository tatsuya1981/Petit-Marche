import styles from './index.module.scss';
import Image from 'next/image';
import Link from 'next/link';
import petitMarche from '@/images/PetitMarche.svg';

const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logoWrapper}>
          <Link href="/" className={styles.logoLink}>
            <Image src={petitMarche} alt="当サイトのロゴ" className={styles.logo} width={100} height={100} priority />
          </Link>
        </div>
        <nav className={styles.nav}>
          <Link href="" className={styles.link}>
            新規登録
          </Link>
          <Link href="" className={styles.link}>
            ログイン
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
