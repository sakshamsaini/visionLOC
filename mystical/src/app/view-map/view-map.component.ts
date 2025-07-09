import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Location } from '@angular/common';
import { ViewController } from '../controller/view.controller';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { AddCustomMarkerDialogComponent } from '../add-custom-marker-dialog/add-custom-marker-dialog.component';
import { AddLabelDialogComponent } from '../add-label-dialog/add-label-dialog.component';
import { marker } from 'leaflet';
declare let L: any;

@Component({
	selector: 'app-view-map',
	templateUrl: './view-map.component.html',
	styleUrls: ['./view-map.component.scss']
})
export class ViewMapComponent implements OnInit {

	TYPE_CAMERA = 'camera';
	private map!: L.Map;
	private mapLayer!: L.TileLayer;
	private satelliteLayer!: L.TileLayer;
	baseMaps: any;

	showLogs: boolean = false;
	latitude: number = 0;
	longitude: number = 0;
	detectedObjectCount: number = 0;
	selectedView: string = '';

	detectedObjectList: any[] = [];
	customMarkerList: any[] = [];
	drawingList: any[] = [];

	detectedObjectMap: Map<number, L.Marker> = new Map();
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
	}

	ngAfterViewInit(): void {
		this.initMapLayer(); 	// 1. initialize map layers

		this.baseMaps = { 	//2.  Add Layer Control
			'Map View': this.mapLayer,
			'Satellite View': this.satelliteLayer
		};

		this.initMap(); 	//3. initialize map
		this.addControlWithLayers(); 	//4. add layer controls
		this.initDrawControls(); 	//5. drawing 

		this.dragAndDropCustomMarker();
		this.getDetectedObjectList();
		this.getCustomMarkerList(true);
		this.getDrawingList(true);
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
		// Initializing map layer
		this.mapLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			minZoom: 8,
			attribution: 'Map View'
		});

		// Initializing satellite layer
		this.satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
			maxZoom: 19,
			minZoom: 8,
			attribution: 'Satellite View'
		});
	}

	addControlWithLayers() {
		L.control.layers(this.baseMaps).addTo(this.map);
		L.control.scale({ imperial: false, metric: true }).addTo(this.map);

		//showing lat/long
		this.map.on('mousemove', (e: L.LeafletMouseEvent) => {
			this.latitude = e.latlng.lat;
			this.longitude = e.latlng.lng;
		});
	}

	getDetectedObjectList(): any[] {
		this.viewController.getDetectedObjectList().subscribe({
			next: (res) => {
				this.detectedObjectList = res;
				this.detectedObjectCount = this.detectedObjectList.filter(item => item.type != this.TYPE_CAMERA).length;

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

			if (obj.type != this.TYPE_CAMERA) {
				this.showImageOnMarkerClick(marker, obj.imageType, obj.imageBase64);
			}
			this.detectedObjectMap.set(obj.id, marker);
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
			case this.TYPE_CAMERA:
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

	hideDetectedObjectFromMap(label: string, id: number, event: MatSlideToggleChange | null) {
		const marker = this.detectedObjectMap.get(id);
		if (marker) {
			if (event != null && event.checked) {
				this.map.addLayer(marker);
				this.addTooltipToMarker(label, marker);
			} else {
				this.map.removeLayer(marker);
			}
		}
	}

	showView(view: string): void {
		this.selectedView = view;
	}

	onDragStart(event: DragEvent): void {
		event.dataTransfer?.setData('text/plain', 'button');
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
				this.addImageToCustomMarker(result, marker);
				this.markerMap.set(result.id, marker);

				this.getCustomMarkerList(false);
			} else {
				this.map.removeLayer(marker);
			}
		});
	}

	addImageToCustomMarker(data: any, marker: L.Marker) {
		if (data.image != null) {
			let newIcon = L.icon({
				iconUrl: data.imageBase64,
				iconSize: [23, 25],
				iconAnchor: [12, 41],
			});
			marker.setIcon(newIcon);
		}
		marker.closePopup();
		this.addTooltipToMarker(data.label, marker);
	}

	getCustomMarkerList(showMarkerOnMap: boolean) {
		this.viewController.getMarkerList().toPromise().then((res) => {
			this.customMarkerList = res;

			if (showMarkerOnMap) {
				this.addCustomMarkersOnMap(this.customMarkerList);
			}
		});

		return this.customMarkerList;
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
			this.markerMap.set(obj.id, marker);
		});
	}

	deleteCustomMarker(id: number) {
		this.viewController.deleteMarker(id).subscribe({
			next: (res) => {
				this.toastr.success(res.message);
				//remove marker from map
				const marker = this.markerMap.get(id);
				if (marker) {
					this.map.removeLayer(marker);
				}

				this.getCustomMarkerList(false);
			},
			error: (err) => {
				console.error('Error in deleteCustomMarker:', err);
				this.toastr.error('Something went wrong');
			}
		});
	}

	hideMarkerFromMap(label: string, id: number, event: MatSlideToggleChange | null) {
		const marker = this.markerMap.get(id);
		if (marker) {
			if (event != null && event.checked) {
				this.map.addLayer(marker);
				this.addTooltipToMarker(label, marker);
			} else {
				this.map.removeLayer(marker);
			}
		}
	}

	getDrawingList(showDrawingOnMap: boolean) {
		this.viewController.getDrawingList().toPromise().then((res) => {
			this.drawingList = res;

			if (showDrawingOnMap) {
				this.addDrawingOnMap(this.drawingList);
			}
		});
		return this.drawingList;
	}

	addDrawingOnMap(drawingList: any[]): void {
		drawingList.forEach(drawing => {
			const shapeName = drawing.shapeName;
			if (shapeName == 'POLYLINE') {
				this.drawPolyline(drawing);
			} else if (shapeName == 'CIRCLE') {
				this.drawCircle(drawing);
			} else {
				this.drawPolygon(drawing);
			}
		});
	}

	drawPolygon(drawing: any) {
		const polygonCoords = drawing.latlng.map((p: any) => [p.lat, p.lng]);
		const polygon = L.polygon(polygonCoords, {
			weight: 3,
			fillOpacity: 0.4
		}).addTo(this.map);

		polygon.on('mousemove', (e: L.LeafletMouseEvent) => {
			polygon.bindPopup(`Label: ${drawing.label} <br> Area: ${drawing.area.toFixed(2)} km²`).openPopup(e.latlng);
		});

		this.drawingMap.set(drawing.id, polygon);
	}

	drawPolyline(drawing: any) {
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
		this.drawingMap.set(drawing.id, group);
	}

	drawCircle(drawing: any) {
		const firstPoint = drawing.latlng[0];
		const circle = L.circle([firstPoint.lat, firstPoint.lng], {
			radius: drawing.radius,
			fillOpacity: 0.2
		}).addTo(this.map);

		circle.on('mousemove', (e: L.LeafletMouseEvent) => {
			circle.bindPopup(`Label: ${drawing.label} <br> Area: ${drawing.area.toFixed(2)} km²`).openPopup(e.latlng);
		});

		this.drawingMap.set(drawing.id, circle);
	}

	deleteDrawing(id: number) {
		this.viewController.deleteDrawing(id).subscribe({
			next: (res) => {
				const layer = this.drawingMap.get(id);
				this.map.removeLayer(layer);

				this.getDrawingList(false);
			},
			error: (err) => {
				console.error('Error in deleteDrawing:', err);
				this.toastr.error('Something went wrong');
			}
		});
	}

	// popupList: any[] = [];
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
				path: false
			},
			edit: {
				featureGroup: drawnItems
			}
		});
		this.map.addControl(drawControl);

		this.map.on('draw:created', (event: any) => {
			const layer = event.layer;
			drawnItems.addLayer(layer);
			let jsonObj = {};
			let popupList = [];
			const type = event.layerType;

			if (layer instanceof L.Polygon) {
				console.log('Polygon coordinates:', layer.getLatLngs());

				const latlngs = layer.getLatLngs()[0];
				const area = L.GeometryUtil.geodesicArea(latlngs) / 1000;
				const popupContent = `Area covered: ${area.toFixed(2)} km²`;

				if (type === 'rectangle') {
					const center = layer.getBounds().getCenter();
					layer.bindPopup(popupContent);

					setTimeout(() => {
						layer.openPopup(center);
					}, 100);
				} else {
					layer.bindPopup(popupContent).openPopup();
				}
				jsonObj = this.createJsonForDrawings(type.toUpperCase(), '', latlngs, area, null, null);
			}
			else if (layer instanceof L.Polyline) {
				const latlngs = layer.getLatLngs();
				console.log('Polyline coordinates:', latlngs, latlngs.length);

				//calculating bearing and backbearing
				let bearingAndBackBearingList = [];
				for (let i = 0; i < latlngs.length - 1; i++) {
					const bearing = this.calculateBearingAndBackBearing(latlngs[i].lat, latlngs[i].lng, latlngs[i + 1].lat, latlngs[i + 1].lng);
					const backBearing = (bearing + 180) % 360;
					bearingAndBackBearingList.push({ "bearing": bearing, "backBearing": backBearing });

					const popupLatitude = latlngs[i].lat;
					const popupLongitude = latlngs[i].lng;
					const popupContent = `Bearing: ${bearing.toFixed(2)}°<br>Backbearing: ${backBearing.toFixed(2)}°`;

					layer.bindPopup(popupContent).openPopup();
					const popup = this.showPopup(popupLatitude, popupLongitude, popupContent);
					popupList.push(popup);
				}
				jsonObj = this.createJsonForDrawings(type.toUpperCase(), '', latlngs, null, bearingAndBackBearingList, null);
			}
			else if (layer instanceof L.Circle) {
				const latlngs = layer._latlng;
				console.log('Circle coordinates:', layer._latlng);

				const radius = layer.getRadius(); // in meters
				const area = (Math.PI * radius * radius) / 1000;
				const popupContent = `Area covered: ${area.toFixed(2)} km²`;

				const center = layer.getBounds().getCenter();
				layer.bindPopup(popupContent);
				setTimeout(() => {
					layer.openPopup(center);
				}, 100);

				jsonObj = this.createJsonForDrawings(type.toUpperCase(), '', [latlngs], area, null, radius);
			}
			else {
				console.log('Unknown layer:', layer);
			}

			this.openAddlabelDialog(jsonObj, layer, popupList);
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

	openAddlabelDialog(jsonObj: any, layer: any, popupList: any[]): void {
		const dialogRef = this.dialog.open(AddLabelDialogComponent, {
			width: '500px',
			data: { label: '', jsonObj: jsonObj }
		});

		dialogRef.afterClosed().subscribe(result => {
			if (result) {
				console.log('Dialog result:', result);
				this.drawingMap.set(result.id, layer);

				this.getDrawingList(false);
			} else {
				this.map.removeLayer(layer);

				if (popupList.length) {
					popupList.forEach(popup => this.map.removeLayer(popup)); // remove all popups
					popupList = [];
				}
			}
		});
	}

	showPopup(latitude: number, longitude: number, content: string) {
		console.log('showing popup')
		return L.popup()
			.setLatLng([latitude, longitude])
			.setContent(content)
			.addTo(this.map);
	}

	calculateBearingAndBackBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
		const toRad = (deg: number) => deg * Math.PI / 180;
		const toDeg = (rad: number) => rad * 180 / Math.PI;

		const φ1 = toRad(lat1);
		const φ2 = toRad(lat2);
		const Δλ = toRad(lon2 - lon1);

		const y = Math.sin(Δλ) * Math.cos(φ2);
		const x = Math.cos(φ1) * Math.sin(φ2) -
			Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

		const θ = Math.atan2(y, x);

		const bearing = (toDeg(θ) + 360) % 360;
		const roundedBearing = Number(bearing.toFixed(4));
		return roundedBearing;
	}

	ngOnDestroy(): void {
		if (this.map) {
			this.map.remove();
		}
	}

	logoutFn() {
		localStorage.removeItem('signUpID');
		localStorage.removeItem('user');
		this.router.navigate(['/login']);
	}

	goBack(): void {
		this.location.back();
	}
}
