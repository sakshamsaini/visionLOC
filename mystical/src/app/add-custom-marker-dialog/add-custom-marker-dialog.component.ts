import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ViewComponent } from '../view/view.component';

@Component({
	selector: 'app-add-custom-marker-dialog',
	templateUrl: './add-custom-marker-dialog.component.html',
	styleUrls: ['./add-custom-marker-dialog.component.scss']
})
export class AddCustomMarkerDialogComponent implements OnInit {

	selectedImage: File | null = null;
	imagePreview: string | ArrayBuffer | null = null;

	constructor(
		public dialogRef: MatDialogRef<AddCustomMarkerDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data: {
			label: string; latitude: number; longitude: number
		},
	) { }

	ngOnInit(): void {
	}

	onImageSelected(event: Event): void {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			this.selectedImage = input.files[0];

			const reader = new FileReader();
			reader.onload = () => {
				this.imagePreview = reader.result;
			};
			reader.readAsDataURL(this.selectedImage);
		}
	}

	onSave(): void {
		this.dialogRef.close({
			...this.data,
			image: this.selectedImage,
			imageBase64: this.imagePreview // this is the base64 string
		});
	}

}
