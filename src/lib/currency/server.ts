import { cookies } from 'next/headers';
import { CURRENCY_COOKIE, pickCurrency, type CurrencyCode } from './index';

/** Currency saved on this device (cookie), else the default (VND). */
export async function getRequestCurrency(): Promise<CurrencyCode> {
  return pickCurrency((await cookies()).get(CURRENCY_COOKIE)?.value);
}
