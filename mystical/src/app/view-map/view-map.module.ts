import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ViewMapRoutingModule } from './view-map-routing.module';
import { ViewMapComponent } from './view-map.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { AddCustomMarkerDialogComponent } from '../add-custom-marker-dialog/add-custom-marker-dialog.component';
import { AddLabelDialogComponent } from '../add-label-dialog/add-label-dialog.component';
import { DeleteDrawingDialogComponent } from '../delete-drawing-dialog/delete-drawing-dialog.component';
import { MatCardModule } from '@angular/material/card';
import { UserProfileModule } from '../user-profile/user-profile.module';


@NgModule({
	declarations: [
		ViewMapComponent,
		AddCustomMarkerDialogComponent,
		AddLabelDialogComponent,
		DeleteDrawingDialogComponent
	],
	imports: [
		CommonModule,
		ViewMapRoutingModule,
		NgbModule,
		MatSlideToggleModule,
		FormsModule,
		MatButtonModule,
		MatDialogModule,
		MatInputModule,
		MatCardModule,
		UserProfileModule
	]
})
export class ViewMapModule { }
