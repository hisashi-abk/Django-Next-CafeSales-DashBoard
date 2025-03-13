import { NextResponse } from 'next/server';
import { api } from '@/lib/api';

export async function GET(request: Request) {
  try {
    // URLからクエリパラメータを取得
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');

    // バックエンドAPIからデータを取得
    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;
    const data = await api.sales.getCategorySales(startDate, endDate);

    return NextResponse.json(data);
  } catch (error) {
    console.error('カテゴリー別売上の取得に失敗しました:', error);
    return NextResponse.json(
      { error: 'カテゴリー別売上の取得に失敗しました' },
      { status: 500 }
    );
  }
}
