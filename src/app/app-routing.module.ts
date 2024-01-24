import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SankeyComponent } from './sankey/sankey.component';

const routes: Routes = [
  { path: ':json', component: SankeyComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
