<script>
	import { appDatabase } from '$lib/db';
	import { goto } from '$app/navigation';
	import LocationPicker from '$lib/components/LocationPicker.svelte';

	let taskTitle = '';
	let date = '';
	let description = '';
	let assignedTo = '';
	let category = 'general';
	let isSubmitting = false;
	let errorMessage = '';
	let coords = null;

	// set default date to today
	date = new Date().toISOString().split('T')[0];

	// get available categories
	const categories = appDatabase.getTaskCategories();

	function handleSelected(coordsData) {
		coords = coordsData; // { lat, lng } o null
	}

	async function handleSubmit(event) {
		event.preventDefault();

		isSubmitting = true;
		errorMessage = '';

		try {
			await appDatabase.addTask({
				title: taskTitle.trim(),
				date: date,
				description: description.trim(),
				assignedTo: assignedTo.trim() || null,
				category: category,
				coordinates: coords
			});

			// Redirect to tasks list after successful creation
			goto('/tasks');
		} catch (error) {
			console.error('Error saving task:', error);
			errorMessage = 'Failed to save task. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}

	function handleCancel() {
		if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
			goto('/tasks');
		}
	}
</script>

<main class="container">
	<nav aria-label="breadcrumb">
		<ul>
			<li><a href="/">Home</a></li>
			<li><a href="/tasks">Tasks</a></li>
			<li>New Task</li>
		</ul>
	</nav>

	<h1>📝 Add New Task</h1>

	{#if errorMessage}
		<article class="error">
			{errorMessage}
		</article>
	{/if}

	<form onsubmit={handleSubmit} class="task-form">
		<fieldset>
			<label for="taskTitle">
				Task Title *
				<input
					type="text"
					id="taskTitle"
					name="taskTitle"
					bind:value={taskTitle}
					placeholder="Enter task title"
					required
					disabled={isSubmitting}
				/>
			</label>

			<div class="grid">
				<label for="date">
					Due Date *
					<input
						type="date"
						id="date"
						name="date"
						bind:value={date}
						required
						disabled={isSubmitting}
					/>
				</label>

				<label for="category">
					Category *
					<select
						id="category"
						name="category"
						bind:value={category}
						required
						disabled={isSubmitting}
					>
						{#each categories as cat}
							<option value={cat.value}>{cat.icon} {cat.label}</option>
						{/each}
					</select>
				</label>
			</div>

			<div class="grid">
				<label for="assignedTo">
					Assigned To
					<input
						type="text"
						id="assignedTo"
						name="assignedTo"
						bind:value={assignedTo}
						placeholder="Enter assignee name (optional)"
						disabled={isSubmitting}
					/>
				</label>
			</div>

			<label for="description">
				Description *
				<textarea
					id="description"
					name="description"
					bind:value={description}
					rows="4"
					placeholder="Enter task description"
					required
					disabled={isSubmitting}
				></textarea>
			</label>

			<label>
				Location
				<div>
					<LocationPicker coordinates={coords} onLocationSelected={handleSelected} />
					{#if coords}
						<p class="location-info">
							📍 Location selected: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
						</p>
					{:else}
						<p class="location-info">📍 No location selected (optional)</p>
					{/if}
				</div>
			</label>
		</fieldset>

		<div class="actions">
			<button type="button" class="secondary" onclick={handleCancel} disabled={isSubmitting}>
				Cancel
			</button>
			<button type="submit" disabled={isSubmitting}>
				{isSubmitting ? 'Creating Task...' : 'Create Task'}
			</button>
		</div>
	</form>
</main>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
	}

	.task-form {
		background: white;
		border: 2px solid #e9ecef;
		border-radius: 12px;
		padding: 2rem;
	}

	.error {
		background: #f8d7da;
		color: #721c24;
		border: 1px solid #f5c6cb;
		margin-bottom: 1rem;
	}

	.actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 1rem;
	}

	.location-info {
		margin-top: 0.5rem;
		font-size: 0.9rem;
		color: #666;
		font-style: italic;
	}

	@media (max-width: 576px) {
		.actions {
			flex-direction: column;
		}
	}
</style>
