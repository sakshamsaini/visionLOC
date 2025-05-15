import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ViewController } from '../controller/view.controller';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { AddCustomMarkerDialogComponent } from '../add-custom-marker-dialog/add-custom-marker-dialog.component';
import { MatDialog } from '@angular/material/dialog';
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
	detectedObjectList: any[] = [];
	markerMap: Map<number, L.Marker> = new Map(); // Keyed by object ID
	imageMarkersMap = new Map<L.Marker, L.Marker>();

	@ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

	constructor(
		private viewController: ViewController,
		private dialog: MatDialog
	) { }

	ngOnInit(): void {
		this.detectedObjectList = this.getDetectedObjectList();
	}

	ngAfterViewInit(): void {
		// 1. initialize map layers
		this.initMapLayer();

		//2.  Add Layer Control
		this.baseMaps = {
			'Map View': this.mapLayer,
			'Satellite View': this.satelliteLayer
		};

		//3. initialize map
		this.initMap();

		//4. add pop-ups
		this.addMarkers(this.detectedObjectList);

		//5. add layer controls
		this.addControlWithLayers();

		//6. add event listeners
		this.showLatLong();

		//7. drawing 
		this.initDrawControls();

		//8. compass
		// this.addCompass();
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

	// Offline tile layer using local MBTiles or pre-downloaded tiles served from assets
	// Assuming tiles are stored in assets/tiles/{z}/{x}/{y}.png
	initMapLayer() {
		this.mapLayerFn();
		this.satelliteLayerFn();
	}

	mapLayerFn() {
		// this.mapLayer = L.tileLayer('http://192.168.1.27/tileserver-php/newMap/{z}/{x}/{y}.png', {
		this.mapLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			minZoom: 8,
			attribution: 'Map'
		});
	}

	satelliteLayerFn() {
		this.satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
			maxZoom: 19,
			minZoom: 8,
			attribution: 'Map'
		});
	}

	addMarkers(detectedObjectList: { latitude: number, longitude: number, label: string, description: string }[]): void {
		detectedObjectList.forEach(obj => {
			const marker = L.marker([obj.latitude, obj.longitude]).addTo(this.map);
			this.addTooltipToMarker(obj.label, marker);

			this.markerMap.set(obj.latitude, marker);
		});
	}

	addTooltipToMarker(label: string, marker: L.Marker) {
		marker.bindTooltip(
			// `<b>${obj.label}</b><br>${obj.description}`,
			`<b>${label}</b><br>`,
			{ permanent: false, direction: 'top' }
			// ).openTooltip();
		);

		// Add click listener to the marker
		this.showImageOnMarkerClick(marker);
	}

	showImageOnMarkerClick(marker: L.Marker) {
		marker.on('click', () => {
			const imageUrl = 'assets/images/test.png';

			// Don't recreate if image already exists
			if (this.imageMarkersMap.has(marker)) return;

			// Shift the image to the left (~0.0007 degrees)
			const markerLatLng = marker.getLatLng();
			const imagePosition = L.latLng(markerLatLng.lat, markerLatLng.lng - 0.0007);

			// Create a custom icon with the image
			const imageIcon = L.divIcon({
				html: `<img src="${imageUrl}" style="width:600px; height:350px;" />`,
				iconSize: [300, 100],
				iconAnchor: [0, 0]
			});

			// Create a new marker with the image
			const imageMarker = L.marker(imagePosition, { icon: imageIcon, interactive: true }).addTo(this.map);

			// Store this image marker in map
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

		// Add the compass control
		// L.control.compass().addTo(this.map);
		this.map.addControl(new L.Control.Compass());


	}

	showLatLong() {
		// Listen to mousemove event to update coordinates
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
					this.addMarkers(this.detectedObjectList);

					this.map.setView([this.detectedObjectList[0].latitude, this.detectedObjectList[0].longitude], 10);
				} else {
					// If map isn't ready yet, poll until it is
					const interval = setInterval(() => {
						if (this.map) {
							this.addMarkers(this.detectedObjectList);
							clearInterval(interval);
						}
					}, 100);
				}
			},
			error: (err) => {
				console.error('Error in getDetectedObjectList:', err);
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
				rectangle: false,
				circle: false,
				marker: true,
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
			drawnItems.addLayer(layer);


			console.log(layer)
			// Check geometry type and get coordinates appropriately
			if (layer instanceof L.Marker) {
				console.log('Marker position:', layer.getLatLng());
			}
			else if (layer instanceof L.Polygon) {
				console.log('Polygon coordinates:', layer.getLatLngs());

				//calculating area
				const latlngs = layer.getLatLngs()[0];
				const areaInSqMeters = L.GeometryUtil.geodesicArea(latlngs) / 1000;
				console.log(`Area covered: ${areaInSqMeters.toFixed(2)} km²`);

				L.popup()
					.setLatLng([latlngs[0].lat, latlngs[0].lng])
					.setContent(`Area covered: ${areaInSqMeters.toFixed(2)} km²`)
					.openOn(this.map);
			}
			else if (layer instanceof L.Polyline) {
				const latlngs = layer.getLatLngs();
				console.log('Polyline coordinates:', latlngs, latlngs.length);

				//calculating bearing and backbearing
				for (let i = 0; i < latlngs.length - 1; i++) {
					const bearing = this.calculateBearing(latlngs[i].lat, latlngs[i].lng, latlngs[i + 1].lat, latlngs[i + 1].lng);
					const backBearing = (bearing + 180) % 360;

					// Optional: show a popup on each point
					L.popup()
						.setLatLng([latlngs[i].lat, latlngs[i].lng])
						.setContent(`Bearing: ${bearing.toFixed(2)}°<br>Backbearing: ${backBearing.toFixed(2)}°`)
						.addTo(this.map);
				}
				// const latlngs = layer.getLatLngs();
				// const bearing = this.calculateBearing(latlngs[0].lat, latlngs[0].lng, latlngs[1].lat, latlngs[1].lng);
				// const backBearing = (bearing + 180) % 360;

				// L.popup()
				// 	.setLatLng([latlngs[0].lat, latlngs[0].lng])
				// 	.setContent(`Bearing: ${bearing.toFixed(2)}°<br>Backbearing: ${backBearing.toFixed(2)}°`)
				// 	.openOn(this.map);
				// console.log(`Bearing: ${bearing.toFixed(2)}°`);
				// console.log(`Backbearing: ${backBearing.toFixed(2)}°`);

			}
			else {
				console.log('Unknown layer:', layer);
			}
		});
	}

	removeMarker(label: string, latitude: number, longitude: number, event: MatSlideToggleChange) {
		const marker = this.markerMap.get(latitude);
		if (marker) {
			if (event.checked) {
				this.map.addLayer(marker);
				this.addTooltipToMarker(label, marker);
			} else {
				this.map.removeLayer(marker);
			}
		}
	}

	addCompass() {
		window.addEventListener('deviceorientation', (event) => {
			console.log('Orientation:', event.alpha, event.beta, event.gamma);
		});


		const compass = new L.Control.Compass({
			autoActive: true,
			showDigit: true,
		});
		this.map.addControl(compass);
	}

	addCustomMarker(data: any) {
		const leaftletIcon = L.icon({
			iconUrl: 'assets/icons/compass-icon.png',
			iconSize: [35, 50],
			iconAnchor: [12, 41],
			popupAnchor: [-3, -76],
		});

		const marker = L.marker([data.latitude, data.longitude], { icon: leaftletIcon }).addTo(this.map);
		this.addTooltipToMarker(data.label, marker);
	}

	openAddCustomMarkerDialog(): void {
		const dialogRef = this.dialog.open(AddCustomMarkerDialogComponent, {
			width: '500px',
			data: { label: '', latitude: '', longitude: '' }
		});

		dialogRef.afterClosed().subscribe(result => {
			if (result) {
				console.log('Dialog result:', result);
				// handle the result data
				this.addCustomMarker(result);
			}
		});
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

	ngOnDestroy(): void {
		if (this.map) {
			this.map.remove();
		}
	}
}
