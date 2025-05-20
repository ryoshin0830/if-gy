// lib/db.ts
import { sql } from '@vercel/postgres';
import { ShortenedUrl, UploadedFile } from '@/types';

// データベースの初期化
export async function initializeDatabase(): Promise<void> {
  try {
    // まず既存のテーブルが存在するか確認
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'shortened_urls'
      );
    `;
    
    // テーブルが存在する場合
    if (tableExists.rows[0].exists) {
      // カスタムパスカラムが存在するか確認
      const columnExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'shortened_urls' AND column_name = 'custom_path'
        );
      `;
      
      // カラムが存在しない場合は追加
      if (!columnExists.rows[0].exists) {
        await sql`
          ALTER TABLE shortened_urls 
          ADD COLUMN custom_path TEXT UNIQUE;
        `;
        console.log('custom_pathカラムを追加しました');
      }
      
      // インデックスの作成（すでに存在しても問題ない）
      await sql`
        CREATE INDEX IF NOT EXISTS idx_custom_path ON shortened_urls (custom_path);
      `;
      
      console.log('データベーステーブルが更新されました');
    } else {
      // テーブルが存在しない場合は新規作成
      await sql`
        CREATE TABLE IF NOT EXISTS shortened_urls (
          id INTEGER PRIMARY KEY,
          original_url TEXT NOT NULL,
          custom_path TEXT UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          visits INTEGER DEFAULT 0
        );
      `;
      
      // カスタムパスに対するインデックスを作成
      await sql`
        CREATE INDEX IF NOT EXISTS idx_custom_path ON shortened_urls (custom_path);
      `;
      
      console.log('データベーステーブルが新規作成されました');
    }
    
    // アップロードされたファイル用のテーブルが存在するか確認
    const fileTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'uploaded_files'
      );
    `;
    
    // ファイルテーブルが存在しない場合は新規作成
    if (!fileTableExists.rows[0].exists) {
      await sql`
        CREATE TABLE IF NOT EXISTS uploaded_files (
          id INTEGER PRIMARY KEY,
          blob_url TEXT NOT NULL,
          file_name TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          file_type TEXT NOT NULL,
          custom_path TEXT UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          downloads INTEGER DEFAULT 0
        );
      `;
      
      // カスタムパスに対するインデックスを作成
      await sql`
        CREATE INDEX IF NOT EXISTS idx_file_custom_path ON uploaded_files (custom_path);
      `;
      
      console.log('アップロードファイル用のテーブルが新規作成されました');
    }
    
    // IDカウンターテーブルが存在するか確認
    const counterTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'id_counter'
      );
    `;
    
    // IDカウンターテーブルが存在しない場合は新規作成
    if (!counterTableExists.rows[0].exists) {
      await sql`
        CREATE TABLE IF NOT EXISTS id_counter (
          name TEXT PRIMARY KEY,
          next_id INTEGER NOT NULL
        );
      `;
      
      // 初期値を設定
      await sql`
        INSERT INTO id_counter (name, next_id)
        VALUES ('global', 1);
      `;
      
      console.log('IDカウンターテーブルが新規作成されました');
    }
  } catch (error) {
    console.error('データベースの初期化に失敗しました:', error);
    // エラーをスローしないことで、アプリケーションの起動を妨げない
  }
}

// 次の利用可能なIDを取得
async function getNextAvailableId(): Promise<number> {
  try {
    // 両テーブルの最大IDを取得
    const urlMaxId = await sql<{ max_id: number }>`
      SELECT COALESCE(MAX(id), 0) as max_id FROM shortened_urls;
    `;
    
    const fileMaxId = await sql<{ max_id: number }>`
      SELECT COALESCE(MAX(id), 0) as max_id FROM uploaded_files;
    `;
    
    // 大きい方のIDを基準に次のIDを決定
    const maxId = Math.max(urlMaxId.rows[0].max_id, fileMaxId.rows[0].max_id);
    const nextId = maxId + 1;
    
    // id_counterテーブルを更新（同期を保つため）
    await sql`
      UPDATE id_counter
      SET next_id = ${nextId + 1}
      WHERE name = 'global';
    `;
    
    return nextId;
  } catch (error) {
    console.error('次のIDの取得に失敗しました:', error);
    throw error;
  }
}

// 指定されたIDが両方のテーブルで使用可能か確認
// 現在使用していないがユーティリティとして残しておく
/* istanbul ignore next */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function isIdAvailable(id: number): Promise<boolean> {
  try {
    // URLテーブルでの存在チェック
    const urlExists = await sql<{ count: number }>`
      SELECT COUNT(*) as count FROM shortened_urls
      WHERE id = ${id};
    `;
    
    // ファイルテーブルでの存在チェック
    const fileExists = await sql<{ count: number }>`
      SELECT COUNT(*) as count FROM uploaded_files
      WHERE id = ${id};
    `;
    
    // 両方のテーブルに存在しなければ利用可能
    return urlExists.rows[0].count === 0 && fileExists.rows[0].count === 0;
  } catch (error) {
    console.error('IDの可用性チェックに失敗しました:', error);
    return false;
  }
}

// パスキーを検証 - 環境変数と直接比較
export async function verifyPasskey(passkey: string): Promise<boolean> {
  try {
    const validPasskey = process.env.DEFAULT_PASSKEY || 'admin123';
    return passkey === validPasskey;
  } catch (error) {
    console.error('パスキーの検証に失敗しました:', error);
    return false;
  }
}

// 新しいショートリンクの作成（カスタムパス対応）
export async function createShortUrl(originalUrl: string, customPath?: string): Promise<{ id: number; customPath: string | null }> {
  try {
    // カスタムパスが指定されている場合は既存のパスと衝突しないか確認
    if (customPath) {
      const existingUrlPath = await sql<{ count: number }>`
        SELECT COUNT(*) as count FROM shortened_urls
        WHERE custom_path = ${customPath};
      `;
      
      const existingFilePath = await sql<{ count: number }>`
        SELECT COUNT(*) as count FROM uploaded_files
        WHERE custom_path = ${customPath};
      `;
      
      if (existingUrlPath.rows[0].count > 0 || existingFilePath.rows[0].count > 0) {
        throw new Error('このカスタムパスは既に使用されています');
      }
    }
    
    // 次の利用可能なIDを取得
    const nextId = await getNextAvailableId();
    
    // データベースに保存
    const result = await sql<{ id: number; custom_path: string | null }>`
      INSERT INTO shortened_urls (id, original_url, custom_path)
      VALUES (${nextId}, ${originalUrl}, ${customPath || null})
      RETURNING id, custom_path;
    `;
    
    return {
      id: result.rows[0].id,
      customPath: result.rows[0].custom_path
    };
  } catch (error) {
    console.error('ショートリンクの作成に失敗しました:', error);
    throw error;
  }
}

// IDまたはカスタムパスから元のURLを取得
export async function getOriginalUrl(idOrPath: string | number): Promise<string | null> {
  try {
    let result;
    
    // 数値の場合はIDとして検索
    if (typeof idOrPath === 'number' || /^\d+$/.test(idOrPath)) {
      const id = typeof idOrPath === 'number' ? idOrPath : parseInt(idOrPath, 10);
      
      result = await sql<{ original_url: string }>`
        UPDATE shortened_urls
        SET visits = visits + 1
        WHERE id = ${id}
        RETURNING original_url;
      `;
    } else {
      // 文字列の場合はカスタムパスとして検索
      result = await sql<{ original_url: string }>`
        UPDATE shortened_urls
        SET visits = visits + 1
        WHERE custom_path = ${idOrPath}
        RETURNING original_url;
      `;
    }
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0].original_url;
  } catch (error) {
    console.error('元のURLの取得に失敗しました:', error);
    return null;
  }
}

// 統計データの取得 (オプション機能)
export async function getUrlStats(id: number): Promise<ShortenedUrl | null> {
  try {
    const result = await sql<ShortenedUrl>`
      SELECT * FROM shortened_urls
      WHERE id = ${id};
    `;
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('統計データの取得に失敗しました:', error);
    return null;
  }
}

// すべてのショートリンクを取得
export async function getAllUrls(): Promise<ShortenedUrl[]> {
  try {
    const result = await sql<ShortenedUrl>`
      SELECT * FROM shortened_urls
      ORDER BY created_at DESC;
    `;
    
    return result.rows;
  } catch (error) {
    console.error('ショートリンク一覧の取得に失敗しました:', error);
    return [];
  }
}

// ファイルアップロード情報の保存
export async function createFileRecord(
  blobUrl: string,
  fileName: string,
  fileSize: number,
  fileType: string,
  customPath?: string
): Promise<{ id: number; customPath: string | null }> {
  try {
    // カスタムパスが指定されている場合は既存のパスと衝突しないか確認
    if (customPath) {
      const existingFilePath = await sql<{ count: number }>`
        SELECT COUNT(*) as count FROM uploaded_files
        WHERE custom_path = ${customPath};
      `;
      
      const existingUrlPath = await sql<{ count: number }>`
        SELECT COUNT(*) as count FROM shortened_urls
        WHERE custom_path = ${customPath};
      `;
      
      if (existingFilePath.rows[0].count > 0 || existingUrlPath.rows[0].count > 0) {
        throw new Error('このカスタムパスは既に使用されています');
      }
    }
    
    // 次の利用可能なIDを取得
    const nextId = await getNextAvailableId();
    
    // データベースに保存
    const result = await sql<{ id: number; custom_path: string | null }>`
      INSERT INTO uploaded_files (id, blob_url, file_name, file_size, file_type, custom_path)
      VALUES (${nextId}, ${blobUrl}, ${fileName}, ${fileSize}, ${fileType}, ${customPath || null})
      RETURNING id, custom_path;
    `;
    
    return {
      id: result.rows[0].id,
      customPath: result.rows[0].custom_path
    };
  } catch (error) {
    console.error('ファイル情報の保存に失敗しました:', error);
    throw error;
  }
}

// IDまたはカスタムパスからファイル情報を取得
export async function getFileInfo(idOrPath: string | number): Promise<UploadedFile | null> {
  try {
    let result;
    
    // 数値の場合はIDとして検索
    if (typeof idOrPath === 'number' || /^\d+$/.test(idOrPath)) {
      const id = typeof idOrPath === 'number' ? idOrPath : parseInt(idOrPath, 10);
      
      result = await sql<UploadedFile>`
        UPDATE uploaded_files
        SET downloads = downloads + 1
        WHERE id = ${id}
        RETURNING *;
      `;
    } else {
      // 文字列の場合はカスタムパスとして検索
      result = await sql<UploadedFile>`
        UPDATE uploaded_files
        SET downloads = downloads + 1
        WHERE custom_path = ${idOrPath}
        RETURNING *;
      `;
    }
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('ファイル情報の取得に失敗しました:', error);
    return null;
  }
}

// すべてのアップロードファイルを取得
export async function getAllFiles(): Promise<UploadedFile[]> {
  try {
    const result = await sql<UploadedFile>`
      SELECT * FROM uploaded_files
      ORDER BY created_at DESC;
    `;
    
    return result.rows;
  } catch (error) {
    console.error('アップロードファイル一覧の取得に失敗しました:', error);
    return [];
  }
}