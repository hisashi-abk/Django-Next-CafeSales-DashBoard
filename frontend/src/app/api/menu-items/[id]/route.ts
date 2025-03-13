import { NextResponse } from 'next/server';
import { api } from '@/lib/api';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    // バックエンドAPIからデータを取得
    const data = await api.menuItems.getById(id);

    return NextResponse.json(data);
  } catch (error) {
    console.error('メニューデータの取得に失敗しました:', error);
    return NextResponse.json(
      { error: 'メニューデータの取得に失敗しました' },
      { status: 500 }
    );
  }
}
