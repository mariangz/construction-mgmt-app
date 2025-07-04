<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { appDatabase } from '$lib/db';

	let task = null;
	let loading = true;
	let error = null;
	let deleting = false;

	$: taskId = $page.params.id;
	$: if (taskId) {
	console.log('taskId', taskId);
	loadTask(taskId);
}

	console.log('page', $page);
	console.log('taskId', taskId)

	async function loadTask(id) {
		try {
			loading = true;
			error = null;
			task = await appDatabase.getDocument(id);
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
		<article>
			<header>
				<h1>{task.title}</h1>
				<div class="task-meta">
					<p><small>Due: {formatDate(task.date)}</small></p>
					{#if task.assignedTo}
						<p><small>Assigned to: {task.assignedTo}</small></p>
					{/if}
					<p><small>Status: <mark>{task.status || 'open'}</mark></small></p>
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
			<button onclick={deleteDocument} class="contrast" disabled={deleting}>
				{deleting ? 'Deleting...' : 'Delete Task'}
			</button>
		</div>
	{/if}
</main>

<style>
	.actions {
		margin-top: 2rem;
		display: flex;
		gap: 1rem;
		justify-content: space-between;
	}

	@media (max-width: 576px) {
		.actions {
			flex-direction: column;
		}
	}
</style>
