import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ViewRoutingModule } from './view-routing.module';
import { ViewComponent } from './view.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [
    ViewComponent
  ],
  imports: [
    CommonModule,
    NgbModule,
    ViewRoutingModule,
    MatSlideToggleModule,
    FormsModule,
    MatButtonModule
  ]
})

export class ViewModule { }
