import { TestBed } from '@angular/core/testing';
import { StoreModule, combineReducers, Store } from '@ngrx/store';
import { cold } from 'jasmine-marbles';
import { MockStore } from '@ngrx/store/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

import { DaffCart, DaffCartItem } from '@daffodil/cart';
import {
  DaffCartLoadSuccess
} from '@daffodil/cart/state';
import { daffCartReducers, DaffCartItemsGuardRedirectUrl } from '@daffodil/cart/state';
import { DaffCartFactory, DaffCartItemFactory } from '@daffodil/cart/testing';

import { DaffCartItemsGuard } from './cart-items.guard';

describe('Cart | State | Guards | DaffCartItemsGuard', () => {
	let service: DaffCartItemsGuard;
	let store: MockStore<any>;
  let router: Router;

  let cartFactory: DaffCartFactory;
  let cartItemFactory: DaffCartItemFactory;

  let cart: DaffCart;
  let cartItems: DaffCartItem[];

	const stubUrl = 'url';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
				{ provide: DaffCartItemsGuardRedirectUrl, useValue: stubUrl }
			],
			imports: [
        StoreModule.forRoot({
          cart: combineReducers(daffCartReducers),
				}),
        RouterTestingModule,
			]
    });

		service = TestBed.get(DaffCartItemsGuard);
		store = TestBed.get(Store);
    router = TestBed.get(Router);

    cartFactory = TestBed.get(DaffCartFactory);
    cartItemFactory = TestBed.get(DaffCartItemFactory);

    cart = cartFactory.create();
    cartItems = cartItemFactory.createMany(1);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
	});

	describe('canActivate', () => {
    describe('when there are items in the cart', () => {
      beforeEach(() => {
        store.dispatch(new DaffCartLoadSuccess({
          ...cart,
          items: cartItems
        }));
      });

      it('should allow activation', () => {
        const expected = cold('(a|)', { a: true })

        expect(service.canActivate()).toBeObservable(expected);
      });
    });


		describe('when there are not items in the cart', () => {
			beforeEach(() => {
				spyOn(router, 'navigateByUrl');
        store.dispatch(new DaffCartLoadSuccess({
          ...cart,
          items: []
        }));
			});

			it('should not allow activation', () => {
				const expected = cold('(a|)', { a: false });

				expect(service.canActivate()).toBeObservable(expected);
			});

			it('should redirect to the given DaffCartItemsGuardRedirectUrl', () => {
				service.canActivate().subscribe();
				expect(router.navigateByUrl).toHaveBeenCalledWith(stubUrl);
			});
		});
	});
});