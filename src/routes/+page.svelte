<script>
	import { taskDatabase } from '$lib/db';
	import { onMount } from 'svelte';

	let syncState = '';
	let syncMessage = '';
	let couchdbSettings = null;
	let isConfigured = false;

	onMount(() => {
		loadSettings();
	});

	function loadSettings() {
		const stored = localStorage.getItem('couchdb-settings');
		if (stored) {
			try {
				couchdbSettings = JSON.parse(stored);
				isConfigured = !!(couchdbSettings.username && couchdbSettings.password);
			} catch (e) {
				console.error('Error loading settings:', e);
				isConfigured = false;
			}
		}
	}

	async function syncWithCouchDB() {
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
			syncState = 'syncing';
			syncMessage = 'Syncing with CouchDB...';

			const { username, password, serverUrl } = couchdbSettings;
			const url = new URL(`${serverUrl}/construction-app`);

			url.username = username.trim();
			url.password = password.trim();

			const dbUrl = url.href;
			await taskDatabase.liveSync(dbUrl);

			console.log('Sync completed');
			syncState = 'success';
			syncMessage = 'Sync completed successfully!';
		} catch (error) {
			console.error('Error syncing with CouchDB:', error);
			syncState = 'error';
			syncMessage = 'Sync failed. Check your connection and settings.';
		} finally {
			setTimeout(() => {
				syncState = '';
				syncMessage = '';
			}, 3000);
		}
	}
</script>

<main class="container">
	<header class="app-header">
		<div class="title-section">
			<h1 class="app-title">
				Field App
				<span class="crane-icon">🏗️</span>
			</h1>
			<p class="app-subtitle">Capture tasks and reports from the field — even offline.</p>
		</div>
	</header>

	<!-- settings status and settings button -->
	<div class="settings-status">
		{#if isConfigured}
			<p>✅ CouchDB configured: <strong>{couchdbSettings.username}</strong></p>
		{:else}
			<p>⚙️ <a href="/settings">Configure CouchDB settings</a> to enable sync</p>
		{/if}
		<div class="settings-buttons">
			<a href="/settings" role="button" class="outline">Settings</a>
		</div>
	</div>

	<nav class="main-nav">
		<a href="/tasks" class="nav-button">
			<span class="icon">📋</span>
			View Tasks
		</a>

		<a href="/reports" class="nav-button">
			<span class="icon">📊</span>
			View Reports
		</a>

		<a href="/new" class="nav-button add-button">
			<span class="icon">➕</span>
			Add Task
		</a>

		<a href="/reports/new" class="nav-button add-button">
			<span class="icon">📝</span>
			Add Report
		</a>
	</nav>

	<!-- sync section -->
	{#if isConfigured}
		<div class="sync-section">
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
					<span class="sync-icon">🔄</span>
					Sync Now
				{/if}
			</button>

			{#if syncMessage}
				<p class="sync-message {syncState}">{syncMessage}</p>
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
	}
</style>
