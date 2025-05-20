import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // データベーステーブルを確認
    console.log('データベーステーブルを確認中...');
    
    // テーブルの存在確認
    const urlTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'shortened_urls'
      );
    `;
    
    const fileTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'uploaded_files'
      );
    `;
    
    // 必要なテーブルが存在しない場合は作成
    if (!urlTableExists.rows[0].exists) {
      await sql`
        CREATE TABLE IF NOT EXISTS shortened_urls (
          id SERIAL PRIMARY KEY,
          original_url TEXT NOT NULL,
          custom_path TEXT UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          visits INTEGER DEFAULT 0
        );
      `;
      
      await sql`
        CREATE INDEX IF NOT EXISTS idx_custom_path ON shortened_urls (custom_path);
      `;
    }
    
    if (!fileTableExists.rows[0].exists) {
      await sql`
        CREATE TABLE IF NOT EXISTS uploaded_files (
          id SERIAL PRIMARY KEY,
          blob_url TEXT NOT NULL,
          file_name TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          file_type TEXT NOT NULL,
          custom_path TEXT UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          downloads INTEGER DEFAULT 0
        );
      `;
      
      await sql`
        CREATE INDEX IF NOT EXISTS idx_file_custom_path ON uploaded_files (custom_path);
      `;
    }
    
    // テーブルの統計情報を取得
    const urlStats = await sql`
      SELECT COUNT(*) as count FROM shortened_urls;
    `;
    
    const fileStats = await sql`
      SELECT COUNT(*) as count FROM uploaded_files;
    `;
    
    return NextResponse.json({
      success: true, 
      message: 'データベースが正常に初期化されました',
      stats: {
        urls: urlStats.rows[0].count,
        files: fileStats.rows[0].count
      }
    });
  } catch (error) {
    console.error('データベースの初期化に失敗しました:', error);
    
    return NextResponse.json(
      { 
        error: 'データベースの初期化に失敗しました', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 