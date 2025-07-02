import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoginController } from '../controller/login.controller';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

	loginForm: FormGroup;

	constructor(
		private fb: FormBuilder,
		private router: Router,
		private route: ActivatedRoute,
		private toastr: ToastrService,
		private loginController: LoginController) {

		this.loginForm = this.fb.group({
			userName: ['', [Validators.required, Validators.email]],
			password: ['', Validators.required]
		});

		this.route.queryParams.subscribe(params => {
			this.loginForm.get('userName')?.setValue(params['userName']);
			this.loginForm.get('password')?.setValue(params['password']);
		});
	}

	ngOnInit(): void {
	}

	onSubmit() {
		if (this.loginForm.valid) {
			this.loginController.login(this.loginForm.value)
				.subscribe((res) => {
					console.log(res)

					if (res['response']) {
						this.toastr.success(res['message']);
						localStorage.setItem('signUpID', res['response'].id);

						this.router.navigate(['/view-map']);
					} else {
						this.toastr.error(res['message']);
					}
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
