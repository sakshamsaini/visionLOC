import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CameraPageComponent } from './camera-page.component';

const routes: Routes = [
	{
		path: '',
		component: CameraPageComponent
	}
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class CameraPageRoutingModule { }
