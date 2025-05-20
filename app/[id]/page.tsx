// app/[id]/page.tsx
import { getOriginalUrl, getFileInfo } from '@/lib/db';
import { redirect } from 'next/navigation';
import RedirectComponent from './RedirectComponent';
import FileRedirectComponent from './FileRedirectComponent';

// TypeScriptの型チェックを緩和
// @ts-expect-error - Next.js 15の型定義の変更に対応するため
export default async function RedirectPage({ params }) {
  // Next.js 15では params を await する必要がある
  const { id } = await params;
  
  try {
    // まず通常のURLとして検索
    const originalUrl = await getOriginalUrl(id);
    
    if (originalUrl) {
      // URL用のリダイレクトコンポーネントを表示
      return <RedirectComponent originalUrl={originalUrl} />;
    }
    
    // 次にファイル情報として検索
    const fileInfo = await getFileInfo(id);
    
    if (fileInfo) {
      // ファイル用のリダイレクトコンポーネントを表示
      return <FileRedirectComponent fileInfo={fileInfo} />;
    }
    
    // どちらも見つからない場合はホームページにリダイレクト
    redirect('/');
  } catch (error) {
    console.error('リダイレクト中にエラーが発生しました:', error);
    redirect('/');
  }
}