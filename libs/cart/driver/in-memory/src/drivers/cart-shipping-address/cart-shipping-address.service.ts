import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  DaffCartAddress,
  DaffCart,
} from '@daffodil/cart';
import { DaffCartShippingAddressServiceInterface } from '@daffodil/cart/driver';

/**
 * @inheritdoc
 */
@Injectable({
  providedIn: 'root',
})
export class DaffInMemoryCartShippingAddressService implements DaffCartShippingAddressServiceInterface {
  /**
   * The URL with which the driver makes calls to the backend.
   */
  readonly url = '/api/cart-shipping-address';

  constructor(private http: HttpClient) {}

  get(cartId: DaffCart['id']): Observable<DaffCartAddress> {
    return this.http.get<DaffCartAddress>(`${this.url}/${cartId}`);
  }

  update(cartId: DaffCart['id'], address: Partial<DaffCartAddress>): Observable<Partial<DaffCart>> {
    return this.http.put<Partial<DaffCart>>(`${this.url}/${cartId}`, address);
  }
}
