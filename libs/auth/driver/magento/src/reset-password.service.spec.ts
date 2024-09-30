import {
  fakeAsync,
  flush,
  TestBed,
  tick,
} from '@angular/core/testing';
import { InMemoryCache } from '@apollo/client/cache';
import { addTypenameToDocument } from '@apollo/client/utilities';
import { Apollo } from 'apollo-angular';
import {
  ApolloTestingModule,
  ApolloTestingController,
  APOLLO_TESTING_CACHE,
} from 'apollo-angular/testing';
import { GraphQLError } from 'graphql';
import { cold } from 'jasmine-marbles';
import {
  forkJoin,
  from,
  Observable,
  of,
  throwError,
} from 'rxjs';
import { catchError, concatMap } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';

import {
  DaffAuthToken,
  DaffLoginInfo,
  DaffAuthResetPasswordInfo,
} from '@daffodil/auth';
import {
  DaffAuthenticationFailedError,
  DaffAuthInvalidAPIResponseError,
  DaffUnauthorizedError,
} from '@daffodil/auth/driver';
import {
  DaffMagentoAuthTransformerService,
  MagentoSendResetEmailResponse,
  MagentoResetPasswordResponse,
  resetPasswordMutation,
  sendPasswordResetEmailMutation,
  DaffMagentoLoginService,
  MagentoGenerateTokenResponse,
  generateTokenMutation,
} from '@daffodil/auth/driver/magento';
import {
  DaffAuthResetPasswordInfoFactory,
  DaffAuthTokenFactory,
} from '@daffodil/auth/testing';
import { DaffError } from '@daffodil/core';

import { DaffMagentoResetPasswordService } from './reset-password.service';

interface ResetPasswordTestState {
  didMagentoCallSucceed: boolean;
  didResetPasswordPass?: boolean;
  didLoginResponsePass?: boolean;
  whatErrorWasThrown?: any;
}

fdescribe('@daffodil/auth/driver/magento | DaffMagentoResetPasswordService', () => {
  let controller: ApolloTestingController;
  let service: DaffMagentoResetPasswordService;

  const authTransformerServiceSpy = jasmine.createSpyObj('DaffMagentoAuthTransformerService', ['transform']);
  let loginServiceSpy: jasmine.SpyObj<DaffMagentoLoginService>;

  let resetInfoFactory: DaffAuthResetPasswordInfoFactory;
  let authTokenFactory: DaffAuthTokenFactory;

  let mockAuth: DaffAuthToken;
  let mockLoginInfo: DaffLoginInfo;
  let token: string;
  let email: string;
  let password: string;
  let firstName: string;
  let lastName: string;
  let mockResetInfo: DaffAuthResetPasswordInfo;

  beforeEach(() => {
    loginServiceSpy = jasmine.createSpyObj('DaffMagentoLoginService', ['login']);

    TestBed.configureTestingModule({
      imports: [
        ApolloTestingModule,
      ],
      providers: [
        DaffMagentoResetPasswordService,
        {
          provide: DaffMagentoLoginService,
          useValue: loginServiceSpy,
        },
        {
          provide: DaffMagentoAuthTransformerService,
          useValue: authTransformerServiceSpy,
        },
      ],
    });

    service = TestBed.inject(DaffMagentoResetPasswordService);
    controller = TestBed.inject(ApolloTestingController);
    resetInfoFactory = TestBed.inject(DaffAuthResetPasswordInfoFactory);
    authTokenFactory = TestBed.inject(DaffAuthTokenFactory);

    mockResetInfo = resetInfoFactory.create();
    mockAuth = authTokenFactory.create();

    token = mockAuth.token;
    email = mockResetInfo.email;
    password = mockResetInfo.password;
    mockLoginInfo = { email, password };
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // describe('sendResetEmail', () => {
  //   describe('when the call to the Magento API is successful', () => {
  //     let response: MagentoSendResetEmailResponse;

  //     beforeEach(() => {
  //       response = {
  //         requestPasswordResetEmail: true,
  //       };
  //     });

  //     describe('and the response passes validation', () => {
  //       it('should return', done => {
  //         service.sendResetEmail(email).subscribe((resp) => {
  //           expect(resp).toBeUndefined();
  //           done();
  //         });

  //         const op = controller.expectOne(sendPasswordResetEmailMutation);

  //         op.flush({
  //           data: response,
  //         });
  //       });
  //     });

  //     describe('and the response fails validation', () => {
  //       beforeEach(() => {
  //         response = {
  //           requestPasswordResetEmail: false,
  //         };
  //       });

  //       it('should throw a DaffAuthInvalidAPIResponseError', done => {
  //         service.sendResetEmail(email).pipe(
  //           catchError(err => {
  //             expect(err).toEqual(jasmine.any(DaffAuthInvalidAPIResponseError));
  //             done();
  //             return [];
  //           }),
  //         ).subscribe();

  //         const op = controller.expectOne(sendPasswordResetEmailMutation);

  //         op.flush({
  //           data: response,
  //         });
  //       });
  //     });
  //   });

  //   describe('when the call to the Magento API is unsuccessful', () => {
  //     it('should throw a DaffAuthenticationFailedError', done => {
  //       service.sendResetEmail(email).pipe(
  //         catchError(err => {
  //           expect(err).toEqual(jasmine.any(DaffAuthenticationFailedError));
  //           done();
  //           return [];
  //         }),
  //       ).subscribe();

  //       const op = controller.expectOne(sendPasswordResetEmailMutation);

  //       op.graphqlErrors([new GraphQLError(
  //         'The account sign-in was incorrect or your account is disabled temporarily. Please wait and try again later.',
  //         null,
  //         null,
  //         null,
  //         null,
  //         null,
  //         { category: 'graphql-authentication' },
  //       )]);
  //     });
  //   });
  // });

  describe('resetPassword', () => {
    let resetPasswordResponse: MagentoResetPasswordResponse;

    it('should compute the next action correctly', (done) => {
      const testStates: ResetPasswordTestState[] = [
        {
          didMagentoCallSucceed: true,
          didResetPasswordPass: true,
          didLoginResponsePass: true,
        },
        {
          didMagentoCallSucceed: true,
          didResetPasswordPass: false,
          whatErrorWasThrown: DaffAuthInvalidAPIResponseError,
        },
        // {
        //   didMagentoCallSucceed: false,
        //   didResetPasswordPass: false,
        //   whatErrorWasThrown: DaffUnauthorizedError,
        // },
      ];


      from(testStates).pipe(
        concatMap((el) => {
          if (el.didMagentoCallSucceed) {
            resetPasswordResponse = { resetPassword: el.didResetPasswordPass };
            if (el.didLoginResponsePass) {
              loginServiceSpy.login.withArgs({ email: mockResetInfo.email, password: mockResetInfo.password }).and.returnValue(of({ token }));
              const response = service.resetPassword(mockResetInfo);
              // const resetPasswordOp = controller.expectOne(resetPasswordMutation);

              // if (el.didMagentoCallSucceed) {
              //   resetPasswordOp.flushData(resetPasswordResponse);
              // } else {
              //   resetPasswordOp.graphqlErrors([new GraphQLError(
              //     'The current customer isn\'t authorized.',
              //     null,
              //     null,
              //     null,
              //     null,
              //     null,
              //     { category: 'graphql-authorization' },
              //   )]);
              // }
              return response;
            }
          }

          // if (!el.didResetPasswordPass) {
          //   service.resetPassword(mockResetInfo).pipe(
          //     catchError(err => {
          //       expect(err).toEqual(jasmine.any(el.whatErrorWasThrown));
          //       // done();
          //       return [];
          //       // subscriber.next();
          //       // subscriber.complete();
          //       // return of();
          //     }),
          //   ).subscribe();
          // }

          // const resetPasswordOp = controller.expectOne(resetPasswordMutation);

          // if (el.didMagentoCallSucceed) {
          //   resetPasswordOp.flushData(resetPasswordResponse);
          // } else {
          //   resetPasswordOp.graphqlErrors([new GraphQLError(
          //     'The current customer isn\'t authorized.',
          //     null,
          //     null,
          //     null,
          //     null,
          //     null,
          //     { category: 'graphql-authorization' },
          //   )]);
          // }
        }),
        map((el) => {
          const resetPasswordOp = controller.expectOne(resetPasswordMutation);

          if (el.didMagentoCallSucceed) {
            resetPasswordOp.flushData(resetPasswordResponse);
          } else {
            resetPasswordOp.graphqlErrors([new GraphQLError(
              'The current customer isn\'t authorized.',
              null,
              null,
              null,
              null,
              null,
              { category: 'graphql-authorization' },
            )]);
          }
        })
      ).subscribe(() => done());
    });
    // const testObservables = testStates.map(el => new Observable(subscriber => {
      //   if (el.didMagentoCallSucceed) {
      //     resetPasswordResponse = { resetPassword: el.didResetPasswordPass };
      //     if (el.didLoginResponsePass) {
      //       loginServiceSpy.login.withArgs({ email: mockResetInfo.email, password: mockResetInfo.password }).and.returnValue(of({ token }));
      //       service.resetPassword(mockResetInfo).subscribe(resp => {
      //         expect(resp).toEqual(token);
      //         // done();
      //         // subscriber.next();
      //         subscriber.complete();
      //       });
      //     }
      //   }

      //   if (!el.didResetPasswordPass) {
      //     service.resetPassword(mockResetInfo).pipe(
      //       catchError(err => {
      //         expect(err).toEqual(jasmine.any(el.whatErrorWasThrown));
      //         // done();
      //         return [];
      //         // subscriber.next();
      //         // subscriber.complete();
      //         // return of();
      //       }),
      //     ).subscribe();
      //   }

      //   const resetPasswordOp = controller.expectOne(resetPasswordMutation);

      //   if (el.didMagentoCallSucceed) {
      //     resetPasswordOp.flushData(resetPasswordResponse);
      //   } else {
      //     resetPasswordOp.graphqlErrors([new GraphQLError(
      //       'The current customer isn\'t authorized.',
      //       null,
      //       null,
      //       null,
      //       null,
      //       null,
      //       { category: 'graphql-authorization' },
      //     )]);
      //   }
      // }));

      // forkJoin(testObservables).subscribe(() => {
      //   controller.verify();
      //   // done();
      // });



      // const testScheduler = new TestScheduler((actual, expected) => {
      //   expect(actual).toEqual(expected);
      // });

      // testScheduler.run(helpers => {

      //   const resetPasswordOnly$ = el.didMagentoCallSucceed
      //     ? helpers.cold('--a|', { a: true })
      //     : helpers.cold('--#', {}, el.whatErrorWasThrown);

      //   const login$ = el.didLoginResponsePass
      //     ? helpers.cold('--b|', { b: { token: 'authToken' }})
      //     : helpers.cold('--#', {}, el.whatErrorWasThrown);

      //   spyOn(service, 'resetPasswordOnly').and.returnValue(resetPasswordOnly$);
      //   spyOn(loginServiceSpy, 'login').and.returnValue(login$);

      //   const result$ = service.resetPassword(mockResetInfo).pipe(
      //     catchError(err => throwError(err)),
      //   );

      //   if (el.whatErrorWasThrown) {
      //     helpers.expectObservable(result$).toBe('--#', { error: el.whatErrorWasThrown });
      //   } else {
      //     helpers.expectObservable(result$).toBe('--c|', { c: 'authToken' });
      //   }
      // });
  });
});
// });






//   afterEach(() => {
//     controller.verify();
//   });

//   describe('when the call to the Magento API is successful', () => {
//     describe('and the reset password response passes validation', () => {
//       beforeEach(() => {
//         result = true;
//         resetPasswordResponse = {
//           resetPassword: result,
//         };
//       });

//       describe('and the login response passes validation', () => {
//         beforeEach(() => {
//           loginServiceSpy.login.withArgs({ email: mockResetInfo.email, password: mockResetInfo.password }).and.returnValue(of({ token }));
//         });

//         it('should return the token and not throw an error', done => {
//           service.resetPassword(mockResetInfo).subscribe(resp => {
//             expect(resp).toEqual(token);
//             done();
//           });

//           const resetPasswordOp = controller.expectOne(resetPasswordMutation);

//           resetPasswordOp.flushData(resetPasswordResponse);
//         });
//       });
//     });

//     describe('and the reset password response fails validation', () => {
//       beforeEach(() => {
//         resetPasswordResponse = {
//           resetPassword: false,
//         };
//       });

//       // TODO: test for specific errors
//       it('should throw an error', done => {
//         service.resetPassword(mockResetInfo).pipe(
//           catchError(err => {
//             expect(err).toEqual(jasmine.any(DaffAuthInvalidAPIResponseError));
//             done();
//             return [];
//           }),
//         ).subscribe();

//         const resetPasswordOp = controller.expectOne(resetPasswordMutation);

//         resetPasswordOp.flush({
//           data: resetPasswordResponse,
//         });
//       });
//     });
//   });

//   describe('when the call to the Magento API is unsuccessful', () => {
//     it('should throw a DaffUnauthorizedError', done => {
//       service.resetPassword(mockResetInfo).pipe(
//         catchError(err => {
//           expect(err).toEqual(jasmine.any(DaffUnauthorizedError));
//           done();
//           return [];
//         }),
//       ).subscribe();

//       const resetPasswordOp = controller.expectOne(resetPasswordMutation);

//       resetPasswordOp.graphqlErrors([new GraphQLError(
//         'The current customer isn\'t authorized.',
//         null,
//         null,
//         null,
//         null,
//         null,
//         { category: 'graphql-authorization' },
//       )]);
//     });
//   });
// });

// describe('resetPasswordOnly', () => {
//   let response: MagentoResetPasswordResponse;
//   let result: boolean;

//   afterEach(() => {
//     controller.verify();
//   });

//   describe('when the call to the Magento API is successful', () => {
//     beforeEach(() => {
//       result = true;
//       response = {
//         resetPassword: result,
//       };
//     });

//     describe('and the response passes validation', () => {
//       it('should return void and not throw an error', () => {
//         const expected = cold('-', {});

//         expect(service.resetPasswordOnly(mockResetInfo)).toBeObservable(expected);

//         const op = controller.expectOne(resetPasswordMutation);

//         op.flush({
//           data: response,
//         });
//       });
//     });

//     describe('and the response fails validation', () => {
//       beforeEach(() => {
//         response = {
//           resetPassword: false,
//         };
//       });

//       // TODO: test for specific errors
//       it('should throw an error', done => {
//         service.resetPasswordOnly(mockResetInfo).pipe(
//           catchError(err => {
//             expect(err).toEqual(jasmine.any(DaffAuthInvalidAPIResponseError));
//             done();
//             return [];
//           }),
//         ).subscribe();

//         const op = controller.expectOne(resetPasswordMutation);

//         op.flush({
//           data: response,
//         });
//       });
//     });
//   });

//   describe('when the call to the Magento API is unsuccessful', () => {
//     it('should throw a DaffUnauthorizedError', done => {
//       service.resetPasswordOnly(mockResetInfo).pipe(
//         catchError(err => {
//           expect(err).toEqual(jasmine.any(DaffUnauthorizedError));
//           done();
//           return [];
//         }),
//       ).subscribe();

//       const op = controller.expectOne(resetPasswordMutation);

//       op.graphqlErrors([new GraphQLError(
//         'The current customer isn\'t authorized.',
//         null,
//         null,
//         null,
//         null,
//         null,
//         { category: 'graphql-authorization' },
//       )]);
//     });
//   });
// });
