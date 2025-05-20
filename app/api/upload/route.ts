import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { createFileRecord } from '@/lib/db';
import { ApiResponse } from '@/types';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // マルチパートフォームデータ処理
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const customPath = formData.get('customPath') as string | null;
    
    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 }
      );
    }
    
    // ファイルサイズ上限をチェック（50MBまで）
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'ファイルサイズは50MB以下にしてください' },
        { status: 400 }
      );
    }
    
    // カスタムパスのバリデーション
    if (customPath) {
      // 英数字、ハイフン、アンダースコアのみを許可
      if (!/^[a-zA-Z0-9_-]+$/.test(customPath)) {
        return NextResponse.json(
          { error: 'カスタムパスには英数字、ハイフン、アンダースコアのみ使用できます' },
          { status: 400 }
        );
      }
      
      // 数字のみのカスタムパスを禁止（IDとの競合を防ぐため）
      if (/^\d+$/.test(customPath)) {
        return NextResponse.json(
          { error: '数字のみのカスタムパスは使用できません' },
          { status: 400 }
        );
      }
      
      // 予約語をチェック（例：api, about などの既存パス）
      const reservedPaths = ['api', 'about', 'database', 'admin', 'login', 'register', 'settings', 'file', 'files'];
      if (reservedPaths.includes(customPath.toLowerCase())) {
        return NextResponse.json(
          { error: 'このカスタムパスは予約されています' },
          { status: 400 }
        );
      }
      
      // 長さ制限を設定
      if (customPath.length < 1 || customPath.length > 30) {
        return NextResponse.json(
          { error: 'カスタムパスは1〜30文字にしてください' },
          { status: 400 }
        );
      }
      
      // 'f'で始まるパスを禁止（ファイルIDと競合するため）
      if (customPath.toLowerCase().startsWith('f')) {
        return NextResponse.json(
          { error: "'f'で始まるカスタムパスは使用できません" },
          { status: 400 }
        );
      }
    }
    
    // パス名にタイムスタンプを含めて一意にする
    const timestamp = new Date().getTime();
    const uniquePath = `uploads/${timestamp}_${file.name}`;
    
    // Vercel Blobにファイルをアップロード
    const blob = await put(uniquePath, file, {
      access: 'public',
    });
    
    // データベースにファイル情報を保存
    const result = await createFileRecord(
      blob.url,
      file.name,
      file.size,
      file.type,
      customPath || undefined
    );
    
    // ショートリンクを生成（fプレフィックスを削除）
    const shortUrl = result.customPath 
      ? `https://if.gy/${result.customPath}` 
      : `https://if.gy/${result.id}`;
    
    return NextResponse.json({
      shortUrl,
      customPath: result.customPath || undefined,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
  } catch (error) {
    console.error('ファイルアップロードに失敗しました:', error);
    
    if (error instanceof Error && error.message === 'このカスタムパスは既に使用されています') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'ファイルアップロード中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 