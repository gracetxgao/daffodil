import { InjectionToken } from '@angular/core';

/**
 * The path to which the user should be redirected if the cart has no items when {@link DaffCartInStockItemsGuard} is invoked.
 */
export const DaffCartInStockItemsGuardRedirectUrl = new InjectionToken<string>('DaffCartInStockItemsGuardRedirectUrl', { factory: () => '/' });
