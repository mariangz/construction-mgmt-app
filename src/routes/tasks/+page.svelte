<script>
	import { onMount } from 'svelte';
	import { appDatabase } from '$lib/db';
	import { browser } from '$app/environment';

	let tasks = [];
	let loading = true;
	let error = null;

	onMount(() => {
		loadTasks();
	});

	async function loadTasks() {
		// only run on the browser
		if (!browser) return;

		try {
			loading = true;
			error = null;
			const allDocs = await appDatabase.getAllTasks();
			tasks = allDocs.filter(doc => doc.type === 'task');
		} catch (err) {
			error = 'Failed to load tasks. Please try again.';
			console.error('Error loading tasks:', err);
		} finally {
			loading = false;
		}
	}

	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString();
	}
</script>

<main class="container">
	<nav aria-label="breadcrumb">
		<ul>
			<li><a href="/">Home</a></li>
			<li>Tasks</li>
		</ul>
	</nav>
	<div class="headings">
		<h1>Construction Tasks</h1>
		{#if tasks.length > 0}
			<a href="/tasks/new" class="add-button">➕ Add Task</a>
		{/if}
	</div>

	{#if loading}
		<article>Loading tasks...</article>
	{:else if error}
		<article class="error">
			{error}
			<button onclick={loadTasks}>Try Again</button>
		</article>
	{:else if tasks.length === 0}
		<div class="empty-state">
			<p>No tasks found.</p>
			<a href="/tasks/new" role="button" class="add-button">Add Your First Task</a>
		</div>
	{:else}
		<div class="grid">
			{#each tasks as task}
				<article>
					<header>
						<h3><a href="/tasks/{task._id}">{task.title}</a></h3>
					</header>
					<p class="task-description">{task.description}</p>
					<footer>
						<div class="task-meta">
							<small>Due: {formatDate(task.date)}</small>
							<small>Status: <mark>{task.status || 'open'}</mark> {task.synced ? '✅' : '⏳'}</small>
						</div>
						<a href="/tasks/{task._id}" role="button" class="outline">View Details</a>
					</footer>
				</article>
			{/each}
		</div>
	{/if}

	<nav class="bottom-nav">
		<a href="/" class="nav-link">← Back to Home</a>
	</nav>
</main>

<style>
	.headings {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.add-button {
		background: #007bff;
		color: white;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		text-decoration: none;
		font-weight: 500;
		transition: background 0.2s ease;
	}

	.add-button:hover {
		background: #0056b3;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: #666;
	}

	.empty-state p {
		font-size: 1.1rem;
		margin-bottom: 1rem;
	}

	.task-description {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.task-meta {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.bottom-nav {
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid #dee2e6;
	}

	.nav-link {
		color: #007bff;
		text-decoration: none;
		font-weight: 500;
	}

	.nav-link:hover {
		text-decoration: underline;
	}

	@media (max-width: 576px) {
		.headings {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}

		footer {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
