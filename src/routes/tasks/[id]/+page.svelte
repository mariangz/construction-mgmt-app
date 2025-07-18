<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { appDatabase } from '$lib/db';

	let task = null;
	let loading = true;
	let error = null;
	let deleting = false;
	let editing = false;
	let saving = false;
	let errorMessage = '';

	// edit form variables
	let editTitle = '';
	let editDate = '';
	let editDescription = '';
	let editAssignedTo = '';
	let editStatus = 'open';

	$: taskId = $page.params.id;
	$: if (taskId) {
		console.log('taskId', taskId);
		loadTask(taskId);
	}

	console.log('page', $page);
	console.log('taskId', taskId);

	async function loadTask(id) {
		try {
			loading = true;
			error = null;
			task = await appDatabase.getDocument(id);
			// initialize edit form with current values
			if (task) {
				editTitle = task.title || '';
				editDate = task.date || '';
				editDescription = task.description || '';
				editAssignedTo = task.assignedTo || '';
				editStatus = task.status || 'open';
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
		errorMessage = '';
		// reset form to original values
		if (task) {
			editTitle = task.title || '';
			editDate = task.date || '';
			editDescription = task.description || '';
			editAssignedTo = task.assignedTo || '';
			editStatus = task.status || 'open';
		}
	}

	async function saveEdit(event) {
		event.preventDefault();

		saving = true;
		errorMessage = '';

				try {
			// update the task object with new values
			const updatedTask = {
				...task,
				title: editTitle.trim(),
				date: editDate,
				description: editDescription.trim(),
				assignedTo: editAssignedTo.trim() || null,
				status: editStatus
			};

			await appDatabase.updateDocument(updatedTask);

			task = updatedTask;
			editing = false;

			console.log('Task updated successfully');
		} catch (err) {
			errorMessage = 'Failed to update task. Please try again.';
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
			<a href="/tasks" role="button">Back to Tasks</a>
		</article>
	{:else if task}
		{#if editing}
			<!-- edit mode -->
			<h1>Edit Task</h1>

			{#if errorMessage}
				<article class="error">
					{errorMessage}
				</article>
			{/if}

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
			<article>
				<header>
					<h1>{task.title}</h1>
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
				<a href="/tasks" role="button" class="secondary">Back to Tasks</a>
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

	.error {
		background: #f8d7da;
		color: #721c24;
		border: 1px solid #f5c6cb;
		margin-bottom: 1rem;
	}

	@media (max-width: 576px) {
		.actions {
			flex-direction: column;
		}
	}
</style>
