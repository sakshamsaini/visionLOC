import { Component, Inject, OnInit } from '@angular/core';
import { ViewController } from '../controller/view.controller';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
	selector: 'app-add-label-dialog',
	templateUrl: './add-label-dialog.component.html',
	styleUrls: ['./add-label-dialog.component.scss']
})
export class AddLabelDialogComponent implements OnInit {

	constructor(
		public dialogRef: MatDialogRef<AddLabelDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data: {
			label: string; jsonObj: any;
		},
		private viewController: ViewController
	) { }

	ngOnInit(): void {
	}

	onSave(): void {
		this.data.jsonObj.label = this.data.label;
		this.viewController.postDrawing(this.data.jsonObj)
			.subscribe((res) => {
			},
				error => {
					console.log('error in onSave() -', error);
				});

		this.dialogRef.close({
			...this.data,
		});
	}
}
