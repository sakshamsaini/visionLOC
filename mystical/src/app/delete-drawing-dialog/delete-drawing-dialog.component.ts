import { Component, Inject, OnInit } from '@angular/core';
import { ViewController } from '../controller/view.controller';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

@Component({
	selector: 'app-delete-drawing-dialog',
	templateUrl: './delete-drawing-dialog.component.html',
	styleUrls: ['./delete-drawing-dialog.component.scss']
})
export class DeleteDrawingDialogComponent implements OnInit {

	constructor(public dialogRef: MatDialogRef<DeleteDrawingDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data: {
			id: number; shapeName: string; label: string;
		},
		private toastr: ToastrService,
		private viewController: ViewController) { }

	ngOnInit(): void {
	}

	deleteDrawing(): void {
		this.viewController.deleteDrawing(this.data.id).subscribe({
			next: (res) => {
				this.toastr.success(res['message']);
			},
			error: (err) => {
				console.error('Error in deleteDrawing:', err);
				this.toastr.error('Something went wrong');
			}
		});

		this.dialogRef.close({
			...this.data,
		});
	}

}
