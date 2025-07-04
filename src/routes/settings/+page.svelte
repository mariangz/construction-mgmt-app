<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let username = '';
	let password = '';
	let serverUrl = 'http://localhost:5984';
	let message = '';
	let messageType = '';
	let isSaving = false;

	onMount(() => {
		// load existing settings from local storage
		const stored = localStorage.getItem('couchdb-settings');
		if (stored) {
			try {
				const settings = JSON.parse(stored);
				username = settings.username || '';
				password = settings.password || '';
				serverUrl = settings.serverUrl || 'http://localhost:5984';
			} catch (e) {
				console.error('Error loading settings:', e);
			}
		}
	});

	async function saveSettings(event) {
		event.preventDefault();

		if (!username || !password) {
			showMessage('Please enter both username and password', 'error');
			return;
		}

		isSaving = true;

		try {
			// save settings directly to local storage
			const settings = {
				username: username.trim(),
				password: password.trim(),
				serverUrl: serverUrl.trim()
			};

			// check if the username and password are valid
			const response = await fetch(`${serverUrl}/_session`, {
			method: 'GET',
			headers: {
				'Authorization': 'Basic ' + btoa(username + ':' + password)
			}
		});

		// if the response is not ok, show an error message
		if (!response.ok) {
			showMessage('❌ Invalid username or password', 'error');
			return;
		}

			// if the response is ok, save the settings
			localStorage.setItem('couchdb-settings', JSON.stringify(settings));
			showMessage('✅ Settings saved successfully!', 'success');

			// redirect after short delay
			setTimeout(() => {
				goto('/');
			}, 1000);

		} catch (error) {
			showMessage('❌ Failed to save settings', 'error');
		} finally {
			isSaving = false;
		}
	}

	function showMessage(text, type) {
		message = text;
		messageType = type;
		setTimeout(() => {
			message = '';
			messageType = '';
		}, 4000);
	}

	function clearSettings() {
		if (confirm('Are you sure you want to clear all CouchDB settings? This will disconnect from the server.')) {
			localStorage.removeItem('couchdb-settings');
			username = '';
			password = '';
			serverUrl = 'http://localhost:5984';
			showMessage('Settings cleared - redirecting to home...', 'success');

			// redirect to home after clearing
			setTimeout(() => {
				goto('/');
			}, 1500);
		}
	}
</script>

<main class="container">
	<nav aria-label="breadcrumb">
		<ul>
			<li><a href="/">Home</a></li>
			<li>Settings</li>
		</ul>
	</nav>

	<h1>🏗️ CouchDB Settings</h1>

	<article>
		<header>
			<h2>Database Configuration</h2>
			<p>Configure your CouchDB connection to enable sync functionality.</p>
		</header>

		<form onsubmit={saveSettings}>
			<fieldset>
				<label for="serverUrl">
					CouchDB Server URL
					<input
						type="url"
						id="serverUrl"
						bind:value={serverUrl}
						placeholder="http://localhost:5984"
						required
						disabled={isSaving}
					/>
				</label>

				<div class="grid">
					<label for="username">
						Username *
						<input
							type="text"
							id="username"
							bind:value={username}
							placeholder="admin"
							required
							disabled={isSaving}
						/>
					</label>

					<label for="password">
						Password *
						<input
							type="password"
							id="password"
							bind:value={password}
							placeholder="Enter password"
							required
							disabled={isSaving}
						/>
					</label>
				</div>
			</fieldset>

			{#if message}
				<div class="message {messageType}">
					{message}
				</div>
			{/if}

			<div class="actions">
				<a href="/" role="button" class="secondary">Cancel</a>
				<button type="submit" disabled={isSaving}>
					{isSaving ? 'Saving...' : 'Save Settings'}
				</button>
			</div>
		</form>

		<footer>
			<details>
				<summary>Advanced Options</summary>
				<div class="advanced-options">
					<button onclick={clearSettings} class="contrast">Clear All Settings</button>
					<small>This will remove all stored CouchDB configuration and disconnect from the server.</small>
				</div>
			</details>
		</footer>
	</article>

</main>

<style>
	.message {
		padding: 1rem;
		border-radius: 8px;
		margin: 1rem 0;
		font-weight: 500;
	}

	.message.success {
		background: #d4edda;
		color: #155724;
		border: 1px solid #c3e6cb;
	}

	.message.error {
		background: #f8d7da;
		color: #721c24;
		border: 1px solid #f5c6cb;
	}

	.actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 1.5rem;
	}

	.advanced-options {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #dee2e6;
	}

	.advanced-options button {
		margin-bottom: 0.5rem;
	}

	@media (max-width: 576px) {
		.actions {
			flex-direction: column;
		}
	}
</style>