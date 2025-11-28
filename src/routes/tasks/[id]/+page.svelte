<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { appDatabase } from '$lib/db';
	import LocationPicker from '$lib/components/LocationPicker.svelte';
	import ConflictResolver from '$lib/components/ConflictResolver.svelte';

	let task = $state(null);
	let loading = $state(true);
	let error = $state(null);
	let deleting = $state(false);
	let editing = $state(false);
	let saving = $state(false);
	let hasConflicts = $state(false);
	let showConflictResolver = $state(false);

	// edit form variables
	let editTitle = $state('');
	let editDate = $state('');
	let editDescription = $state('');
	let editAssignedTo = $state('');
	let editStatus = $state('open');
	let editCategory = $state('general');
	let editCoords = $state(null);

	// get available categories
	const categories = appDatabase.getTaskCategories();

	let taskId = $derived($page.params.id);
	$effect(() => {
		if (taskId) {
			console.log('taskId', taskId);
			loadTask(taskId);
		}
	});

	console.log('page', $page);

	async function loadTask(id) {
		try {
			loading = true;
			error = null;
			task = await appDatabase.getDocument(id);
			
			// Check for conflicts
			if (task) {
				const conflictInfo = await appDatabase.getConflicts(id);
				hasConflicts = conflictInfo.hasConflicts;
				// Don't auto-show resolver, show banner first
				showConflictResolver = false;
				
				// initialize edit form with current values
				editTitle = task.title || '';
				editDate = task.date || '';
				editDescription = task.description || '';
				editAssignedTo = task.assignedTo || '';
				editStatus = task.status || 'open';
				editCategory = task.category || 'general';
				editCoords = task.coordinates || null;
			}
		} catch (err) {
			error = 'Task not found or failed to load.';
			console.error('Error loading task:', err);
		} finally {
			loading = false;
		}
	}

	async function deleteDocument() {
		if (!confirm('Are you sure you want to delete this task?')) {
			return;
		}

		try {
			deleting = true;
			await appDatabase.deleteDocument(taskId);
			goto('/tasks');
		} catch (err) {
			alert('Failed to delete task. Please try again.');
			console.error('Error deleting task:', err);
		} finally {
			deleting = false;
		}
	}

	function startEdit() {
		editing = true;
	}

	function cancelEdit() {
		editing = false;
		// reset form to original values
		if (task) {
			editTitle = task.title || '';
			editDate = task.date || '';
			editDescription = task.description || '';
			editAssignedTo = task.assignedTo || '';
			editStatus = task.status || 'open';
			editCategory = task.category || 'general';
			editCoords = task.coordinates || null;
		}
	}

	async function saveEdit(event) {
		event.preventDefault();

		saving = true;
		error = null;

		try {
			// update the task object with new values
			const updatedTask = {
				...task,
				title: editTitle.trim(),
				date: editDate,
				description: editDescription.trim(),
				assignedTo: editAssignedTo.trim() || null,
				status: editStatus,
				category: editCategory,
				coordinates: editCoords
			};

			await appDatabase.updateDocument(updatedTask);

			task = updatedTask;
			editing = false;

			// Reload task to check for conflicts
			await loadTask(taskId);

			console.log('Task updated successfully');
		} catch (err) {
			alert('Failed to update task. Please try again.');
			console.error('Error updating task:', err);
		} finally {
			saving = false;
		}
	}

	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString();
	}

	function formatDateTime(dateString) {
		return new Date(dateString).toLocaleString();
	}

	function getCategoryInfo(categoryValue) {
		return categories.find(cat => cat.value === categoryValue) || { value: 'general', label: 'General', icon: '📋' };
	}

	async function handleConflictResolved() {
		showConflictResolver = false;
		hasConflicts = false;
		// Reload the task after conflict resolution
		await loadTask(taskId);
	}
</script>

<main class="container">
	<nav aria-label="breadcrumb">
		<ul>
			<li><a href="/">Home</a></li>
			<li><a href="/tasks">Tasks</a></li>
			<li>Task Detail</li>
		</ul>
	</nav>

	{#if loading}
		<article aria-busy="true">Loading task...</article>
	{:else if error}
		<article>
			<h2>Error</h2>
			<p>{error}</p>
			<a href="/tasks" role="button">← Back to Tasks</a>
		</article>
	{:else if task}
		{#if editing}
			<!-- edit mode -->
			<h1>Edit Task</h1>

			<form onsubmit={saveEdit}>
				<fieldset>
					<label for="editTitle">
						Task Title *
						<input
							type="text"
							id="editTitle"
							name="editTitle"
							bind:value={editTitle}
							placeholder="Enter task title"
							required
							disabled={saving}
						/>
					</label>

					<div class="grid">
						<label for="editDate">
							Due Date *
							<input
								type="date"
								id="editDate"
								name="editDate"
								bind:value={editDate}
								required
								disabled={saving}
							/>
						</label>

						<label for="editCategory">
							Category *
							<select
								id="editCategory"
								name="editCategory"
								bind:value={editCategory}
								required
								disabled={saving}
							>
								{#each categories as cat}
									<option value={cat.value}>{cat.icon} {cat.label}</option>
								{/each}
							</select>
						</label>
					</div>

					<div class="grid">
						<label for="editAssignedTo">
							Assigned To
							<input
								type="text"
								id="editAssignedTo"
								name="editAssignedTo"
								bind:value={editAssignedTo}
								placeholder="Enter assignee name (optional)"
								disabled={saving}
							/>
						</label>
					</div>

					<label for="editStatus">
						Status
						<select id="editStatus" name="editStatus" bind:value={editStatus} disabled={saving}>
							<option value="open">Open</option>
							<option value="in-progress">In Progress</option>
							<option value="completed">Completed</option>
							<option value="on-hold">On Hold</option>
						</select>
					</label>

					<label for="editDescription">
						Description *
						<textarea
							id="editDescription"
							name="editDescription"
							bind:value={editDescription}
							rows="4"
							placeholder="Enter task description"
							required
							disabled={saving}
						></textarea>
					</label>

					<label>
						Location
						<div>
							<LocationPicker coordinates={editCoords} onLocationSelected={(coords) => editCoords = coords} />
							{#if editCoords}
								<p class="location-info">
									📍 Location selected: {editCoords.lat.toFixed(6)}, {editCoords.lng.toFixed(6)}
								</p>
							{:else}
								<p class="location-info">📍 No location selected (optional)</p>
							{/if}
						</div>
					</label>
				</fieldset>

				<div class="actions">
					<button type="button" class="secondary" onclick={cancelEdit} disabled={saving}>
						Cancel
					</button>
					<button type="submit" disabled={saving}>
						{saving ? 'Saving...' : 'Save Changes'}
					</button>
				</div>
			</form>
		{:else}
			<!-- view Mode -->
			{#if showConflictResolver && hasConflicts}
				<ConflictResolver 
					docId={taskId} 
					onResolved={handleConflictResolved}
				/>
			{/if}

			{#if hasConflicts && !showConflictResolver}
				<article class="conflict-banner" role="alert">
					<strong>⚠️ Conflict Detected</strong>
					<p>This task has conflicts that need to be resolved.</p>
					<button onclick={() => showConflictResolver = true} class="outline">
						Resolve Conflict
					</button>
				</article>
			{/if}

			<article>
				<header>
					<h1>{task.title}</h1>
					<div class="task-category">
						<span class="category-badge" data-category={task.category}>
							{getCategoryInfo(task.category).icon} {getCategoryInfo(task.category).label}
						</span>
					</div>
					<div class="task-meta">
						<p><small>Due: {formatDate(task.date)}</small></p>
						{#if task.assignedTo}
							<p><small>Assigned to: {task.assignedTo}</small></p>
						{/if}
						<p>
							<small>Status: <mark>{task.status || 'open'}</mark> {task.synced ? '✅' : '⏳'}</small
							>
						</p>
					</div>
				</header>

				<section>
					<h3>Description</h3>
					<p>{task.description}</p>
				</section>

				{#if task.coordinates && task.coordinates.lat && task.coordinates.lng}
					<section>
						<h3>Location</h3>
						<div class="location-display">
							<div class="location-map-view">
								<LocationPicker coordinates={task.coordinates} readonly={true} />
							</div>
						</div>
					</section>
				{/if}

				<footer>
					<details>
						<summary>Task Details</summary>
						<small>
							<p>Created: {formatDateTime(task.createdAt || task._id)}</p>
							<p>Updated: {formatDateTime(task.updatedAt || task.createdAt || task._id)}</p>
							<p>Created by: {task.createdBy || 'Unknown'}</p>
							{#if task.type}
								<p>Type: {task.type}</p>
							{/if}
						</small>
					</details>
				</footer>
			</article>

			<div class="actions">
				<a href="/tasks" role="button" class="secondary">← Back to Tasks</a>
				<button onclick={startEdit} class="outline">Edit Task</button>
				<button onclick={deleteDocument} class="contrast" disabled={deleting}>
					{deleting ? 'Deleting...' : 'Delete Task'}
				</button>
			</div>
		{/if}
	{/if}
</main>

<style>
	.actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 1rem;
	}

	.task-category {
		margin: 0.5rem 0;
	}

	.category-badge {
		display: inline-block;
		background: #f8f9fa;
		border: 1px solid #dee2e6;
		border-radius: 20px;
		padding: 0.25rem 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #495057;
	}

	.category-badge[data-category="safety"] {
		background: #fff3cd;
		border-color: #ffeaa7;
		color: #856404;
	}

	.category-badge[data-category="quality"] {
		background: #d1edff;
		border-color: #74c0fc;
		color: #0c5460;
	}

	.category-badge[data-category="equipment"] {
		background: #e2e3e5;
		border-color: #adb5bd;
		color: #495057;
	}

	.category-badge[data-category="materials"] {
		background: #f8d7da;
		border-color: #f5c6cb;
		color: #721c24;
	}

	.category-badge[data-category="electrical"] {
		background: #fff3cd;
		border-color: #ffeaa7;
		color: #856404;
	}

	.category-badge[data-category="plumbing"] {
		background: #cce5ff;
		border-color: #74c0fc;
		color: #0c5460;
	}

	.category-badge[data-category="hvac"] {
		background: #d4edda;
		border-color: #c3e6cb;
		color: #155724;
	}

	.category-badge[data-category="structural"] {
		background: #e2e3e5;
		border-color: #adb5bd;
		color: #495057;
	}

	.category-badge[data-category="finishing"] {
		background: #f8d7da;
		border-color: #f5c6cb;
		color: #721c24;
	}

	.category-badge[data-category="inspection"] {
		background: #d1ecf1;
		border-color: #bee5eb;
		color: #0c5460;
	}

	.category-badge[data-category="maintenance"] {
		background: #e2e3e5;
		border-color: #adb5bd;
		color: #495057;
	}

	.location-display {
		margin-top: 1rem;
	}

	.location-map-view {
		margin-top: 0.5rem;
	}

	.location-info {
		margin-top: 0.5rem;
		font-size: 0.9rem;
		color: #666;
		font-style: italic;
	}

	.conflict-banner {
		background: #fff3cd;
		border: 2px solid #ffc107;
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1rem;
		color: #856404;
	}

	.conflict-banner strong {
		display: block;
		margin-bottom: 0.5rem;
	}

	.conflict-banner button {
		margin-top: 0.5rem;
	}

	@media (max-width: 576px) {
		.actions {
			flex-direction: column;
		}
	}
</style>
