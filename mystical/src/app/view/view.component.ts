import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ViewController } from '../controller/view.controller';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { AddCustomMarkerDialogComponent } from '../add-custom-marker-dialog/add-custom-marker-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { AddLabelDialogComponent } from '../add-label-dialog/add-label-dialog.component';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Location } from '@angular/common';
// import * as L from 'leaflet';
declare let L: any; // Let the global L from the script tag be used

@Component({
	selector: 'app-view',
	templateUrl: './view.component.html',
	styleUrls: ['./view.component.scss']
})
export class ViewComponent implements OnInit {

	private map!: L.Map;
	private mapLayer!: L.TileLayer;
	private satelliteLayer!: L.TileLayer;
	baseMaps: any;

	latitude: number = 0;
	longitude: number = 0;

	showLogs: boolean = false;
	showMarkers: boolean = false;
	showDrawings: boolean = false;
	detectedObjectList: any[] = [];
	customMarkerList: any[] = [];
	drawingList: any[] = [];

	markerMap: Map<number, L.Marker> = new Map(); // Keyed by object ID
	imageMarkersMap = new Map<L.Marker, L.Marker>();
	drawingMap: Map<number, any> = new Map();

	@ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

	constructor(
		private dialog: MatDialog,
		private router: Router,
		private toastr: ToastrService,
		private location: Location,
		private viewController: ViewController,
	) { }

	ngOnInit(): void {
		this.detectedObjectList = this.getDetectedObjectList();
	}

	ngAfterViewInit(): void {
		this.initMapLayer(); 	// 1. initialize map layers

		this.baseMaps = { 	//2.  Add Layer Control
			'Map View': this.mapLayer,
			'Satellite View': this.satelliteLayer
		};

		this.initMap(); 	//3. initialize map
		this.addDetectedObjectMarkers(this.detectedObjectList); 	//4. add pop-ups
		this.addControlWithLayers(); 	//5. add layer controls
		this.showLatLong();	 	//6. add event listeners
		this.initDrawControls(); 	//7. drawing 
		// this.addCompass()	;//8. compass
		this.dragAndDropCustomMarker();
		this.getCustomMarkerListAndAddToMap();
		this.getDrawingListAndAddToMap();
	}

	private initMap(): void {
		// Initialize the map centered on specified coordinates
		this.map = L.map(this.mapContainer.nativeElement, {
			center: [27.188984, 78.02575360], // red fort coords
			zoom: 12,                   // Starting zoom level
			minZoom: 8,                 // How far out you can zoom
			maxZoom: 19,                // How far in you can zoom (make sure tiles exist!)
			zoomControl: true,
			attributionControl: true,
		});

		// Default to map view
		this.mapLayer.addTo(this.map);
	}

	initMapLayer() {
		this.mapLayerFn();
		this.satelliteLayerFn();
	}

	mapLayerFn() {
		// this.mapLayer = L.tileLayer('http://192.168.1.6/tileserver-php/newMap/{z}/{x}/{y}.png', {
		this.mapLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			minZoom: 8,
			attribution: 'Map View'
		});
	}

	satelliteLayerFn() {
		// this.satelliteLayer = L.tileLayer('http://localhost/tileserver-php/newMap/{z}/{x}/{y}.png', {
		this.satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
			maxZoom: 19,
			minZoom: 8,
			attribution: 'Satellite View'
		});
	}

	addDetectedObjectMarkers(detectedObjectList: any[]): void {
		detectedObjectList.forEach(obj => {
			const iconType = this.getIconAndImageByType(obj.type);
			const leaftletIcon = L.icon({
				iconUrl: iconType,
				iconSize: [33, 35],
				iconAnchor: [12, 41],
			});

			const marker = L.marker([obj.latitude, obj.longitude], { icon: leaftletIcon }).addTo(this.map);
			this.addTooltipToMarker(obj.label, marker);

			if (obj.type != 'camera') {
				this.showImageOnMarkerClick(marker, obj.imageType, obj.imageBase64);
			}
			this.markerMap.set(obj.latitude, marker);
		});
	}

	getIconAndImageByType(type: string) {
		let iconType = '';

		switch (type) {
			case 'person':
				iconType = 'assets/icons/person.png';
				break;
			case 'vehicle':
				iconType = 'assets/icons/vehicle_car.png';
				break;
			case 'animal':
				iconType = 'assets/icons/animal.png';
				break;
			case 'camera':
				iconType = 'assets/icons/camera.png';
				break;
			default:
				iconType = 'assets/icons/location.png';
				break;
		}
		return iconType;
	}

	addTooltipToMarker(label: string, marker: L.Marker) {
		marker.bindTooltip(
			`<b>${label}</b><br>`,
			{ permanent: false, direction: 'top' }
		);
	}

	showImageOnMarkerClick(marker: L.Marker, imageType: string, imageBase64: string) {
		marker.on('click', () => {
			// Don't recreate if image already exists
			if (this.imageMarkersMap.has(marker)) return;

			// Shift the image to the left (~0.0007 degrees)
			const markerLatLng = marker.getLatLng();
			const imagePosition = L.latLng(markerLatLng.lat, markerLatLng.lng - 0.0007);

			// Create a custom icon with the image
			const base64Src = `data:${imageType};base64,${imageBase64}`;
			const imageIcon = L.divIcon({
				html: `<img src="${base64Src}" style="width:600px; height:350px;" />`,
				iconSize: [300, 100],
				iconAnchor: [0, 0]
			});

			const imageMarker = L.marker(imagePosition, { icon: imageIcon, interactive: true }).addTo(this.map);
			this.imageMarkersMap.set(marker, imageMarker);

			// Add click handler to image itself to remove it
			imageMarker.on('click', () => {
				this.map.removeLayer(imageMarker);
				this.imageMarkersMap.delete(marker);
			});
		});
	}

	// Add scale control
	addControlWithLayers() {
		L.control.layers(this.baseMaps).addTo(this.map);

		L.control.scale({ imperial: false, metric: true }).addTo(this.map);
	}

	showLatLong() {
		this.map.on('mousemove', (e: L.LeafletMouseEvent) => {
			this.latitude = e.latlng.lat;
			this.longitude = e.latlng.lng;
		});
	}

	getDetectedObjectList(): any[] {
		this.viewController.getDetectedObjectList().subscribe({
			next: (res) => {
				this.detectedObjectList = res;

				// Wait until map is initialized
				if (this.map) {
					this.addDetectedObjectMarkers(this.detectedObjectList);
					this.map.setView([this.detectedObjectList[0].latitude, this.detectedObjectList[0].longitude], 10);
				} else {
					// If map isn't ready yet, poll until it is
					const interval = setInterval(() => {
						if (this.map) {
							this.addDetectedObjectMarkers(this.detectedObjectList);
							clearInterval(interval);
						}
					}, 100);
				}
			},
			error: (err) => {
				console.error('Error in getDetectedObjectList:', err);
				this.toastr.error('Something went wrong');
			}
		});
		return this.detectedObjectList;
	}

	initDrawControls(): void {
		const drawnItems = new L.FeatureGroup();
		this.map.addLayer(drawnItems);

		const drawControl = new L.Control.Draw({
			draw: {
				polygon: true,
				polyline: true,
				rectangle: true,
				circle: true,
				marker: false,
				circlemarker: false,
				path: true
			},
			edit: {
				featureGroup: drawnItems
			}
		});
		this.map.addControl(drawControl);

		this.map.on('draw:created', (event: any) => {
			const layer = event.layer;
			console.log(layer);

			drawnItems.addLayer(layer);
			let popupContent: string = '';
			let popupLatitude: number = 0;
			let popupLongitude: number = 0;
			let jsonObj = {};

			// Check geometry type and get coordinates appropriately
			if (layer instanceof L.Polygon) {
				console.log('Polygon coordinates:', layer.getLatLngs());
				//calculating area
				const latlngs = layer.getLatLngs()[0];
				const areaInSqMeters = L.GeometryUtil.geodesicArea(latlngs) / 1000;

				popupLatitude = latlngs[0].lat;
				popupLongitude = latlngs[0].lng;
				popupContent = `Area covered: ${areaInSqMeters.toFixed(2)} km²`;

				this.showPopup(popupLatitude, popupLongitude, popupContent);
				jsonObj = this.createJsonForDrawings("POLYGON", '', latlngs, areaInSqMeters, null, null);
			}
			else if (layer instanceof L.Polyline) {
				const latlngs = layer.getLatLngs();
				console.log('Polyline coordinates:', latlngs, latlngs.length);

				//calculating bearing and backbearing
				let bearingAndBackBearingList = [];
				for (let i = 0; i < latlngs.length - 1; i++) {
					const bearing = this.calculateBearing(latlngs[i].lat, latlngs[i].lng, latlngs[i + 1].lat, latlngs[i + 1].lng);
					const backBearing = (bearing + 180) % 360;
					bearingAndBackBearingList.push({ "bearing": bearing, "backBearing": backBearing });

					popupLatitude = latlngs[i].lat;
					popupLongitude = latlngs[i].lng;
					popupContent = `Bearing: ${bearing.toFixed(2)}°<br>Backbearing: ${backBearing.toFixed(2)}°`;

					this.showPopup(popupLatitude, popupLongitude, popupContent);
				}
				jsonObj = this.createJsonForDrawings("POLYLINE", '', latlngs, null, bearingAndBackBearingList, null);
			}
			else if (layer instanceof L.Circle) {
				const latlngs = layer._latlng;
				console.log('Circle coordinates:', layer._latlng);
				// calculating area
				const radius = layer.getRadius(); // in meters
				const area = (Math.PI * radius * radius) / 1000;

				popupLatitude = latlngs.lat;
				popupLongitude = latlngs.lng;
				popupContent = `Area covered: ${area.toFixed(2)} km²`;

				this.showPopup(popupLatitude, popupLongitude, popupContent);
				jsonObj = this.createJsonForDrawings("CIRCLE", '', [latlngs], area, null, radius);
			}
			else {
				console.log('Unknown layer:', layer);
			}

			if (popupLatitude != 0 && popupLongitude != 0) {
				//showing popup on click
				layer.on('click', (e: L.LeafletMouseEvent) => {
					this.showPopup(popupLatitude, popupLongitude, popupContent);
				});

				this.openAddlabelDialog(jsonObj, layer);
			}
		});
	}

	createJsonForDrawings(shapeName: string, label: string, latlng: any[], area: number | null,
		bearAndbackBearing: any[] | null, radius: number | null) {
		let drawingJson = {
			"shapeName": shapeName,
			"label": label,
			"latlng": latlng,
			"area": area,
			"bearAndbackBearing": bearAndbackBearing,
			"radius": radius
		}
		return drawingJson;
	}

	showPopup(latitude: number, longitude: number, content: string) {
		L.popup()
			.setLatLng([latitude, longitude])
			.setContent(content)
			.addTo(this.map);
	}

	openAddlabelDialog(jsonObj: any, layer: any): void {
		const dialogRef = this.dialog.open(AddLabelDialogComponent, {
			width: '500px',
			data: { label: '', jsonObj: jsonObj }
		});

		dialogRef.afterClosed().subscribe(result => {
			if (result) {
				console.log('Dialog result:', result);
				this.drawingMap.set(result.id, layer);
				this.getDrawingList();
			}
		});
	}

	removeMarkerFromMap(label: string, latitude: number, event: MatSlideToggleChange | null) {
		const marker = this.markerMap.get(latitude);
		if (marker) {
			if (event != null && event.checked) {
				this.map.addLayer(marker);
				this.addTooltipToMarker(label, marker);
			} else {
				this.map.removeLayer(marker);
			}
		}
	}

	deleteCustomMarker(id: number, latitude: number) {
		this.viewController.deleteMarker(id).subscribe({
			next: (res) => {
				this.toastr.success(res.message);
				//remove marker from map
				const marker = this.markerMap.get(latitude);
				if (marker) {
					this.map.removeLayer(marker);
				}

				this.getCustomMarkerList();
			},
			error: (err) => {
				console.error('Error in deleteCustomMarker:', err);
				this.toastr.error('Something went wrong');
			}
		});
	}

	addCustomMarker(data: any, marker: L.Marker) {
		if (data.image != null) {
			let newIcon = L.icon({
				iconUrl: data.imageBase64,
				iconSize: [23, 25],
				iconAnchor: [12, 41],
			});
			marker.setIcon(newIcon);
		}

		marker.unbindPopup();
		this.addTooltipToMarker(data.label, marker);
	}

	calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
		const toRad = (deg: number) => deg * Math.PI / 180;
		const toDeg = (rad: number) => rad * 180 / Math.PI;

		const φ1 = toRad(lat1);
		const φ2 = toRad(lat2);
		const Δλ = toRad(lon2 - lon1);

		const y = Math.sin(Δλ) * Math.cos(φ2);
		const x = Math.cos(φ1) * Math.sin(φ2) -
			Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

		const θ = Math.atan2(y, x);

		return (toDeg(θ) + 360) % 360; // Normalize to 0–360
	}

	onDragStart(event: DragEvent): void {
		event.dataTransfer?.setData('text/plain', 'button'); // Optional
	}

	dragAndDropCustomMarker(): void {
		const mapEl = this.map.getContainer();

		mapEl.addEventListener('dragover', (event) => {
			event.preventDefault(); // Important: allows drop
		});

		mapEl.addEventListener('drop', (event: DragEvent) => {
			event.preventDefault();
			const rect = mapEl.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;

			const latlng = this.map.containerPointToLatLng([x, y]);
			let _latitude = latlng.lat;
			let _longitude = latlng.lng

			const marker = L.marker([_latitude, _longitude]).addTo(this.map);
			let popupContent = `Dropped at:<br><b>Lat:</b> ${_latitude.toFixed(5)}<br><b>Lng:</b> ${_longitude.toFixed(5)}`;
			marker.bindPopup(popupContent).openPopup();

			this.openAddCustomMarkerDialog(_latitude, _longitude, marker);

			// marker.on('click', (e: L.LeafletMouseEvent) => {
			// 	this.openAddCustomMarkerDialog(_latitude, _longitude, marker);
			// });
		});
	}

	getCustomMarkerListAndAddToMap() {
		this.viewController.getMarkerList().subscribe({
			next: (res) => {
				this.customMarkerList = res;

				// Wait until map is initialized
				if (this.map) {
					this.addCustomMarkersOnMap(this.customMarkerList);
				} else {
					// If map isn't ready yet, poll until it is
					const interval = setInterval(() => {
						if (this.map) {
							this.addCustomMarkersOnMap(this.customMarkerList);
							clearInterval(interval);
						}
					}, 100);
				}
			},
			error: (err) => {
				console.error('Error in getCustomMarkerListAndAddToMap:', err);
				this.toastr.error('Something went wrong');
			}
		});
		return this.customMarkerList;
	}

	getCustomMarkerList() {
		this.viewController.getMarkerList().subscribe({
			next: (res) => {
				this.customMarkerList = res;
			},
			error: (err) => {
				console.error('Error in getCustomMarkerList:', err);
				this.toastr.error('Something went wrong');
			}
		});
		return this.customMarkerList;
	}

	getDrawingListAndAddToMap() {
		this.viewController.getDrawingList().subscribe({
			next: (res) => {
				this.drawingList = res;

				// Wait until map is initialized
				if (this.map) {
					this.addDrawingOnMap(this.drawingList);
				} else {
					// If map isn't ready yet, poll until it is
					const interval = setInterval(() => {
						if (this.map) {
							this.addDrawingOnMap(this.drawingList);
							clearInterval(interval);
						}
					}, 100);
				}
			},
			error: (err) => {
				console.error('Error in getDrawingListAndAddToMap:', err);
				this.toastr.error('Something went wrong');
			}
		});
		return this.drawingList;
	}

	getDrawingList() {
		this.viewController.getDrawingList().subscribe({
			next: (res) => {
				this.drawingList = res;
			},
			error: (err) => {
				console.error('Error in getDrawingList:', err);
				this.toastr.error('Something went wrong');
			}
		});
		return this.drawingList;
	}

	deleteDrawing(id: number) {
		this.viewController.deleteDrawing(id).subscribe({
			next: (res) => {
				const layer = this.drawingMap.get(id);
				this.map.removeLayer(layer);
				this.getDrawingList();
			},
			error: (err) => {
				console.error('Error in deleteDrawing:', err);
				this.toastr.error('Something went wrong');
			}
		});
	}

	addDrawingOnMap(drawingList: any[]): void {
		drawingList.forEach(drawing => {
			const shapeName = drawing.shapeName;
			const label = drawing.label;
			const id = drawing.id;
			if (shapeName == 'POLYGON') {
				const polygonCoords = drawing.latlng.map((p: any) => [p.lat, p.lng]);
				const polygon = L.polygon(polygonCoords, {
					weight: 3,
					fillOpacity: 0.4
				}).addTo(this.map);

				polygon.on('mousemove', (e: L.LeafletMouseEvent) => {
					polygon.bindPopup(`Label: ${drawing.label} <br> Area: ${drawing.area.toFixed(2)} km²`).openPopup(e.latlng);
				});

				this.drawingMap.set(id, polygon);

			} else if (shapeName == 'POLYLINE') {
				const polylineCoords = drawing.latlng.map((p: any) => [p.lat, p.lng]);

				const group = L.featureGroup().addTo(this.map);

				const polyline = L.polyline(polylineCoords, {
				}).addTo(this.map).addTo(group);

				drawing.bearAndbackBearing.forEach((b: any, index: number) => {
					const point1 = polylineCoords[index];
					const point2 = polylineCoords[index + 1];

					if (point1 && point2) {
						const midLat = (point1[0] + point2[0]) / 2;
						const midLng = (point1[1] + point2[1]) / 2;

						const popupMarker = L.circleMarker([midLat, midLng], {
							radius: 5,
							// color: 'transparent',
							fillOpacity: 0
						}).addTo(this.map).addTo(group);

						popupMarker.on('mousemove', (e: L.LeafletMouseEvent) => {
							popupMarker.bindPopup(`<b>${drawing.label}</b><br> Bearing: ${b.bearing}°<br>Back: ${b.backBearing}°`).openPopup(e.latlng);
						});
					}
				});
				this.drawingMap.set(id, group);

			} else if (shapeName == 'CIRCLE') {
				const firstPoint = drawing.latlng[0];
				const circle = L.circle([firstPoint.lat, firstPoint.lng], {
					radius: drawing.radius,
					fillOpacity: 0.2
				}).addTo(this.map);

				circle.on('mousemove', (e: L.LeafletMouseEvent) => {
					circle.bindPopup(`Label: ${drawing.label} <br> Area: ${drawing.area.toFixed(2)} km²`).openPopup(e.latlng);
				});

				this.drawingMap.set(id, circle);
			}
		});
	}

	addCustomMarkersOnMap(customMarkerList: any[]): void {
		customMarkerList.forEach(obj => {
			let marker = L.marker();
			if (obj.image != null) {
				const leaftletIcon = L.icon({
					iconUrl: `data:${obj.imageType};base64,${obj.image}`,
					iconSize: [33, 35],
					iconAnchor: [12, 41],
				});
				marker = L.marker([obj.latitude, obj.longitude], { icon: leaftletIcon }).addTo(this.map);
			} else {
				marker = L.marker([obj.latitude, obj.longitude]).addTo(this.map);
			}

			this.addTooltipToMarker(obj.label, marker);
			this.markerMap.set(obj.latitude, marker);
		});
	}

	openAddCustomMarkerDialog(_latitude: number, _longitude: number, marker: L.Marker): void {
		const dialogRef = this.dialog.open(AddCustomMarkerDialogComponent, {
			width: '500px',
			data: { label: '', latitude: _latitude, longitude: _longitude }
		});

		dialogRef.afterClosed().subscribe(result => {
			if (result) {
				console.log('Dialog result:', result);
				this.addCustomMarker(result, marker);
				this.markerMap.set(_latitude, marker);

				this.getCustomMarkerList();
			} else {
				this.map.removeLayer(marker);
			}
		});
	}

	changeFlagValues(flag: string) {
		if (flag === 'SHOW_LOGS') {
			this.showLogs = !this.showLogs;
			if (this.showLogs) {
				this.showMarkers = false;
				this.showDrawings = false;
			}
		} else if (flag === 'SHOW_MARKERS') {
			this.showMarkers = !this.showMarkers;
			if (this.showMarkers) {
				this.showLogs = false;
				this.showDrawings = false;
			}
		}
		else if (flag === 'SHOW_DRAWINGS') {
			this.showDrawings = !this.showDrawings;
			if (this.showDrawings) {
				this.showLogs = false;
				this.showMarkers = false;
			}
		}
	}

	ngOnDestroy(): void {
		if (this.map) {
			this.map.remove();
		}
	}

	logoutFn() {
		localStorage.removeItem('signUpID');
		this.router.navigate(['/login']);
	}

	goBack(): void {
		this.location.back();
	}

}
