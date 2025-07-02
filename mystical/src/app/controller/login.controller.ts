import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})

export class LoginController {

    constructor(
        private http: HttpClient,
    ) { }

    signUp(json: any) {
        return this.http.post<any>(`${environment.VISIONLOC_API_URL}sign-up`, json);
    }

    login(json: any) {
        return this.http.post<any>(`${environment.VISIONLOC_API_URL}login`, json);
    }
}