import { Component, Inject, OnInit } from '@angular/core';
import { ViewController } from '../controller/view.controller';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

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
		private toastr: ToastrService,
		private viewController: ViewController
	) { }

	ngOnInit(): void {
	}

	onSave(): void {
		this.data.jsonObj.label = this.data.label;

		this.viewController.postDrawing(this.data.jsonObj).subscribe(
			(res) => {
				this.toastr.success(res.message);

				this.dialogRef.close({
					...this.data,
					id: res.response.id
				});
			},
			(error) => {
				console.log('error in onSave() -', error);
				this.toastr.error('Something went wrong');
			}
		);
	}

}
