import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ViewController } from '../controller/view.controller';
@Component({
	selector: 'app-add-custom-marker-dialog',
	templateUrl: './add-custom-marker-dialog.component.html',
	styleUrls: ['./add-custom-marker-dialog.component.scss']
})
export class AddCustomMarkerDialogComponent implements OnInit {

	selectedImage: File | null = null;
	imagePreview: string | ArrayBuffer | null = null;
	imageError: string | null = null;

	constructor(
		public dialogRef: MatDialogRef<AddCustomMarkerDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data: {
			label: string; latitude: number; longitude: number
		},
		private viewController: ViewController
	) { }

	ngOnInit(): void {
	}

	onImageSelected(event: Event): void {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			this.selectedImage = input.files[0];

			const maxSizeMB = 2;
			const maxSizeBytes = maxSizeMB * 1024 * 1024;
			if (this.selectedImage.size > maxSizeBytes) {
				this.imageError = `Image is too large. Max allowed size is ${maxSizeMB} MB.`;
				return;
			}

			const reader = new FileReader();
			reader.onload = () => {
				this.imagePreview = reader.result;
			};
			reader.readAsDataURL(this.selectedImage);
		}
	}

	getJson = (label: string, latitude: number, longitude: number) => ({
		label,
		latitude,
		longitude
	});

	onSave(): void {
		const formData = this.toFormData();
		const addMarkerJson = this.getJson(this.data.label, this.data.latitude, this.data.longitude);
		formData.append('payload', JSON.stringify(addMarkerJson));

		this.viewController.postMarker(formData)
			.subscribe((res) => {
			},
				error => {
					console.log('error in onSave() -', error);
				});

		this.dialogRef.close({
			...this.data,
			image: this.selectedImage,
			imageBase64: this.imagePreview, // this is the base64 string
		});
	}

	toFormData(): FormData {
		const formData = new FormData();
		if (this.selectedImage) {
			formData.append('filePayload', this.selectedImage, this.selectedImage.name);
		}
		return formData;
	}

}
