<script>
	import { page } from '$app/stores';
	import { appDatabase } from '$lib/db';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let report = null;
	let loading = true;
	let error = null;
	let deleting = false;
	let saving = false;
	let editing = false;

	// edit form variables
	let editTitle = '';
	let editDescription = '';
	let editReportType = 'inspection';
	let editLocation = '';
	let editAssignedTo = '';
	let editPriority = 'medium';
	let editStatus = 'draft';
	let editDueDate = '';
	let editMaterials = '';
	let editFindings = '';
	let editRecommendations = '';

	// Map-related variables for edit mode
	let editMapContainer;
	let editMap;
	let editMarker;
	let editCoordinates = { lat: 0, lng: 0 };
	let editMapInitialized = false;

	const statusColors = {
		draft: '#ffc107',
		completed: '#28a745',
		submitted: '#007bff'
	};

	const priorityColors = {
		low: '#28a745',
		medium: '#ffc107',
		high: '#fd7e14',
		urgent: '#dc3545'
	};

	const reportTypes = [
		{ value: 'inspection', label: 'Inspection Report' },
		{ value: 'progress', label: 'Progress Report' },
		{ value: 'safety', label: 'Safety Report' },
		{ value: 'quality', label: 'Quality Control Report' },
		{ value: 'incident', label: 'Incident Report' },
		{ value: 'material', label: 'Material Report' },
		{ value: 'weather', label: 'Weather Delay Report' }
	];

	const priorities = [
		{ value: 'low', label: 'Low' },
		{ value: 'medium', label: 'Medium' },
		{ value: 'high', label: 'High' },
		{ value: 'urgent', label: 'Urgent' }
	];

	const statuses = [
		{ value: 'draft', label: 'Draft' },
		{ value: 'completed', label: 'Completed' },
		{ value: 'submitted', label: 'Submitted' }
	];

	// get the report id from the url
	$: reportId = $page.params.id;
	$: if (reportId) {
		console.log('reportId', reportId);
		loadReport(reportId);
	}

	onMount(() => {
		// Load Leaflet CSS and JS from CDN
		loadLeaflet();
		
		// Initialize view map when report is loaded
		$: if (report && report.coordinates && typeof L !== 'undefined') {
			initializeViewMap();
		}
	});

	async function loadReport(id) {
		try {
			loading = true;
			error = null;
			report = await appDatabase.getDocument(id);
			console.log('Report loaded with attachments:', report._attachments);
			// initialize edit form with current values
			if (report) {
				editTitle = report.title || '';
				editDescription = report.description || '';
				editReportType = report.reportType || 'inspection';
				editLocation = report.location || '';
				editAssignedTo = report.assignedTo || '';
				editPriority = report.priority || 'medium';
				editStatus = report.status || 'draft';
				editDueDate = report.dueDate || '';
				editMaterials = report.materials || '';
				editFindings = report.findings || '';
				editRecommendations = report.recommendations || '';
				
				// Initialize coordinates for edit mode
				if (report.coordinates) {
					editCoordinates = report.coordinates;
				}
			}
		} catch (err) {
			error = 'Report not found or failed to load.';
			console.error('Error loading report:', err);
		} finally {
			loading = false;
		}
	}

	async function downloadAttachment(name) {
		try {
			const blob = await appDatabase.getAttachment(reportId, name);
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = name;
			a.click();
		} catch (err) {
			alert('Failed to download attachment.');
			console.error('Download error:', err);
		}
	}

	async function deleteReport() {
		if (!confirm('Are you sure you want to delete this report?')) {
			return;
		}

		try {
			deleting = true;
			await appDatabase.deleteDocument(reportId);
			goto('/reports');
		} catch (err) {
			alert('Failed to delete report. Please try again.');
			console.error('Error deleting report:', err);
		} finally {
			deleting = false;
		}
	}

	function startEdit() {
		editing = true;
		// Initialize map when editing starts
		setTimeout(() => {
			if (typeof L !== 'undefined') {
				initializeEditMap();
			}
		}, 100);
	}

	function cancelEdit() {
		editing = false;
		// reset form to original values
		if (report) {
			editTitle = report.title || '';
			editDescription = report.description || '';
			editReportType = report.reportType || 'inspection';
			editLocation = report.location || '';
			editAssignedTo = report.assignedTo || '';
			editPriority = report.priority || 'medium';
			editStatus = report.status || 'draft';
			editDueDate = report.dueDate || '';
			editMaterials = report.materials || '';
			editFindings = report.findings || '';
			editRecommendations = report.recommendations || '';
		}
	}

	async function saveEdit(event) {
		event.preventDefault();
		if (!editTitle.trim() || !editDescription.trim() || !editLocation.trim()) {
			alert('Please fill in all required fields (Title, Description, Location).');
			return;
		}

		try {
			saving = true;

			// update the report object with new values
			const updatedReport = {
				...report,
				title: editTitle.trim(),
				description: editDescription.trim(),
				reportType: editReportType,
				location: editLocation.trim(),
				coordinates: editCoordinates, // Add coordinates to the updated report
				assignedTo: editAssignedTo.trim() || null,
				priority: editPriority,
				status: editStatus,
				dueDate: editDueDate || null,
				materials: editMaterials.trim() || null,
				findings: editFindings.trim() || null,
				recommendations: editRecommendations.trim() || null
			};

			await appDatabase.updateDocument(updatedReport);

			// update the report with the new values for the view
			report = updatedReport;
			editing = false;

			console.log('Report updated successfully');
		} catch (err) {
			alert('Failed to update report. Please try again.');
			console.error('Error updating report:', err);
		} finally {
			saving = false;
		}
	}

	function formatDate(dateString) {
		if (!dateString) return 'Not set';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatDateTime(dateString) {
		if (!dateString) return 'Not set';
		return new Date(dateString).toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	async function loadLeaflet() {
		// Load Leaflet CSS
		if (!document.querySelector('link[href*="leaflet"]')) {
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
			link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
			link.crossOrigin = '';
			document.head.appendChild(link);
		}

		// Load Leaflet JS
		if (typeof L === 'undefined') {
			const script = document.createElement('script');
			script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
			script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
			script.crossOrigin = '';
			script.onload = () => {
				if (editing) {
					initializeEditMap();
				}
			};
			document.head.appendChild(script);
		}
	}

	function initializeEditMap() {
		if (editMapInitialized || !editMapContainer) return;
		
		try {
			// Use report coordinates or default location
			const lat = editCoordinates.lat || 40.7128;
			const lng = editCoordinates.lng || -74.0060;
			
			// Initialize the map
			editMap = L.map(editMapContainer).setView([lat, lng], 13);
			
			// Add OpenStreetMap tiles
			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			}).addTo(editMap);

			// Add click event to set marker
			editMap.on('click', function(e) {
				setEditMarker(e.latlng.lat, e.latlng.lng);
			});

			// Add marker if coordinates exist
			if (editCoordinates.lat && editCoordinates.lng) {
				setEditMarker(editCoordinates.lat, editCoordinates.lng);
			}

			editMapInitialized = true;
		} catch (error) {
			console.error('Error initializing edit map:', error);
		}
	}

	function setEditMarker(lat, lng) {
		editCoordinates = { lat, lng };
		
		// Remove existing marker
		if (editMarker) {
			editMap.removeLayer(editMarker);
		}
		
		// Add new marker
		editMarker = L.marker([lat, lng]).addTo(editMap);
		
		// Update location text field with coordinates
		editLocation = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
		
		// Add popup with coordinates
		editMarker.bindPopup(`Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`).openPopup();
	}

	function getEditAddressFromCoordinates() {
		if (editCoordinates.lat === 0 && editCoordinates.lng === 0) return;
		
		// Use reverse geocoding to get address
		fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${editCoordinates.lat}&lon=${editCoordinates.lng}&zoom=18&addressdetails=1`)
			.then(response => response.json())
			.then(data => {
				if (data.display_name) {
					editLocation = data.display_name;
				}
			})
			.catch(error => {
				console.error('Error getting address:', error);
			});
	}

	function initializeViewMap() {
		if (!report || !report.coordinates) return;
		
		try {
			const viewMapElement = document.getElementById('viewMap');
			if (!viewMapElement) return;
			
			const lat = report.coordinates.lat;
			const lng = report.coordinates.lng;
			
			// Initialize the view map
			const viewMap = L.map(viewMapElement).setView([lat, lng], 15);
			
			// Add OpenStreetMap tiles
			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			}).addTo(viewMap);

			// Add marker for the report location
			L.marker([lat, lng]).addTo(viewMap)
				.bindPopup(`Report Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
				.openPopup();
		} catch (error) {
			console.error('Error initializing view map:', error);
		}
	}
</script>

<!-- tab title -->
<svelte:head>
	<title>{report ? `${report.title} - Report` : 'Loading...'} - Field App</title>
</svelte:head>

<main class="container">
	<nav aria-label="breadcrumb">
		<ul>
			<li><a href="/">Home</a></li>
			<li><a href="/reports">Reports</a></li>
			<li>{loading ? 'Loading...' : (report ? report.title : 'Not Found')}</li>
		</ul>
	</nav>

	{#if loading}
		<article aria-busy="true">Loading report...</article>
	{:else if error}
		<article>
			<h2>❌ Error</h2>
			<p>{error}</p>
			<a href="/reports" role="button">← Back to Reports</a>
		</article>
	{:else if report}
		{#if editing}
			<!-- edit mode -->
			<header class="page-header">
				<h1>Edit Report</h1>
			</header>

			<form onsubmit={saveEdit} class="report-form">
				<div class="form-section">
					<h2>Basic Information</h2>

					<div class="form-group">
						<label for="editTitle">Report Title *</label>
						<input
							id="editTitle"
							type="text"
							bind:value={editTitle}
							placeholder="Enter report title..."
							required
							disabled={saving}
						/>
					</div>

					<div class="form-group">
						<label for="editReportType">Report Type</label>
						<select id="editReportType" bind:value={editReportType} disabled={saving}>
							{#each reportTypes as type}
								<option value={type.value}>{type.label}</option>
							{/each}
						</select>
					</div>

					<div class="form-group">
						<label for="editLocation">Location *</label>
						<div class="location-container">
							<input
								id="editLocation"
								type="text"
								bind:value={editLocation}
								placeholder="Click on the map to set location or enter manually..."
								required
								disabled={saving}
							/>
							<button 
								type="button" 
								class="get-address-btn" 
								onclick={getEditAddressFromCoordinates}
								disabled={saving || (editCoordinates.lat === 0 && editCoordinates.lng === 0)}
							>
								📍 Get Address
							</button>
						</div>
						
						<div class="map-container">
							<div class="map-instructions">
								<p>🗺️ Click on the map below to set the exact location for your report</p>
							</div>
							<div bind:this={editMapContainer} class="map" id="editMap"></div>
							<div class="coordinates-display">
								<strong>Coordinates:</strong> {editCoordinates.lat.toFixed(6)}, {editCoordinates.lng.toFixed(6)}
							</div>
						</div>
					</div>

					<div class="form-group">
						<label for="editDescription">Description *</label>
						<textarea
							id="editDescription"
							bind:value={editDescription}
							placeholder="Provide a detailed description of the report..."
							rows="4"
							required
							disabled={saving}
						></textarea>
					</div>
				</div>

				<div class="form-section">
					<h2>Assignment & Priority</h2>

					<div class="form-row">
						<div class="form-group">
							<label for="editAssignedTo">Assigned To</label>
							<input
								id="editAssignedTo"
								type="text"
								bind:value={editAssignedTo}
								placeholder="Enter name or leave blank"
								disabled={saving}
							/>
						</div>

						<div class="form-group">
							<label for="editPriority">Priority</label>
							<select id="editPriority" bind:value={editPriority} disabled={saving}>
								{#each priorities as priorityOption}
									<option value={priorityOption.value}>{priorityOption.label}</option>
								{/each}
							</select>
						</div>
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="editStatus">Status</label>
							<select id="editStatus" bind:value={editStatus} disabled={saving}>
								{#each statuses as statusOption}
									<option value={statusOption.value}>{statusOption.label}</option>
								{/each}
							</select>
						</div>

						<div class="form-group">
							<label for="editDueDate">Due Date</label>
							<input id="editDueDate" type="date" bind:value={editDueDate} disabled={saving} />
						</div>
					</div>
				</div>

				<div class="form-section">
					<h2>Additional Details</h2>

					<div class="form-group">
						<label for="editMaterials">Materials/Equipment</label>
						<textarea
							id="editMaterials"
							bind:value={editMaterials}
							placeholder="List materials, equipment, or resources involved..."
							rows="3"
							disabled={saving}
						></textarea>
					</div>

					<div class="form-group">
						<label for="editFindings">Findings/Observations</label>
						<textarea
							id="editFindings"
							bind:value={editFindings}
							placeholder="Document key findings, observations, or issues..."
							rows="4"
							disabled={saving}
						></textarea>
					</div>

					<div class="form-group">
						<label for="editRecommendations">Recommendations/Actions</label>
						<textarea
							id="editRecommendations"
							bind:value={editRecommendations}
							placeholder="Provide recommendations or required actions..."
							rows="3"
							disabled={saving}
						></textarea>
					</div>
				</div>

				<div class="form-actions">
					<button type="button" class="secondary" onclick={cancelEdit} disabled={saving}>
						Cancel
					</button>
					<button type="submit" disabled={saving}>
						{saving ? 'Saving...' : 'Save Changes'}
					</button>
				</div>
			</form>
		{:else}
			<!-- view mode -->
			<article class="report-header">
				<header>
					<div class="title-section">
						<h1>{report.title}</h1>
						<div class="badges">
							<span class="status-badge" style="background-color: {statusColors[report.status] || '#6c757d'}">
								{report.status}
							</span>
							<span class="priority-badge" style="background-color: {priorityColors[report.priority] || '#6c757d'}">
								{report.priority} priority
							</span>
							<span class="sync-status">
								{report.synced ? '✅ Synced' : '⏳ Pending'}
							</span>
						</div>
					</div>
				</header>

				<div class="report-meta">
					<div class="meta-grid">
						<div class="meta-item">
							<strong>Report Type:</strong>
							<span>{report.reportType}</span>
						</div>
						<div class="meta-item">
							<strong>Location:</strong>
							<span>{report.location}</span>
						</div>
						<div class="meta-item">
							<strong>Assigned To:</strong>
							<span>{report.assignedTo || 'Unassigned'}</span>
						</div>
						<div class="meta-item">
							<strong>Due Date:</strong>
							<span>{formatDate(report.dueDate)}</span>
						</div>
						<div class="meta-item">
							<strong>Created:</strong>
							<span>{formatDateTime(report.createdAt)}</span>
						</div>
						<div class="meta-item">
							<strong>Updated:</strong>
							<span>{formatDateTime(report.updatedAt)}</span>
						</div>
						<div class="meta-item">
							<strong>Created by:</strong>
							<span>{report.createdBy || 'Unknown'}</span>
						</div>
					</div>
				</div>
			</article>

			<article class="report-content">
				<header>
					<h2>📋 Description</h2>
				</header>
				<div class="content-section">
					<p>{report.description}</p>
				</div>
			</article>

			{#if report.coordinates && report.coordinates.lat && report.coordinates.lng}
				<article class="report-content">
					<header>
						<h2>🗺️ Location</h2>
					</header>
					<div class="content-section">
						<div class="location-info">
							<p><strong>Address:</strong> {report.location}</p>
							<p><strong>Coordinates:</strong> {report.coordinates.lat.toFixed(6)}, {report.coordinates.lng.toFixed(6)}</p>
						</div>
						<div class="map-container view-mode">
							<div id="viewMap" class="map"></div>
						</div>
					</div>
				</article>
			{/if}

			{#if report.materials}
				<article class="report-content">
					<header>
						<h2>🧱 Materials</h2>
					</header>
					<div class="content-section">
						<p>{report.materials}</p>
					</div>
				</article>
			{/if}

			{#if report.findings}
				<article class="report-content">
					<header>
						<h2>🔍 Findings</h2>
					</header>
					<div class="content-section">
						<p>{report.findings}</p>
					</div>
				</article>
			{/if}

			{#if report.recommendations}
				<article class="report-content">
					<header>
						<h2>💡 Recommendations</h2>
					</header>
					<div class="content-section">
						<p>{report.recommendations}</p>
					</div>
				</article>
			{/if}

			{#if report._attachments && Object.keys(report._attachments).length > 0}
				<article class="report-content">
					<header>
						<h2>📎 Attachments</h2>
					</header>
					<div class="content-section">
						<ul class="attachment-list">
							{#each Object.keys(report._attachments) as name}
								<li><button class="attachment-link" onclick={() => downloadAttachment(name)}>{name}</button></li>
							{/each}
						</ul>
					</div>
				</article>
			{/if}

			<div class="actions">
				<a href="/reports" role="button" class="secondary">← Back to Reports</a>
				<button onclick={startEdit} class="outline">Edit Report</button>
				<button onclick={deleteReport} class="contrast" disabled={deleting}>
					{deleting ? 'Deleting...' : 'Delete Report'}
				</button>
			</div>
		{/if}
	{/if}
</main>

<style>
	.report-header {
		margin-bottom: 2rem;
	}

	.title-section {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.title-section h1 {
		margin: 0;
		flex: 1;
	}

	.badges {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.status-badge,
	.priority-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.8rem;
		font-weight: 500;
		text-transform: uppercase;
		color: white;
		white-space: nowrap;
	}

	.sync-status {
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.8rem;
		font-weight: 500;
		background-color: #f8f9fa;
		color: #495057;
		border: 1px solid #dee2e6;
		white-space: nowrap;
	}

	.report-meta {
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid #dee2e6;
	}

	.meta-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
	}

	.meta-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.meta-item strong {

		font-size: 0.9rem;
	}

	.report-content {
		margin-bottom: 1.5rem;
	}

	.report-content header h2 {
		margin: 0;
		font-size: 1.25rem;
	}

	.content-section {
		margin-top: 1rem;
		line-height: 1.6;
	}

	.content-section p {
		margin: 0;
		white-space: pre-wrap;
	}

	.attachment-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.attachment-list li {
		padding: 0.5rem 0;
		border-bottom: 1px solid #e9ecef;
	}

	.attachment-link {
		background: none;
		border: none;
		color: #007bff;
		cursor: pointer;
		text-decoration: underline;
		padding: 0;
	}

	.attachment-link:hover {
		color: #0056b3;
	}

	.actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid #dee2e6;
	}

	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.page-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.page-header h1 {
		font-size: 2rem;
	}

	.report-form {
		background: white;
		border: 2px solid #e9ecef;
		border-radius: 12px;
		padding: 2rem;
	}

	.form-section {
		margin-bottom: 2rem;
	}

	.form-section h2 {
		font-size: 1.3rem;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 1.5rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid #e9ecef;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 2px solid #e9ecef;
	}

	@media (max-width: 768px) {
		.title-section {
			flex-direction: column;
			align-items: flex-start;
		}

		.badges {
			align-self: stretch;
		}

		.meta-grid {
			grid-template-columns: 1fr;
		}

		.actions {
			flex-direction: column;
		}

		.form-actions {
			flex-direction: column;
		}

		.form-row {
			grid-template-columns: 1fr;
		}

		.report-form {
			padding: 1.5rem;
		}

		.location-container {
			flex-direction: column;
			align-items: stretch;
		}

		.get-address-btn {
			width: 100%;
		}

		.map {
			height: 250px;
		}
	}

	.location-container {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.get-address-btn {
		background: #007bff;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		white-space: nowrap;
	}

	.get-address-btn:hover:not(:disabled) {
		background: #0056b3;
	}

	.get-address-btn:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}

	.map-container {
		margin-top: 1rem;
		border: 1px solid #e9ecef;
		border-radius: 8px;
		overflow: hidden;
	}

	.map-container.view-mode {
		margin-top: 0.5rem;
	}

	.map-instructions {
		background: #f8f9fa;
		padding: 0.75rem;
		border-bottom: 1px solid #e9ecef;
		text-align: center;
		font-size: 0.9rem;
		color: #6c757d;
	}

	.map {
		height: 300px;
		width: 100%;
		background: #f8f9fa;
	}

	.coordinates-display {
		background: #e9ecef;
		padding: 0.5rem;
		text-align: center;
		font-family: monospace;
		font-size: 0.9rem;
		color: #495057;
		border-top: 1px solid #dee2e6;
	}

	.location-info {
		margin-bottom: 1rem;
	}

	.location-info p {
		margin: 0.5rem 0;
	}
</style>