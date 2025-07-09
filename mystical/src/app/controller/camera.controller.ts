import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})

export class CameraController {

    constructor(
        private http: HttpClient,
    ) { }

    postCamera(form: any) {
        return this.http.post<any>(`${environment.VISIONLOC_API_URL}camera`, form);
    }

    getCameraByID(id: number) {
        return this.http.get<any>(`${environment.VISIONLOC_API_URL}camera/${id}`);
    }

    getCameraList(): Observable<any[]> {
        return this.http.get<any[]>(`${environment.VISIONLOC_API_URL}cameras`);
    }

    updateCamera(id: number, json: any) {
        return this.http.patch<any>(`${environment.VISIONLOC_API_URL}camera/${id}`, json);
    }

    deleteCamera(id: number) {
        return this.http.delete<any>(`${environment.VISIONLOC_API_URL}camera/${id}`);
    }

}