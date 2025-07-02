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

    postMarker(formData: any) {
        return this.http.post<any>(`${environment.VISIONLOC_API_URL}marker`, formData);
    }

    getMarkerList(): Observable<any[]> {
        return this.http.get<any[]>(`${environment.VISIONLOC_API_URL}markers`);
    }

    deleteMarker(id: number) {
        return this.http.delete<any>(`${environment.VISIONLOC_API_URL}marker/${id}`);
    }

    postDrawing(json: any) {
        return this.http.post<any>(`${environment.VISIONLOC_API_URL}drawing`, json);
    }

    getDrawingList(): Observable<any[]> {
        return this.http.get<any[]>(`${environment.VISIONLOC_API_URL}drawings`);
    }

    deleteDrawing(id: number) {
        return this.http.delete<any>(`${environment.VISIONLOC_API_URL}drawing/${id}`);
    }

}