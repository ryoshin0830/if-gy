import { initializeDatabase } from '../lib/db';

async function main() {
  try {
    console.log('データベースの初期化を開始します...');
    await initializeDatabase();
    console.log('データベースの初期化が完了しました');
  } catch (error) {
    console.error('データベースの初期化中にエラーが発生しました:', error);
    process.exit(1);
  }
}

main(); 