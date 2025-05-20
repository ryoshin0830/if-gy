'use client';

import { useEffect, useState } from 'react';
import { UploadedFile } from '@/types';

export default function FileRedirectComponent({ fileInfo }: { fileInfo: UploadedFile }) {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // リダイレクトのタイマー（3秒）
    const duration = 3000;
    const redirectTimer = setTimeout(() => {
      window.location.href = fileInfo.blob_url;
    }, duration);
    
    // プログレスバーのアニメーション
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);
      
      if (elapsed >= duration) {
        clearInterval(progressInterval);
      }
    }, 16); // 約60fpsのアップデート
    
    return () => {
      clearTimeout(redirectTimer);
      clearInterval(progressInterval);
    };
  }, [fileInfo.blob_url]);
  
  // ファイルサイズをフォーマット
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };
  
  // ファイルタイプに基づいてアイコンを表示
  const getFileIcon = () => {
    const type = fileInfo.file_type.split('/')[0];
    
    switch (type) {
      case 'image':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'video':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'audio':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        );
      case 'application':
        if (fileInfo.file_type.includes('pdf')) {
          return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          );
        }
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900 p-4">
      <div className="w-full max-w-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl transform transition-all duration-500 animate-fade-in">
        {/* ヘッダー部分 */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-lg">if</span>
            </div>
            <div className="font-semibold text-xl text-gray-800 dark:text-white">.gy</div>
          </div>
          
          <div className="w-8 h-8 animate-pulse rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        {/* コンテンツ部分 */}
        <div className="p-6">
          {/* ファイル情報表示 */}
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              {getFileIcon()}
            </div>
            <h3 className="text-lg font-semibold text-center text-gray-800 dark:text-gray-200 mb-2 truncate">
              {fileInfo.file_name}
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
              {formatFileSize(fileInfo.file_size)}
            </div>
          </div>
          
          {/* ダウンロード案内 */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                ダウンロードが自動的に開始されます。開始されない場合は<a href={fileInfo.blob_url} className="text-blue-600 dark:text-blue-400 underline">こちらをクリック</a>してください。
              </p>
            </div>
          </div>
          
          {/* プログレスバー */}
          <div className="mt-2 mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">ダウンロード準備中...</span>
              <span className="text-blue-600 dark:text-blue-400 font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          {/* セキュリティ情報 */}
          <div className="flex items-center mt-6 text-xs text-gray-500 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            このファイルは安全なストレージからダウンロードされます
          </div>
        </div>
      </div>

      {/* 追加のアニメーション要素 */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-1/3 -right-20 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-10 left-1/3 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>
      
      {/* グローバルスタイル */}
      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(20px, -30px) scale(1.1); }
          66% { transform: translate(-10px, 10px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 15s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
} 