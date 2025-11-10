<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	import 'leaflet/dist/leaflet.css';

	import iconUrl from 'leaflet/dist/images/marker-icon.png?url';
	import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png?url';
	import shadowUrl from 'leaflet/dist/images/marker-shadow.png?url';

	export let coordinates = null;
 export let onLocationSelected = undefined;
 export let readonly = false;

	let mapContainer;
	let map;
	let marker;
	let isGettingLocation = false;
	let locationError = null;

	let Leaflet;

	onMount(async () => {
		if (!browser || !mapContainer) return;
		await initMap();
	});

	async function initMap() {
		if (!Leaflet) {
			Leaflet = await import('leaflet');
		}
		const L = Leaflet.default;

		delete L.Icon.Default.prototype._getIconUrl;
		L.Icon.Default.mergeOptions({
			iconUrl,
			iconRetinaUrl,
			shadowUrl
		});

		const center = [coordinates?.lat ?? 51.3397, coordinates?.lng ?? 12.3731];
		map = L.map(mapContainer).setView(center, 13);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© OpenStreetMap contributors',
			maxZoom: 19
		}).addTo(map);

		if (coordinates?.lat && coordinates?.lng) {
			marker = L.marker([coordinates.lat, coordinates.lng]).addTo(map);
			map.setView([coordinates.lat, coordinates.lng], 15);
		}

		// allow clicking to change location if not readonly
		if (!readonly) {
			map.on('click', (e) => {
				const newCoords = { lat: e.latlng.lat, lng: e.latlng.lng };
				coordinates = newCoords;
				onLocationSelected?.(newCoords);

				if (marker) marker.setLatLng([newCoords.lat, newCoords.lng]);
				else marker = L.marker([newCoords.lat, newCoords.lng]).addTo(map);
			});
		}
	}

	function getCurrentLocation() {
		if (!browser || !navigator.geolocation) {
			locationError = 'Geolocation is not supported by your browser';
			return;
		}
		isGettingLocation = true;
		locationError = null;

		navigator.geolocation.getCurrentPosition(
			(pos) => {
				const newCoords = {
					lat: pos.coords.latitude,
					lng: pos.coords.longitude
				};
				coordinates = newCoords;
				dispatch('location-selected', newCoords);

				if (map) {
					map.setView([newCoords.lat, newCoords.lng], 15);
					if (marker) marker.setLatLng([newCoords.lat, newCoords.lng]);
					else {
						Leaflet.default.marker([newCoords.lat, newCoords.lng]).addTo(map);
					}
				}
				isGettingLocation = false;
			},
			(err) => {
				locationError = `Unable to get location: ${err.message}`;
				isGettingLocation = false;
			},
			{ enableHighAccuracy: true, timeout: 10000 }
		);
	}

	function clearLocation() {
		coordinates = null;
		if (marker && map) {
			map.removeLayer(marker);
			marker = null;
		}
		onLocationSelected?.(null);
	}
</script>

<div class="location-picker">
	{#if !readonly}
		<div class="location-controls">
			<button type="button" onclick={getCurrentLocation} disabled={isGettingLocation}>
				{isGettingLocation ? '📍 Getting location...' : '📍 Use Current Location'}
			</button>

			{#if coordinates}
				<button type="button" onclick={clearLocation} class="secondary">Clear Location</button>
				<span class="coordinates">
					{coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
				</span>
			{/if}
		</div>

		{#if locationError}
			<div class="error">{locationError}</div>
		{/if}
	{:else if coordinates}
		<div class="location-controls">
			<span class="coordinates">
				{coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
			</span>
		</div>
	{/if}

	<div class="map-container" bind:this={mapContainer}></div>
</div>

<style>
	.location-picker {
		margin: 1rem 0;
	}
	.location-controls {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-bottom: 0.5rem;
		flex-wrap: wrap;
	}
	.coordinates {
		font-size: 0.9rem;
		color: #666;
		font-family: monospace;
		padding: 0.25rem 0.5rem;
		background: #f8f9fa;
		border-radius: 4px;
	}
	.map-container {
		width: 100%;
		height: 320px;
		border: 2px solid #e9ecef;
		border-radius: 8px;
		overflow: hidden;
		background: #f0f0f0;
	}
	.error {
		color: #dc3545;
		font-size: 0.9rem;
		margin-bottom: 0.5rem;
		padding: 0.5rem;
		background: #f8d7da;
		border-radius: 4px;
	}
	button {
		cursor: pointer;
	}

	:global(.leaflet-control-zoom-in),
	:global(.leaflet-control-zoom-out) {
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		line-height: 1;
		font-size: 18px;
		font-weight: bold;
		width: 30px;
		height: 30px;
		padding: 0;
		margin: 0;
	}

	:global(.leaflet-control-zoom-in),
	:global(.leaflet-control-zoom-out) {
		text-decoration: none;
		color: #333;
	}

	:global(.leaflet-control-zoom-in:hover),
	:global(.leaflet-control-zoom-out:hover) {
		text-decoration: none;
		color: #000;
	}
</style>
