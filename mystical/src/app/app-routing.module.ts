import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';

const routes: Routes = [
	{
		path: 'view-map',
		loadChildren: () => import('./view-map/view-map.module').then(m => m.ViewMapModule),
		canActivate: [AuthGuard]
	},
	{
		path: 'login',
		loadChildren: () => import('./login/login.module').then(m => m.LoginModule),
	},
	{
		path: 'sign-up',
		loadChildren: () => import('./sign-up/sign-up.module').then(m => m.SignUpModule),
	},
	{
		path: 'camera',
		loadChildren: () => import('./camera-page/camera-page.module').then(m => m.CameraPageModule),
		canActivate: [AuthGuard]
	}
]

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule { }
