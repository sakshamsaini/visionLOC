import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';

const routes: Routes = [
	{
		path: 'view-map',
		loadChildren: () => import('./view/view.module').then(m => m.ViewModule),
		canActivate: [AuthGuard]
	},
	{
		path: 'login',
		loadChildren: () => import('./login/login.module').then(m => m.LoginModule),
	},
	{
		path: 'sign-up',
		loadChildren: () => import('./sign-up/sign-up.module').then(m => m.SignUpModule),
	}
]

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule { }
