import {
  createFeatureSelector,
  MemoizedSelector,
} from '@ngrx/store';

import {
  DaffGenericCategory,
  DaffCategory,
} from '@daffodil/category';

import {
  DaffCategoryReducersState,
  DAFF_CATEGORY_STORE_FEATURE_KEY,
  DaffCategoryStateRootSlice,
} from '../reducers/public_api';


export interface DaffCategoryFeatureMemoizedSelectors<
	V extends DaffGenericCategory<V> = DaffCategory,
> {
	selectCategoryFeatureState: MemoizedSelector<DaffCategoryStateRootSlice<V>, DaffCategoryReducersState<V>>;
}

export const getDaffCategoryFeatureSelector = (() => {
  let cache;
  return <V extends DaffGenericCategory<V>>(): DaffCategoryFeatureMemoizedSelectors<V> => cache = cache
    ? cache
    : { selectCategoryFeatureState: createFeatureSelector<DaffCategoryStateRootSlice<V>,DaffCategoryReducersState<V>>(DAFF_CATEGORY_STORE_FEATURE_KEY) };
})();
