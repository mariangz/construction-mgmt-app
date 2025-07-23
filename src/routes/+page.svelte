<script>
	// import the database functions
	import { appDatabase } from '$lib/db';
	import { onMount } from 'svelte';

	let syncState = '';
	let syncMessage = '';
	let couchdbSettings = null;
	let isConfigured = false;
	let unsyncedCounts = { tasks: 0, reports: 0 };
	let loadingCounts = true;

	// load settings when the app starts
	onMount(() => {
		loadSettings();
		loadUnsyncedCounts();
	});

	// load CouchDB settings from browser's localStorage (if they exist)
	function loadSettings() {
		const stored = localStorage.getItem('couchdb-settings');
		if (stored) {
			try {
				// parse the JSON settings from localStorage
				couchdbSettings = JSON.parse(stored);
				// check if we have the required fields
				isConfigured = !!(couchdbSettings.username && couchdbSettings.password);
			} catch (e) {
				console.error('Error loading settings:', e);
				isConfigured = false;
			}
		}
	}

	// load unsynced counts
	async function loadUnsyncedCounts() {
		try {
			loadingCounts = true;
			unsyncedCounts = await appDatabase.getUnsyncedCounts();
			console.log('unsyncedCounts', unsyncedCounts);
		} catch (error) {
			console.error('Error loading unsynced counts:', error);
			unsyncedCounts = { tasks: 0, reports: 0 };
		} finally {
			loadingCounts = false;
		}
	}

	async function syncWithCouchDB() {
		// prevent sync if CouchDB isn't configured but also the button is not shown
		if (!isConfigured) {
			syncMessage = 'Please configure CouchDB settings first';
			syncState = 'error';
			setTimeout(() => {
				syncState = '';
				syncMessage = '';
			}, 3000);
			return;
		}

		try {
			// update UI to show sync is starting
			syncState = 'syncing';
			syncMessage = 'Syncing with CouchDB...';
			// build the full database URL
			const { username, password, serverUrl } = couchdbSettings;
			const url = new URL(`${serverUrl}/construction-app`);
			// add credentials to the URL
			url.username = username.trim();
			url.password = password.trim();
			// get the full URL with credentials
			const dbUrl = url.href;
			await appDatabase.syncOnce(dbUrl);

			console.log('Sync completed');
			syncState = 'success';
			syncMessage = 'Sync completed successfully!';

			// reload counts after successful sync
			loadUnsyncedCounts();

		} catch (error) {
			console.error('Error syncing with CouchDB:', error);
			syncState = 'error';
			syncMessage = 'Sync failed. Check your connection and settings.';
		} finally {
			// always hide the message after 3 seconds
			setTimeout(() => {
				syncState = '';
				syncMessage = '';
			}, 3000);
		}
	}
</script>

<main class="container">
	<!-- app header with title and description -->
	<header class="app-header">
		<div class="title-section">
			<h1 class="app-title">
				Field App
				<span class="crane-icon">🏗️</span>
			</h1>
			<p class="app-subtitle">Capture tasks and reports from the field — even offline.</p>
		</div>
	</header>

	<!-- show different content based on whether CouchDB is configured or not -->
	<div class="settings-status">
		{#if isConfigured}
			<!-- couchDB is configured - show current user -->
			<p>✅ CouchDB configured: <strong>{couchdbSettings.username}</strong></p>
		{:else}
			<!-- couchDB not configured -->
			<p>⚙️ <a href="/settings">Configure CouchDB settings</a> to enable sync</p>
		{/if}
		<!-- action button for settings management -->
		<div class="settings-buttons">
			<a href="/settings" role="button" class="outline">Settings</a>
		</div>
	</div>

	<!-- links to main sections -->
	<nav class="main-nav">
		<a href="/tasks" class="nav-button">
			<span class="icon">📋</span>
			View Tasks
		</a>

		<a href="/reports" class="nav-button">
			<span class="icon">📊</span>
			View Reports
		</a>

		<a href="/tasks/new" class="nav-button add-button">
			<span class="icon">➕</span>
			Add Task
		</a>

		<a href="/reports/new" class="nav-button add-button">
			<span class="icon">📝</span>
			Add Report
		</a>
	</nav>

	<!-- sync section (only shown if configured) -->
	{#if isConfigured}
		<div class="sync-section">
			<!-- sync button - changes based on current sync state -->
			<button
				class="sync-button {syncState}"
				onclick={syncWithCouchDB}
				disabled={syncState === 'syncing'}
			>
				{#if syncState === 'syncing'}
					<span>⟳</span>
					Syncing...
				{:else if syncState === 'success'}
					<span class="sync-icon">✅</span>
					Synced!
				{:else if syncState === 'error'}
					<span class="sync-icon">❌</span>
					Retry Sync
				{:else}
					<!-- default state -->
					<span class="sync-icon">🔄</span>
					Sync Now
				{/if}
			</button>

			<!-- show sync status message if there is one -->
			{#if syncMessage}
				<p class="sync-message {syncState}">{syncMessage}</p>
			{/if}
		</div>
	{/if}

	<!-- unsynced items -->
	{#if loadingCounts}
		<div class="unsynced-items">
			<h2>📊 Sync Status</h2>
			<p>Loading unsynced items...</p>
		</div>
	{:else}
		<div class="unsynced-items">
			<h2>📊 Sync Status</h2>
			{#if unsyncedCounts.tasks === 0 && unsyncedCounts.reports === 0}
				<p class="all-synced">✅ All items are synced</p>
			{:else}
				<div class="unsynced-counts">
					<div class="count-item">
						<span class="count-number">{unsyncedCounts.tasks}</span>
						<span class="count-label">Unsynced Tasks</span>
					</div>
					<div class="count-item">
						<span class="count-number">{unsyncedCounts.reports}</span>
						<span class="count-label">Unsynced Reports</span>
					</div>
				</div>
				{#if isConfigured}
					<p class="sync-hint">💡 Use the sync button above to sync these items</p>
				{:else}
					<p class="sync-hint">⚠️ Configure CouchDB settings to enable sync</p>
				{/if}
			{/if}
		</div>
	{/if}
</main>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 1rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.app-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.app-title {
		font-size: 3rem;
		font-weight: 700;
		color: #1a1a1a;
		margin: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	.crane-icon {
		font-size: 2.5rem;
	}

	.app-subtitle {
		font-size: 1.2rem;
		color: #666;
		margin: 1rem 0 0 0;
		line-height: 1.5;
	}

	.settings-status {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.settings-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.main-nav {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 3rem;
	}

	.nav-button {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem 1.5rem;
		background: #f8f9fa;
		border: 2px solid #e9ecef;
		border-radius: 12px;
		text-decoration: none;
		color: #495057;
		font-size: 1.1rem;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.nav-button:hover {
		background: #e9ecef;
		border-color: #dee2e6;
		transform: translateY(-1px);
	}

	.add-button {
		background: #007bff;
		color: white;
		border-color: #007bff;
	}

	.add-button:hover {
		background: #0056b3;
		border-color: #0056b3;
	}

	.icon {
		font-size: 1.2rem;
	}

	.sync-section {
		background: #f8f9fa;
		border: 2px solid #e9ecef;
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
		text-align: center;
	}

	.sync-button {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 2rem;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 10px;
		font-size: 1.1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
		min-width: 160px;
		justify-content: center;
	}

	.sync-button:disabled {
		cursor: not-allowed;
		opacity: 0.7;
	}

	.sync-button.syncing {
		background: #ffc107;
		color: #856404;
	}

	.sync-button.success {
		background: #28a745;
		color: white;
	}

	.sync-button.error {
		background: #dc3545;
		color: white;
	}

	.sync-icon {
		font-size: 1.2rem;
	}

	.sync-message {
		margin: 1rem 0 0 0;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		font-weight: 500;
	}

	.sync-message.syncing {
		background: #fff3cd;
		color: #856404;
		border: 1px solid #ffeaa7;
	}

	.sync-message.success {
		background: #d4edda;
		color: #155724;
		border: 1px solid #c3e6cb;
	}

	.sync-message.error {
		background: #f8d7da;
		color: #721c24;
		border: 1px solid #f5c6cb;
	}

	.unsynced-items {
		background: #f8f9fa;
		border: 2px solid #efeae9;
		border-radius: 12px;
		padding: 2rem;
		margin-top: 2rem;
		text-align: center;
	}

	.unsynced-items h2 {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.unsynced-items p {
		font-size: 1.1rem;
		color: #666;
		margin: 0.5rem 0;
	}

	.all-synced {
		color: #28a745;
		font-weight: 600;
	}

	.unsynced-counts {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-bottom: 1rem;
	}

	.count-item {
		text-align: center;
	}

	.count-number {
		font-size: 2.5rem;
		font-weight: 700;
		color: #007bff;
		display: block;
	}

	.count-label {
		font-size: 0.9rem;
		color: #666;
		margin-top: 0.5rem;
	}

	.sync-hint {
		font-size: 0.9rem;
		color: #666;
		margin-top: 0.5rem;
	}

	@media (max-width: 600px) {
		.container {
			padding: 1rem;
		}

		.app-title {
			font-size: 2.5rem;
		}

		.settings-status {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}

		.settings-buttons {
			flex-direction: column;
		}

		.sync-section {
			padding: 1.5rem;
		}

		.sync-button {
			width: 100%;
			padding: 1.25rem 1rem;
		}

		.unsynced-counts {
			flex-direction: column;
			gap: 1rem;
		}
	}
</style>
