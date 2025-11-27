<script>
	import { appDatabase } from '$lib/db';

	let { docId, onResolved } = $props();

	let conflictInfo = $state(null);
	let loading = $state(true);
	let resolving = $state(false);
	let error = $state(null);

	$effect(() => {
		if (docId) {
			loadConflicts();
		}
	});

	async function loadConflicts() {
		try {
			loading = true;
			error = null;
			conflictInfo = await appDatabase.getConflicts(docId);
		} catch (err) {
			console.error('Error loading conflicts:', err);
			error = 'Failed to load conflict information';
		} finally {
			loading = false;
		}
	}

	async function resolveConflict(keepCurrent) {
		if (resolving) return;
		
		resolving = true;
		error = null;
		
		try {
			await appDatabase.resolveConflict(docId, keepCurrent);
			
			// notify parent that conflict is resolved
			if (onResolved) {
				onResolved();
			}
		} catch (err) {
			console.error('Error resolving conflict:', err);
			error = 'Failed to resolve conflict. Please try again.';
		} finally {
			resolving = false;
		}
	}
</script>

{#if loading}
	<p>Loading conflict information...</p>
{:else if error}
	<div class="error">
		<p>{error}</p>
		<button onclick={loadConflicts}>Retry</button>
	</div>
{:else if conflictInfo && conflictInfo.hasConflicts}
	<article class="conflict-resolver">
		<h3>⚠️ Conflict Detected</h3>
		<p>This document was modified by two different users. Choose which version to keep:</p>

		<div class="versions">
			<!-- current version (Server) -->
			<div class="version-card">
				<h4>Current Version (Server)</h4>
				<p><small>By: {conflictInfo.current.updatedBy || conflictInfo.current.createdBy || 'Unknown'}</small></p>
				<div class="content">
					<p><strong>Title:</strong> {conflictInfo.current.title}</p>
					<p><strong>Description:</strong> {conflictInfo.current.description}</p>
				</div>
				<button
					onclick={() => resolveConflict(true)}
					disabled={resolving}
				>
					Keep This Version
				</button>
			</div>

			<!-- conflicting version (Local) -->
			<div class="version-card">
				<h4>Your Version (Local)</h4>
				<p><small>By: {conflictInfo.conflict.updatedBy || conflictInfo.conflict.createdBy || 'You'}</small></p>
				<div class="content">
					<p><strong>Title:</strong> {conflictInfo.conflict.title}</p>
					<p><strong>Description:</strong> {conflictInfo.conflict.description}</p>
				</div>
				<button
					onclick={() => resolveConflict(false)}
					disabled={resolving}
				>
					Keep This Version
				</button>
			</div>
		</div>

		{#if error}
			<div class="error-message">{error}</div>
		{/if}

		{#if resolving}
			<p>Resolving conflict...</p>
		{/if}
	</article>
{:else}
	<p>✅ No conflicts detected</p>
{/if}

<style>
	.conflict-resolver {
		border: 2px solid #ffc107;
		border-radius: 8px;
		padding: 1.5rem;
		background: #fffbf0;
		margin: 1rem 0;
	}

	.versions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin: 1.5rem 0;
	}

	.version-card {
		border: 1px solid #dee2e6;
		border-radius: 8px;
		padding: 1rem;
		background: white;
	}

	.version-card h4 {
		margin-top: 0;
	}

	.content {
		margin: 1rem 0;
		padding: 0.75rem;
		background: #f8f9fa;
		border-radius: 4px;
	}

	.error-message {
		margin-top: 1rem;
		padding: 0.75rem;
		background: #f8d7da;
		color: #721c24;
		border-radius: 4px;
	}

	@media (max-width: 768px) {
		.versions {
			grid-template-columns: 1fr;
		}
	}
</style>
