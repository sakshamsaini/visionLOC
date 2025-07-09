import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CameraController } from '../controller/camera.controller';
import { ToastrService } from 'ngx-toastr';
import { isEqual } from "lodash";

@Component({
	selector: 'app-add-edit-camera-dialog',
	templateUrl: './add-edit-camera-dialog.component.html',
	styleUrls: ['./add-edit-camera-dialog.component.scss']
})
export class AddEditCameraDialogComponent implements OnInit {

	form: FormGroup;
	isEqual: boolean = true;
	initialObject: any;

	constructor(
		private fb: FormBuilder,
		public dialogRef: MatDialogRef<AddEditCameraDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data: { id: number },
		private toastr: ToastrService,
		private cameraController: CameraController
	) {
		this.form = this.fb.group({
			label: ['', Validators.required],
			latitude: ['', Validators.required],
			longitude: ['', Validators.required],
			fovDeg: ['', Validators.required],
			focalLengthPx: ['', Validators.required],
			cameraLink: ['', Validators.required]
		});
	}

	ngOnInit(): void {
		if (this.data.id != null) {
			this.getByID();
		}
	}

	ngAfterViewInit() {
		this.form.valueChanges
			.subscribe(() => {
				this.isEqual = isEqual(this.initialObject, this.form.value)
			});
	}

	getByID() {
		this.cameraController.getCameraByID(this.data.id)
			.subscribe((res) => {

				this.patchForm(res);
			},
				error => {
					console.log('error in getByID() -', error);
					this.toastr.error('Something went wrong');
				});
	}

	patchForm(response: any) {
		this.form.patchValue({
			label: response.label,
			latitude: response.latitude,
			longitude: response.longitude,
			fovDeg: response.fovDeg,
			focalLengthPx: response.focalLengthPx,
			cameraLink: response.cameraLink
		});

		this.initialObject = this.form.value;
		this.isEqual = true;
	}

	onSave(): void {
		if (this.form.invalid) {
			return;
		}

		if (this.data.id == null) {
			this.addCamera();
		} else {
			this.updateCamera();
		}
		this.dialogRef.close({});
	}

	addCamera() {
		this.cameraController.postCamera(this.form.value)
			.subscribe((res) => {
				this.toastr.success(res.message);
			},
				error => {
					console.log('error in onSave() -', error);
					this.toastr.error('Something went wrong');
				});
	}

	updateCamera() {
		this.cameraController.updateCamera(this.data.id, this.form.value)
			.subscribe((res) => {
				this.toastr.success(res.message);
			},
				error => {
					console.log('error in onSave() -', error);
					this.toastr.error('Something went wrong');
				});

	}
}
