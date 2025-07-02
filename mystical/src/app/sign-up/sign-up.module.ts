import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignupRoutingModule } from './sign-up-routing.module';
import { MatCardModule } from '@angular/material/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SignUpComponent } from './sign-up.component';


@NgModule({
	declarations: [
		SignUpComponent
	],
	imports: [
		CommonModule,
		NgbModule,
		SignupRoutingModule,
		FormsModule,
		MatButtonModule,
		MatInputModule,
		ReactiveFormsModule,
		MatCardModule
	]
})
export class SignUpModule { }
