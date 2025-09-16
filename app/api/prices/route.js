import { NextResponse } from 'next/server';
import { setDailyPrices } from '../../../lib/db';

export async function POST(request) {
  try {
    const { date, prices } = await request.json();
    if (!date || !prices || Object.values(prices).some(p => isNaN(p) || p <= 0)) {
      return NextResponse.json({ error: 'Invalid date or prices' }, { status: 400 });
    }
    await setDailyPrices(date, prices);
    return NextResponse.json({ message: 'Prices saved successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error saving prices:', error);
    return NextResponse.json({ error: 'Failed to save prices' }, { status: 500 });
  }
}