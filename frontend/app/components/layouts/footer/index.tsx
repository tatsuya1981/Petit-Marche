import Image from 'next/image';
import styles from './index.module.scss';
import Link from 'next/link';
import petitMarche from '@/images/PetitMarche.svg';
import github from '@/images/github.svg';

const Footer = () => {
  return (
    <footer className={styles.container}>
      <div className={styles.areaWrapper}>
        <div className={styles.logoWrapper}>
          <Image className={styles.logo} src={petitMarche} alt="当サイトのロゴ" width={200} height={100} priority />
          <Link href="https://github.com/tatsuya1981" className={styles.link}>
            <Image className={styles.logoGithub} src={github} alt="githubのロゴ" width={50} height={50} priority />
          </Link>
        </div>
        <div className={styles.menu}>
          <div className={styles.menuWrapper}>
            <div>
              <Link href="/" className={styles.link}>
                お問い合わせ
              </Link>
            </div>
            <div>
              <Link href="/" className={styles.link}>
                利用規約
              </Link>
            </div>
            <div>
              <Link href="/" className={styles.link}>
                プライバシーポリシー
              </Link>
            </div>
          </div>
          <small className={styles.copyRight}>©︎Petit Marche Portfolio</small>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
