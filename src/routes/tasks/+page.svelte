<script>
	import { onMount } from 'svelte';
	import { appDatabase } from '$lib/db';
	import { browser } from '$app/environment';

	let tasks = [];
	let loading = true;
	let loadingMore = false;
	let noMoreTasks = false;
	let selectedCategory = 'all';

	// get available categories for display
	const categories = appDatabase.getTaskCategories();

	onMount(() => {
		loadTasks();
	});

	async function loadTasks() {
		if (!browser) return;
		try {
			loading = true;
			const allTasks = await appDatabase.getTasksPage();
			tasks = filterTasksByCategory(allTasks);
			if (tasks.length < 10) {
				noMoreTasks = true;
			}
		} catch (err) {
			console.error('Error loading tasks:', err);
		} finally {
			loading = false;
		}
	}

	function filterTasksByCategory(taskList) {
		if (selectedCategory === 'all') {
			return taskList;
		}
		return taskList.filter(task => task.category === selectedCategory);
	}

	function onCategoryChange() {
		// Reload tasks with new filter
		loadTasks();
	}

	async function loadMore() {
		if (loadingMore || tasks.length === 0) return;

		try {
			loadingMore = true;
			const lastId = tasks[tasks.length - 1]._id;
			console.log('lastId', lastId);
			const moreTasks = await appDatabase.getTasksPage({ startAfter: lastId });
			if (moreTasks.length > 0) {
				tasks = [...tasks, ...moreTasks];
			}
			if (moreTasks.length < 10) {
				noMoreTasks = true;
			}
		} catch (err) {
			console.error('Error loading more tasks:', err);
		} finally {
			loadingMore = false;
		}
	}

	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString();
	}

	function getCategoryInfo(categoryValue) {
		return categories.find(cat => cat.value === categoryValue) || { value: 'general', label: 'General', icon: '📋' };
	}

	function getCategoryLabel(categoryValue) {
		return getCategoryInfo(categoryValue).label.toLowerCase();
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

	<div class="filters">
		<label for="categoryFilter">
			Filter by Category:
			<select id="categoryFilter" bind:value={selectedCategory} onchange={onCategoryChange}>
				<option value="all">All Categories</option>
				{#each categories as cat}
					<option value={cat.value}>{cat.icon} {cat.label}</option>
				{/each}
			</select>
		</label>
	</div>

	{#if loading}
		<article>Loading tasks...</article>
	{:else if tasks.length === 0}
		<div class="empty-state">
			{#if selectedCategory === 'all'}
				<p>No tasks found.</p>
				<a href="/tasks/new" role="button" class="add-button">Add Your First Task</a>
			{:else}
				<p>No {getCategoryLabel(selectedCategory)} tasks found.</p>
				<p><small>Try selecting a different category or <a href="/tasks/new">create a new task</a>.</small></p>
			{/if}
		</div>
	{:else}
		<div class="grid">
			{#each tasks as task}
				<article>
					<header>
						<h3><a href="/tasks/{task._id}">{task.title}</a></h3>
						<div class="task-category">
							<span class="category-badge" data-category={task.category}>
								{getCategoryInfo(task.category).icon} {getCategoryInfo(task.category).label}
							</span>
						</div>
					</header>
					<p class="task-description">{task.description}</p>
					<footer>
						<div class="task-meta">
							<small>Due: {formatDate(task.date)}</small>
							<small>Status: <mark>{task.status || 'open'}</mark> {task.synced ? '✅' : '⏳'}</small
							>
							<small>Created by: {task.createdBy || 'Unknown'}</small>
						</div>
						<a href="/tasks/{task._id}" role="button" class="outline">View Details</a>
					</footer>
				</article>
			{/each}
		</div>

		{#if !noMoreTasks}
			<div class="load-more">
				<button onclick={loadMore} disabled={loadingMore}>
					{loadingMore ? 'Loading...' : 'Load More'}
				</button>
			</div>
		{/if}
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
		margin-bottom: 1rem;
	}

	.filters {
		background: #f8f9fa;
		border: 1px solid #dee2e6;
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 2rem;
	}

	.filters label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 500;
		margin: 0;
	}

	.filters select {
		min-width: 200px;
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

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.grid article {
		background: white;
		border: 2px solid #e9ecef;
		border-radius: 12px;
		padding: 1.5rem;
	}

	.task-category {
		margin-top: 0.5rem;
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

	.task-description {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
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

	.task-meta small:last-child {
		font-style: italic;
		color: #007bff;
	}

	.load-more {
		text-align: center;
		margin: 2rem 0;
	}

	.load-more button {
		background: #007bff;
		border: none;
		padding: 0.75rem 2rem;
		border-radius: 8px;
		cursor: pointer;
		transition: background 0.2s ease;
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

		.grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		footer {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
