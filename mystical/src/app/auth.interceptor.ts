import { Injectable } from '@angular/core';
import {
	HttpRequest,
	HttpHandler,
	HttpEvent,
	HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
	intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		const signUpID = localStorage.getItem('signUpID');

		if (signUpID) {
			// Clone request and add signUpID header
			const cloned = req.clone({
				setHeaders: {
					signUpID: signUpID
				}
			});
			return next.handle(cloned);
		}

		return next.handle(req);
	}
}
