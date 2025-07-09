import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CameraPageRoutingModule } from './camera-page-routing.module';
import { CameraPageComponent } from './camera-page.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { AddEditCameraDialogComponent } from '../add-edit-camera-dialog/add-edit-camera-dialog.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { UserProfileModule } from '../user-profile/user-profile.module';

@NgModule({
	declarations: [
		CameraPageComponent,
		AddEditCameraDialogComponent,
	],
	imports: [
		CommonModule,
		CameraPageRoutingModule,
		MatButtonModule,
		MatDialogModule,
		FormsModule,
		ReactiveFormsModule,
		MatInputModule,
		MatSortModule,
		MatTableModule,
		UserProfileModule
	]
})
export class CameraPageModule { }
