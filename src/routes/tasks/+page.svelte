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
	</div>

	{#if loading}
		<article>Loading tasks...</article>
	{:else if error}
		<article class="error">
			{error}
			<button onclick={loadTasks}>Try Again</button>
		</article>
	{:else if tasks.length === 0}
		<article>
			<p>No tasks found. Start by adding a new task!</p>
			<a href="/tasks/new" role="button">Add Your First Task</a>
		</article>
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
							<small>Status: <mark>{task.status || 'open'}</mark></small>
						</div>
						<a href="/tasks/{task._id}" role="button" class="outline">View Details</a>
					</footer>
				</article>
			{/each}
		</div>
	{/if}
</main>

<style>
	.headings {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
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
