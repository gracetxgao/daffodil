import { TestBed } from '@angular/core/testing';

import { DaffCartShippingRate } from '@daffodil/cart';
import { MagentoCartShippingMethod } from '@daffodil/cart/driver/magento';
import { MagentoCartShippingMethodFactory } from '@daffodil/cart/driver/magento/testing';

import { DaffMagentoCartShippingRateTransformer } from './cart-shipping-rate.service';

describe('@daffodil/cart/driver/magento | Transformer | MagentoCartShippingRate', () => {
  let service: DaffMagentoCartShippingRateTransformer;

  let magentoShippingMethodFactory: MagentoCartShippingMethodFactory;

  let mockMagentoShippingMethod: MagentoCartShippingMethod;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DaffMagentoCartShippingRateTransformer,
      ],
    });

    service = TestBed.inject(DaffMagentoCartShippingRateTransformer);

    magentoShippingMethodFactory = TestBed.inject(MagentoCartShippingMethodFactory);

    mockMagentoShippingMethod = magentoShippingMethodFactory.create();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('transform | transforming a cart shipping rate', () => {
    let transformedCartShippingRate: DaffCartShippingRate;
    let carrier;
    let price;

    beforeEach(() => {
      carrier = 'carrier';
      price = 54.30;

      mockMagentoShippingMethod.carrier_code = carrier;
      mockMagentoShippingMethod.amount.value = price;

      transformedCartShippingRate = service.transform(mockMagentoShippingMethod);
    });

    it('should return an object with the correct values', () => {
      expect(transformedCartShippingRate.carrier).toEqual(carrier);
      expect(transformedCartShippingRate.price).toEqual(price);
      expect(transformedCartShippingRate.id).toEqual(mockMagentoShippingMethod.method_code);
    });

    describe('when the argument is null', () => {
      beforeEach(() => {
        transformedCartShippingRate = service.transform(null);
      });

      it('should return null and not throw an error', () => {
        expect(transformedCartShippingRate).toBeNull();
      });
    });
  });
});
