import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoginController } from '../controller/login.controller';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
	selector: 'app-sign-up',
	templateUrl: './sign-up.component.html',
	styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent implements OnInit {

	signUpForm: FormGroup;
	hide = true;

	constructor(
		private fb: FormBuilder,
		private router: Router,
		private toastr: ToastrService,
		private loginController: LoginController
	) {
		this.signUpForm = this.fb.group({
			fullName: ['', Validators.required],
			email: ['', [Validators.required, Validators.email]],
			password: ['', Validators.required]
		});
	}

	ngOnInit(): void {
	}

	onSubmit() {
		if (this.signUpForm.valid) {
			this.loginController.signUp(this.signUpForm.value)
				.subscribe((res) => {
					this.toastr.success(res.message);
					this.router.navigate(['/login']);
					// this.router.navigate(['/login'], {
					// 	queryParams: { userName: this.signUpForm.value.email, password: this.signUpForm.value.password }
					// });
				},
					error => {
						console.log('error in onSubmit() -', error);
						this.toastr.error('Something went wrong');
					});
		} else {
			console.log("Form is invalid");
		}
	}

}
