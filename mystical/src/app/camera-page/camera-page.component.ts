import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AddEditCameraDialogComponent } from '../add-edit-camera-dialog/add-edit-camera-dialog.component';
import { MatSort } from '@angular/material/sort';
import { ToastrService } from 'ngx-toastr';
import { MatTableDataSource } from '@angular/material/table';
import { DeleteDrawingDialogComponent } from '../delete-drawing-dialog/delete-drawing-dialog.component';
import { CameraController } from '../controller/camera.controller';

@Component({
	selector: 'app-camera-page',
	templateUrl: './camera-page.component.html',
	styleUrls: ['./camera-page.component.scss']
})
export class CameraPageComponent implements OnInit {

	dataSource = new MatTableDataSource<any>();
	dataSourceLength: number = 0;
	displayedColumns: string[] = ['id', 'label', 'latitude', 'longitude', 'fovDeg', 'focalLengthPx', 'actions'];
	isDisabled: boolean = true;

	@ViewChild(MatSort) sort!: MatSort;

	constructor(
		private dialog: MatDialog,
		private toastr: ToastrService,
		private cameraController: CameraController
	) { }

	ngOnInit(): void {
		const userData = localStorage.getItem("user");

		if (userData) {
			const userObj = JSON.parse(userData);
			console.log(userObj.name); // Output: Mahima
		}


		this.getCameraList();
	}

	getCameraList() {
		this.cameraController.getCameraList().subscribe({
			next: (res) => {
				if (res.length > 0) {
					this.isDisabled = false;
				}
				this.dataSource.data = res;
				this.dataSource.sort = this.sort;
			},
			error: (err) => {
				console.error('Error in getCameraList:', err);
				this.toastr.error('Something went wrong');
			}
		});
	}

	openAddCameraDialog(id: number | null): void {
		const dialogRef = this.dialog.open(AddEditCameraDialogComponent, {
			height: "100%",
			width: '500px',
			position: { right: "-2px", top: "0px" },
			data: { id: id }
		});

		dialogRef.afterClosed().subscribe(result => {
			if (result) {
				console.log('Dialog result:', result);
				this.getCameraList();
			}
		});
	}

	openDeleteDrawingDialog(id: number, label: string): void {
		const dialogRef = this.dialog.open(DeleteDrawingDialogComponent, {
			width: '500px',
			data: { id: id, shapeName: 'Camera', label: label }
		});

		dialogRef.afterClosed().subscribe(result => {
			if (result) {
				console.log('Dialog result:', result);
				this.getCameraList();
			}
		});
	}

}
