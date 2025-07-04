<script>
	import { appDatabase } from '$lib/db';
	import { goto } from '$app/navigation';

	let title = '';
	let description = '';
	let reportType = 'inspection';
	let location = '';
	let assignedTo = '';
	let priority = 'medium';
	let status = 'draft';
	let dueDate = '';
	let materials = '';
	let findings = '';
	let recommendations = '';
	let isSubmitting = false;
	let errors = {};

	const reportTypes = [
		{ value: 'inspection', label: 'Inspection Report' },
		{ value: 'progress', label: 'Progress Report' },
		{ value: 'safety', label: 'Safety Report' },
		{ value: 'quality', label: 'Quality Control Report' },
		{ value: 'incident', label: 'Incident Report' },
		{ value: 'material', label: 'Material Report' },
		{ value: 'weather', label: 'Weather Delay Report' }
	];

	const priorities = [
		{ value: 'low', label: 'Low' },
		{ value: 'medium', label: 'Medium' },
		{ value: 'high', label: 'High' },
		{ value: 'urgent', label: 'Urgent' }
	];

	const statuses = [
		{ value: 'draft', label: 'Draft' },
		{ value: 'completed', label: 'Completed' },
		{ value: 'submitted', label: 'Submitted' }
	];

	function validateForm() {
		errors = {};

		if (!title.trim()) {
			errors.title = 'Title is required';
		}

		if (!description.trim()) {
			errors.description = 'Description is required';
		}

		if (!location.trim()) {
			errors.location = 'Location is required';
		}

		if (dueDate && new Date(dueDate) < new Date()) {
			errors.dueDate = 'Due date cannot be in the past';
		}

		return Object.keys(errors).length === 0;
	}

	async function handleSubmit() {
  event.preventDefault();
		if (!validateForm()) return;

		isSubmitting = true;

		try {
			const reportData = {
				title: title.trim(),
				description: description.trim(),
				reportType,
				location: location.trim(),
				assignedTo: assignedTo.trim() || null,
				priority,
				status,
				dueDate: dueDate || null,
				materials: materials.trim() || null,
				findings: findings.trim() || null,
				recommendations: recommendations.trim() || null
			};

			await appDatabase.addReport(reportData);
			goto('/reports');
		} catch (error) {
			console.error('Error creating report:', error);
			alert('Failed to create report. Please try again.');
		} finally {
			isSubmitting = false;
		}
	}

	function handleCancel() {
		if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
			goto('/reports');
		}
	}
</script>

<main class="container">
	<header class="page-header">
		<h1>📝 Add New Report</h1>
	</header>

	<form onsubmit={handleSubmit} class="report-form">
		<div class="form-section">
			<h2>Basic Information</h2>

			<div class="form-group">
				<label for="title">Report Title *</label>
				<input
					id="title"
					type="text"
					bind:value={title}
					class={{ error: errors.title }}
					placeholder="Enter report title..."
				/>
				{#if errors.title}
					<span class="error-text">{errors.title}</span>
				{/if}
			</div>

			<div class="form-group">
				<label for="reportType">Report Type</label>
				<select id="reportType" bind:value={reportType}>
					{#each reportTypes as type}
						<option value={type.value}>{type.label}</option>
					{/each}
				</select>
			</div>

			<div class="form-group">
				<label for="location">Location *</label>
				<input
					id="location"
					type="text"
					bind:value={location}
					class={{ error: errors.location }}
					placeholder="e.g., Building A - Floor 3, etc."
				/>
				{#if errors.location}
					<span class="error-text">{errors.location}</span>
				{/if}
			</div>

			<div class="form-group">
				<label for="description">Description *</label>
				<textarea
					id="description"
					bind:value={description}
					class={{ error: errors.description }}
					placeholder="Provide a detailed description of the report..."
					rows="4"
				></textarea>
				{#if errors.description}
					<span class="error-text">{errors.description}</span>
				{/if}
			</div>
		</div>

		<div class="form-section">
			<h2>Assignment & Priority</h2>

			<div class="form-row">
				<div class="form-group">
					<label for="assignedTo">Assigned To</label>
					<input
						id="assignedTo"
						type="text"
						bind:value={assignedTo}
						placeholder="Enter name or leave blank"
					/>
				</div>

				<div class="form-group">
					<label for="priority">Priority</label>
					<select id="priority" bind:value={priority}>
						{#each priorities as priorityOption}
							<option value={priorityOption.value}>{priorityOption.label}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="form-row">
				<div class="form-group">
					<label for="status">Status</label>
					<select id="status" bind:value={status}>
						{#each statuses as statusOption}
							<option value={statusOption.value}>{statusOption.label}</option>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label for="dueDate">Due Date</label>
					<input id="dueDate" type="date" bind:value={dueDate} class={{ error: errors.dueDate }} />
					{#if errors.dueDate}
						<span class="error-text">{errors.dueDate}</span>
					{/if}
				</div>
			</div>
		</div>

		<div class="form-section">
			<h2>Additional Details</h2>

			<div class="form-group">
				<label for="materials">Materials/Equipment</label>
				<textarea
					id="materials"
					bind:value={materials}
					placeholder="List materials, equipment, or resources involved..."
					rows="3"
				></textarea>
			</div>

			<div class="form-group">
				<label for="findings">Findings/Observations</label>
				<textarea
					id="findings"
					bind:value={findings}
					placeholder="Document key findings, observations, or issues..."
					rows="4"
				></textarea>
			</div>

			<div class="form-group">
				<label for="recommendations">Recommendations/Actions</label>
				<textarea
					id="recommendations"
					bind:value={recommendations}
					placeholder="Provide recommendations or required actions..."
					rows="3"
				></textarea>
			</div>
		</div>

		<div class="form-actions">
			<button type="button" class="cancel-button" onclick={handleCancel}> Cancel </button>
			<button type="submit" class="submit-button" disabled={isSubmitting}>
				{isSubmitting ? 'Creating Report...' : 'Create Report'}
			</button>
		</div>
	</form>
</main>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.page-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.page-header h1 {
		font-size: 2rem;
		color: #1a1a1a;
	}

	.report-form {
		background: white;
		border: 2px solid #e9ecef;
		border-radius: 12px;
		padding: 2rem;
	}

	.form-section {
		margin-bottom: 2rem;
	}

	.form-section h2 {
		font-size: 1.3rem;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 1.5rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid #e9ecef;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	label {
		display: block;
		font-weight: 500;
		color: #495057;
		margin-bottom: 0.5rem;
	}

	input,
	select,
	textarea {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e9ecef;
		border-radius: 8px;
		font-size: 1rem;
		transition: border-color 0.2s ease;
	}

	input:focus,
	select:focus,
	textarea:focus {
		outline: none;
		border-color: #007bff;
	}

	input.error,
	textarea.error {
		border-color: #dc3545;
	}

	.error-text {
		color: #dc3545;
		font-size: 0.9rem;
		margin-top: 0.25rem;
		display: block;
	}

	textarea {
		resize: vertical;
		min-height: 100px;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 2px solid #e9ecef;
	}

	.cancel-button {
		padding: 0.75rem 1.5rem;
		background: #6c757d;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.cancel-button:hover {
		background: #545b62;
	}

	.submit-button {
		padding: 0.75rem 1.5rem;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}

		.report-form {
			padding: 1.5rem;
		}

		.form-row {
			grid-template-columns: 1fr;
		}

		.form-actions {
			flex-direction: column;
		}
	}
</style>
