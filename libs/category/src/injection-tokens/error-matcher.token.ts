import { InjectionToken } from '@angular/core';

import { daffTransformErrorToStateError } from '@daffodil/core/state';

/**
 * Transforms `DaffError`s into `DaffStateError`s before they are serialized into state.
 * Can be used to further refine Daffodil errors into more specific app errors.
 */
export const DAFF_CATEGORY_ERROR_MATCHER = new InjectionToken<typeof daffTransformErrorToStateError>(
  'DAFF_CATEGORY_ERROR_MATCHER',
  { factory: () => daffTransformErrorToStateError },
);