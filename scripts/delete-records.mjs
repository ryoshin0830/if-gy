import { sql } from '@vercel/postgres';

async function deleteRecords() {
  try {
    console.log('データベース環境変数を確認中...');
    // 接続文字列の優先順位: POSTGRES_URL > DATABASE_URL
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.error('環境変数POSTGRES_URLまたはDATABASE_URLが設定されていません');
      process.exit(1);
    }
    
    console.log('データベースとの接続を試みます...');
    
    // shortened_urlsテーブルから81以上のIDを持つレコードを削除
    const urlResult = await sql.query(`DELETE FROM shortened_urls WHERE id >= 81 RETURNING id;`);
    console.log(`shortened_urlsテーブルから${urlResult.rowCount}件のレコードを削除しました`);
    
    // uploaded_filesテーブルから81以上のIDを持つレコードを削除
    const fileResult = await sql.query(`DELETE FROM uploaded_files WHERE id >= 81 RETURNING id;`);
    console.log(`uploaded_filesテーブルから${fileResult.rowCount}件のレコードを削除しました`);
    
    // id_counterの値を80に設定（次回は81から始まる）
    await sql.query(`UPDATE id_counter SET next_id = 81 WHERE name = 'global';`);
    console.log('id_counterを更新しました');
    
    console.log('削除完了');
  } catch (error) {
    console.error('削除中にエラーが発生しました:', error);
  } finally {
    process.exit(0);
  }
}

deleteRecords(); 