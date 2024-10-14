import { Observable } from 'rxjs';

import { createSingleInjectionToken } from '@daffodil/core';
import {
  DaffPaypalExpressTokenRequest,
  DaffPaypalExpressTokenResponse,
} from '@daffodil/paypal';

export interface DaffPaypalExpressServiceInterface<
  T extends DaffPaypalExpressTokenRequest = DaffPaypalExpressTokenRequest,
  V extends DaffPaypalExpressTokenResponse = DaffPaypalExpressTokenResponse
> {
  generateToken(cartId: string, generateTokenRequest: T): Observable<V>;
}

export const {
  token: DaffPaypalExpressDriver,
  provider: daffProvidePaypalExpressDriver,
} = createSingleInjectionToken<DaffPaypalExpressServiceInterface>('DaffPaypalExpressDriver');
