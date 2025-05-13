import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ViewController } from '../controller/view.controller';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
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

	isSatelliteView = false;
	latitude: number = 0;
	longitude: number = 0;

	showLogs: boolean = false;
	detectedObjectList: any[] = [];
	markerMap: Map<number, L.Marker> = new Map(); // Keyed by object ID

	@ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

	constructor(private viewController: ViewController,
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
	}

	private initMap(): void {
		// Initialize the map centered on specified coordinates
		this.map = L.map(this.mapContainer.nativeElement, {
			center: [27.188984, 78.02575360], // red fort coords
			zoom: 12,                   // Starting zoom level
			minZoom: 3,                 // How far out you can zoom
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
		this.mapLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			minZoom: 3,
			attribution: 'Map'
		});
	}

	satelliteLayerFn() {
		this.satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
			maxZoom: 19,
			minZoom: 3,
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
		).openTooltip();
	}
	// Add scale control
	addControlWithLayers() {
		L.control.layers(this.baseMaps).addTo(this.map);

		L.control.scale({ imperial: false, metric: true }).addTo(this.map);
	}

	showLatLong() {
		// Listen to mousemove event to update coordinates
		this.map.on('mousemove', (e: L.LeafletMouseEvent) => {
			this.latitude = e.latlng.lat;
			this.longitude = e.latlng.lng;
		});
	}

	toggleLayer() {
		if (this.isSatelliteView) {
			this.map.removeLayer(this.satelliteLayer);
			this.map.addLayer(this.mapLayer);
		} else {
			this.map.removeLayer(this.mapLayer);
			this.map.addLayer(this.satelliteLayer);
		}
		this.isSatelliteView = !this.isSatelliteView;
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
				circlemarker: false
			},
			edit: {
				featureGroup: drawnItems
			}
		});

		this.map.addControl(drawControl);

		this.map.on('draw:created', (event: any) => {
			const layer = event.layer;
			drawnItems.addLayer(layer);

			// Check geometry type and get coordinates appropriately
			if (layer instanceof L.Marker) {
				console.log('Marker position:', layer.getLatLng());
			} else if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
				console.log('Line/Polygon coordinates:', layer.getLatLngs());
			} else {
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

	ngOnDestroy(): void {
		if (this.map) {
			this.map.remove();
		}
	}
}
