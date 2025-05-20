import { sql } from '@vercel/postgres';

async function initializeDatabase() {
  try {
    console.log('データベースへの接続を確認中...');
    
    // データベース接続テスト
    const testResult = await sql`SELECT NOW();`;
    console.log('データベース接続成功:', testResult.rows[0].now);
    
    console.log('アップロードファイル用のテーブル構造を確認中...');
    
    // アップロードされたファイル用のテーブルが存在するか確認
    const fileTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'uploaded_files'
      );
    `;
    
    // ファイルテーブルが存在する場合
    if (fileTableExists.rows[0].exists) {
      console.log('アップロードファイル用のテーブルが存在します');
      
      // テーブルが既に存在する場合、IDシーケンスをチェックして必要に応じて修正
      const result = await sql`
        SELECT MAX(id) as max_id FROM uploaded_files;
      `;
      
      const maxId = result.rows[0]?.max_id || 0;
      console.log(`現在のファイルIDの最大値: ${maxId}`);
      
      // 最大IDが100000未満の場合、シーケンスを再設定
      if (maxId < 100000) {
        console.log('シーケンスを100000から開始するよう修正します');
        
        // まずシーケンスの存在を確認
        const seqExists = await sql`
          SELECT EXISTS (
            SELECT FROM pg_sequences WHERE sequencename = 'uploaded_files_id_seq'
          );
        `;
        
        if (seqExists.rows[0].exists) {
          console.log('既存のシーケンスを削除します');
          await sql`DROP SEQUENCE IF EXISTS uploaded_files_id_seq;`;
        }
        
        console.log('新しいシーケンスを作成します');
        await sql`
          CREATE SEQUENCE uploaded_files_id_seq START WITH 100000;
        `;
        
        console.log('テーブルのIDカラムにシーケンスを設定します');
        await sql`
          ALTER TABLE uploaded_files ALTER COLUMN id SET DEFAULT nextval('uploaded_files_id_seq');
        `;
        
        console.log('ファイルIDシーケンスを100000から開始するよう修正しました');
      } else {
        console.log('ファイルIDは既に100000以上のため、修正は不要です');
      }
    } else {
      console.log('アップロードファイル用のテーブルがまだ存在しません');
      
      // ファイルIDが100000から始まるようにシーケンスを作成
      await sql`
        CREATE SEQUENCE IF NOT EXISTS uploaded_files_id_seq START WITH 100000;
      `;
      
      await sql`
        CREATE TABLE IF NOT EXISTS uploaded_files (
          id INTEGER PRIMARY KEY DEFAULT nextval('uploaded_files_id_seq'),
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
    
    console.log('データベースの初期化が完了しました');
  } catch (error) {
    console.error('データベースの初期化に失敗しました:', error);
    process.exit(1);
  }
}

// スクリプトを実行
initializeDatabase(); 