import React, { useRef, useState } from 'react';
import styles from './index.module.scss';
import { v4 as uuidV4 } from 'uuid';

interface ImageFile extends File {
  id: string;
  order: number;
  isMain: boolean;
}

interface ImageUploadProps {
  onImagesSelected: (files: ImageFile[]) => void;
  maxImages?: number;
  maxWidth?: number;
  maxHeight?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImagesSelected,
  maxImages = 3,
  maxWidth = 1200,
  maxHeight = 1200,
}) => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  // useRefで プログラムから input 要素にアクセス出来る様にする
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resizeImage = (file: File, order: number): Promise<ImageFile> => {
    return new Promise((resolve) => {
      // FileRender で画像ファイルの読み込み
      const render = new FileReader();
      // render の読み込み完了後イベントオブジェクトが渡されイベント発火
      render.onload = (e) => {
        const img = new Image();
        // img.src をブラウザが全て読み込み完了後にイベント発火
        img.onload = () => {
          // HTMLの canvas 要素を JavaScript で動的に作成
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // 最大の幅と高さを超えない様にリサイズ
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }
          // リサイズした width height を canvas の width height に設定
          canvas.width = width;
          canvas.height = height;
          // 2D描写の操作をするオブジェクトを ctx へ格納
          const ctx = canvas.getContext('2d');
          // ctx が null ではなかったら画像を描写
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            // toBlob メソッドで Canvas の内容を画像ファイルとしてエクスポート
            (blob) => {
              if (blob) {
                // blob のJPEG形式のバイナリデータを File へ変換
                const resizeFile = new File([blob], file.name, {
                  // MIME タイプの指定
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                }) as ImageFile;
                // 一意のIDを作成
                resizeFile.id = uuidV4();
                resizeFile.order = order;
                // 最初の画像をメイン画像とする
                resizeFile.isMain = order === 0;
                // Promise の resolve でリサイズ後のファイルを返す
                resolve(resizeFile);
              }
            },
            'image/jpeg',
            // 画像の品質設定
            0.7,
          );
        };
        // 読み込みが完了したバイナリデータURLを result から取り出し img オブジェクトの src に格納
        img.src = e.target?.result as string;
      };
      // ユーザーの画像ファイルをデータURLへ変換する処理
      render.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: File[]) => {
    // アップロードする画像＋アップロード中の画像が最大数を超えているかどうかチェック
    if (images.length + files.length > maxImages) {
      alert(`最大${maxImages}枚までアップロードできます`);
      return;
    }
    // 新たにアップロードする画像の初期位置設定
    const startOrder = images.length;
    // 全画像を一斉にリサイズ処理
    const resizedFiles = await Promise.all(files.map((file, index) => resizeImage(file, startOrder + index)));
    const newImages = [...images, ...resizedFiles];
    // プレビュー用のURLの配列を生成
    const newPreviewUrls = [...previewUrls, ...resizedFiles.map((file) => URL.createObjectURL(file))];

    setImages(newImages);
    // プレビュー用URLの配列をステートへ格納
    setPreviewUrls(newPreviewUrls);
    // リサイズ後の画像ファイルデータを親コンポーネントへ渡す
    onImagesSelected(newImages);
  };

  // ユーザーがダイアログで画像を選択
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    handleFiles(files);
  };

  // ドラッグ＆ドロップ機能
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    // ドラッグ時ブラウザでファイルが開くのを無効化
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    // ドロップされたファイルのリストを配列化
    const files = Array.from(event.dataTransfer.files);
    handleFiles(files);
  };

  // ドラッグ＆ドロップエリアをクリックするとダイアログ表示
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteImage = (id: string) => {
    // 画像データの中から削除する id と一致するデータを探す
    const removeImageIndex = images.findIndex((img) => img.id === id);

    // 削除したいid と一致しないデータだけ残す
    const updateImages = images.filter((img) => img.id !== id);
    // プレビューの中から index が removeImageIndex と一致しないものだけ残す
    const updatePreviewUrls = previewUrls.filter((_, index) => index !== removeImageIndex);

    // 削除するプレビューURLのメモリ解放
    if (removeImageIndex !== -1) {
      URL.revokeObjectURL(previewUrls[removeImageIndex]);
    }
    // 削除後残った画像の order と isMain を再設定
    updateImages.forEach((img, index) => {
      img.order = index;
      img.isMain = index === 0;
    });

    setImages(updateImages);
    setPreviewUrls(updatePreviewUrls);
    onImagesSelected(updateImages);
  };

  return (
    <div className={styles.uploadContainer}>
      {/** ドロップした場合とクリックされた場合のイベントをそれぞれ設定 */}
      <div className={styles.dropArea} onDragOver={handleDragOver} onDrop={handleDrop} onClick={triggerFileInput}>
        <p>ここをクリックまたはドラッグ＆ドロップで画像をアップロードできます</p>
        <p>（最大{maxImages}枚まで）</p>
      </div>
      {/** 画像ファイル入力フィールド 見えない様に設定 */}
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        ref={fileInputRef}
        className={styles.input}
      />
      <div className={styles.previewContainer}>
        {/** 画像URLをループ処理してプレビュー表示 */}
        {previewUrls.map((url, index) => (
          <div key={images[index].id} className={styles.previewWrapper}>
            <img src={url} alt={`プレビュー ${index + 1}`} className={styles.previewImage} />
            {index === 0 && <span className={styles.mainImageBadge}>メイン</span>}
            <button type="button" className={styles.deleteButton} onClick={() => handleDeleteImage(images[index].id)}>
              削除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageUpload;
