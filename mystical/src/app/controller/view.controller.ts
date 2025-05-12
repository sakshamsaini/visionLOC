import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})

export class ViewController {

    constructor(
        private http: HttpClient,
    ) { }

    getDetectedObjectList(): Observable<any[]> {
        return this.http.get<any[]>(`${environment.VISIONLOC_API_URL}detected-objects`);
    }

}