import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ViewController } from '../controller/view.controller';
import * as L from 'leaflet';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

@Component({
	selector: 'app-view',
	templateUrl: './view.component.html',
	styleUrls: ['./view.component.scss']
})
export class ViewComponent implements OnInit {

	private map!: L.Map;
	private mapLayer!: L.TileLayer;
	private satelliteLayer!: L.TileLayer;
	private marker!: L.Marker;
	baseMaps: any;

	isSatelliteView = false;
	latitude: number = 0;
	longitude: number = 0;

	showLogs: boolean = false;
	detectedObjectList: any[] = [];

	@ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

	constructor(private viewController: ViewController,
	) { }

	ngOnInit(): void {
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
		this.addPopup(this.marker);

		//5. add layer controls
		this.addControlWithLayers();

		//6. add event listeners
		this.showLatLong();
	}

	showLatLong() {
		// Listen to mousemove event to update coordinates
		this.map.on('mousemove', (e: L.LeafletMouseEvent) => {
			this.latitude = e.latlng.lat;
			this.longitude = e.latlng.lng;
		});
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
			attribution: 'Offline Tiles'
		});
	}

	satelliteLayerFn() {
		this.satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
			maxZoom: 19,
			minZoom: 3,
			attribution: 'Tiles © Esri'
		});
	}

	// Add marker with popup
	addPopup(marker: L.Marker): L.Marker {
		marker = L.marker([27.188984, 78.02575360]).addTo(this.map);
		return marker.bindPopup('<b>Delhi</b><br>Red fort').openPopup();
	}

	// Add scale control
	addControlWithLayers() {
		L.control.layers(this.baseMaps).addTo(this.map);

		L.control.scale({ imperial: false, metric: true }).addTo(this.map);
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


	showLogsFn() {
		this.getDetectedObjectList();
		this.showLogs = !this.showLogs;

	}

	getDetectedObjectList(): void {
		this.viewController.getDetectedObjectList().subscribe({
			next: (res) => {
				this.detectedObjectList = res;
			},
			error: (err) => {
				console.error('Error in getDetectedObjectList:', err);
			}
		});
	}


	ngOnDestroy(): void {
		if (this.map) {
			this.map.remove();
		}
	}
}
