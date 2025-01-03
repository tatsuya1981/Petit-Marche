import axios from 'axios';
import { useEffect, useState } from 'react';
import styles from './index.module.scss';
import FormInput from '@/components/elements/formInput';
import FormSelect from '@/components/elements/formSelect';
import { Review } from '@/types';

// 親から渡されるプロップスの型定義
interface SearchFormProps {
  onSearch: (data: Review[]) => void;
}

// 検索パラメータの型定義
interface SearchParams {
  productName: string;
  productId: string;
  priceMin?: string;
  priceMax?: string;
  brandId: string;
}

// 商品カテゴリの型定義
interface Product {
  productId: number;
  name: string;
}

// コンビニブランドの型定義
interface Brand {
  brandId: number;
  name: string;
}

// 検索フォームを管理
const SearchForm = ({ onSearch }: SearchFormProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  // 現在の検索条件を保持するための状態管理
  const [searchParams, setSearchParams] = useState<SearchParams>({
    productName: '',
    productId: '',
    priceMin: '',
    priceMax: '',
    brandId: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  // APIリクエストなどで発生したエラーメッセージを格納
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // axiosのall()メソッドにて並列リクエストを使用
        const [productRes, brandRes] = await axios.all([
          axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/products`),
          axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/brands`),
        ]);

        setProducts(productRes.data);
        setBrands(brandRes.data);
      } catch (error) {
        // Axiosのエラーハンドリング
        if (axios.isAxiosError(error)) {
          setError(error.response?.data?.message || 'データの取得に失敗しました');
        } else {
          setError('予期せぬエラーが発生しました');
        }
        console.error('データ取得エラー：', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // ブラウザのデフォルトの挙動を抑制し、送信時にページがリロードされないようにする
    e.preventDefault();

    // 価格範囲のバリデーション
    if (searchParams.priceMin && searchParams.priceMax) {
      const minPrice = searchParams.priceMin ? parseFloat(searchParams.priceMin) : null;
      const maxPrice = searchParams.priceMax ? parseFloat(searchParams.priceMax) : null;
      if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
        setError('最小価格は最大価格を超えることはできません');
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      // axiosはパラメータをオブジェクトとして渡せる
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/reviews`, {
        params: searchParams,
      });
      // 親コンポーネントへ検索データをコールバック
      onSearch(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || '検索に失敗しました');
      } else {
        setError('予期せぬエラーが発生しました');
      }
      console.error('検索エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // 価格入力のバリデーション
    if ((name === 'priceMin' || name === 'priceMax') && value !== '') {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        setError('価格は０以上の数値を入力してください');
        return;
      }
    }
    setSearchParams((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // FormSelectコンポーネントで使用するオプションの形式に変換する関数
  const formatProductOptions = (products: Product[]) => {
    return products.map((product) => ({
      value: product.productId.toString(),
      label: product.name,
    }));
  };

  const formatBrandOptions = (brands: Brand[]) => {
    return brands.map((brand) => ({
      value: brand.brandId.toString(),
      label: brand.name,
    }));
  };

  if (isLoading) {
    return <div>読み込み中・・・</div>;
  }

  return (
    <form onSubmit={handleSubmit} className={styles.searchForm}>
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.searchGrid}>
        <FormInput
          label="商品名"
          name="productName"
          value={searchParams.productName}
          onChange={handleChange}
          placeholder="商品名を入力"
          disabled={isLoading}
        />

        <FormSelect
          label="商品カテゴリ"
          name="productId"
          value={searchParams.productId}
          onChange={handleChange}
          options={formatProductOptions(products)}
          disabled={isLoading}
        />

        <div className={styles.priceRangeContainer}>
          <div className={styles.priceInputs}>
            <FormInput
              label="最小価格"
              name="priceMin"
              value={searchParams.priceMin}
              onChange={handleChange}
              placeholder="¥ 最小"
              type="number"
              min="0"
              disabled={isLoading}
            />
            <span className={styles.rangeSeparator}>〜</span>
            <FormInput
              label="最大価格"
              name="priceMax"
              value={searchParams.priceMax}
              onChange={handleChange}
              placeholder="¥ 最大"
              type="number"
              min="0"
              disabled={isLoading}
            />
          </div>
        </div>

        <FormSelect
          label="購入先のコンビニ"
          name="brandId"
          value={searchParams.brandId}
          onChange={handleChange}
          options={formatBrandOptions(brands)}
          disabled={isLoading}
        />
      </div>

      <button type="submit" className={styles.searchButton} disabled={isLoading}>
        {isLoading ? '検索中・・・' : '検索'}
      </button>
    </form>
  );
};

export default SearchForm;
