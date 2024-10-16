import { TestBed } from '@angular/core/testing';

import {
  DaffCart,
  DaffCartShippingRate,
} from '@daffodil/cart';
import { DAFF_CART_IN_MEMORY_EXTRA_ATTRIBUTES_HOOK } from '@daffodil/cart/driver/in-memory';
import {
  DaffCartFactory,
  DaffCartShippingRateFactory,
} from '@daffodil/cart/testing';
import { DaffProductTestingModule } from '@daffodil/product/testing';

import { DaffInMemoryBackendCartShippingInformationService } from './cart-shipping-information.service';

describe('DaffInMemoryBackendCartShippingInformationService', () => {
  let service: DaffInMemoryBackendCartShippingInformationService;
  let cartFactory: DaffCartFactory;
  let cartShippingInformationFactory: DaffCartShippingRateFactory;

  let mockCart: DaffCart;
  let mockCartShippingInformation: DaffCartShippingRate;
  let cartId;
  let reqInfoStub;
  let baseUrl;
  let cartUrl;
  let collection: DaffCart[];
  let extraAttributes;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DaffProductTestingModule,
      ],
      providers: [
        DaffInMemoryBackendCartShippingInformationService,
        {
          provide: DAFF_CART_IN_MEMORY_EXTRA_ATTRIBUTES_HOOK,
          useValue: () => extraAttributes,
        },
      ],
    });
    service = TestBed.inject(DaffInMemoryBackendCartShippingInformationService);

    cartFactory = TestBed.inject(DaffCartFactory);
    cartShippingInformationFactory = TestBed.inject(DaffCartShippingRateFactory);

    mockCart = cartFactory.create();
    mockCartShippingInformation = cartShippingInformationFactory.create();
    extraAttributes = {
      extraField: 'extraField',
    };
    mockCart.shipping_information = mockCartShippingInformation;
    collection = [mockCart];
    cartId = mockCart.id;
    baseUrl = 'api/cart-shipping-information/';
    cartUrl = `/${baseUrl}${cartId}/`;
    reqInfoStub = {
      id: cartId,
      resourceUrl: baseUrl,
      collection,
      req: {
        body: {},
      },
      utils: {
        createResponse$: func => func(),
        getJsonBody: req => req.body,
        findById: (ary, id) => ary.find(e => e.id === id),
      },
    };
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('processing a get shipping information request', () => {
    let result;

    beforeEach(() => {
      reqInfoStub.url = cartUrl;

      result = service.get(reqInfoStub);
    });

    it('should return the cart shipping information', () => {
      expect(result.body).toEqual(mockCartShippingInformation);
    });
  });

  describe('processing an update shipping information request', () => {
    let result;
    let newShippingInformation: DaffCartShippingRate;

    beforeEach(() => {
      newShippingInformation = cartShippingInformationFactory.create();
      reqInfoStub.url = cartUrl;
      reqInfoStub.req.body = newShippingInformation;
      result = service.put(reqInfoStub);
    });

    it('should return a cart with the updated shipping information', () => {
      expect(result.body.shipping_information).toEqual(newShippingInformation);
    });

    it('should set extra_attributes to the value returned by the provided hook function', () => {
      expect(result.body.extra_attributes).toEqual(extraAttributes);
    });
  });

  describe('processing a remove shipping information request', () => {
    let result;

    beforeEach(() => {
      reqInfoStub.url = cartUrl;

      result = service.delete(reqInfoStub);
    });

    it('should return a cart with no shipping information', () => {
      expect(result.body.shipping_information).toBeFalsy();
    });

    it('should set extra_attributes to the value returned by the provided hook function', () => {
      expect(result.body.extra_attributes).toEqual(extraAttributes);
    });
  });
});
