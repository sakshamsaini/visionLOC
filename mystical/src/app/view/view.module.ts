import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ViewRoutingModule } from './view-routing.module';
import { ViewComponent } from './view.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { AddCustomMarkerDialogComponent } from '../add-custom-marker-dialog/add-custom-marker-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';

@NgModule({
	declarations: [
		ViewComponent,
		AddCustomMarkerDialogComponent
	],
	imports: [
		CommonModule,
		NgbModule,
		ViewRoutingModule,
		MatSlideToggleModule,
		FormsModule,
		MatButtonModule,
		MatDialogModule,
		MatInputModule
	]
})

export class ViewModule { }
