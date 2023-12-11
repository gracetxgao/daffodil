import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { DaffCategoryStateModule } from '@daffodil/category/state';
import {
  DaffContainerModule,
  DaffLoadingIconModule,
} from '@daffodil/design';
import { DaffProductStateModule } from '@daffodil/product/state';

import { CategoryViewComponent } from './category-view.component';
import { ProductGridModule } from '../../../product/components/product-grid/product-grid.module';

@NgModule({
  imports: [
    CommonModule,
    DaffLoadingIconModule,
    ProductGridModule,
    DaffContainerModule,
    DaffProductStateModule,
    DaffCategoryStateModule,
  ],
  declarations: [
    CategoryViewComponent,
  ],
  exports: [
    CategoryViewComponent,
  ],
})
export class CategoryViewModule { }