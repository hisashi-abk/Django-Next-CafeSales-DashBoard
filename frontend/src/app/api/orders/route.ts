import { NextResponse } from 'next/server';
import { api } from '@/lib/api';

export async function GET() {
  try {
    // バックエンドAPIからデータを取得
    const data = await api.orders.getAll();

    return NextResponse.json(data);
  } catch (error) {
    console.error('注文データの取得に失敗しました:', error);
    return NextResponse.json(
      { error: '注文データの取得に失敗しました' },
      { status: 500 }
    );
  }
}
