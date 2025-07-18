<script>
	import { appDatabase } from '$lib/db';
	import { goto } from '$app/navigation';

	let taskTitle = '';
	let date = '';
	let description = '';
	let assignedTo = '';
	let isSubmitting = false;
	let errorMessage = '';

	// set default date to today
	date = new Date().toISOString().split('T')[0];

	async function handleSubmit(event) {
		event.preventDefault();

		isSubmitting = true;
		errorMessage = '';

		try {
			await appDatabase.addTask({
				title: taskTitle.trim(),
				date: date,
				description: description.trim(),
				assignedTo: assignedTo.trim() || null
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
</script>

<main class="container">
	<nav aria-label="breadcrumb">
		<ul>
			<li><a href="/">Home</a></li>
			<li><a href="/tasks">Tasks</a></li>
			<li>New Task</li>
		</ul>
	</nav>

	<h1>Add New Task</h1>

	{#if errorMessage}
		<article class="error">
			{errorMessage}
		</article>
	{/if}

	<form onsubmit={handleSubmit}>
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
		</fieldset>

		<div class="actions">
			<a href="/tasks" role="button" class="secondary">Cancel</a>
			<button type="submit" disabled={isSubmitting}>
				{isSubmitting ? 'Creating Task...' : 'Create Task'}
			</button>
		</div>
	</form>
</main>

<style>
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

	@media (max-width: 576px) {
		.actions {
			flex-direction: column;
		}
	}
</style>
