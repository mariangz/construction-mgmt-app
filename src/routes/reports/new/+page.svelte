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
	let errorMessage = '';
	let files = [];

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

	async function handleSubmit(event) {
		event.preventDefault();

		isSubmitting = true;
		errorMessage = '';

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

			const result = await appDatabase.addReport(reportData);
			// add attachments if any
			if (files && files.length > 0) {
				for (const file of files) {
					await appDatabase.addAttachment(result.id, file);
				}
			}
			goto('/reports');
		} catch (error) {
			console.error('Error creating report:', error);
			errorMessage = 'Failed to create report. Please try again.';
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
	<nav aria-label="breadcrumb">
		<ul>
			<li><a href="/">Home</a></li>
			<li><a href="/reports">Reports</a></li>
			<li>New Report</li>
		</ul>
	</nav>

	<h1>📝 Add New Report</h1>

	{#if errorMessage}
		<article class="error">
			{errorMessage}
		</article>
	{/if}

	<form onsubmit={handleSubmit} class="report-form">
		<div class="form-section">
			<h2>Basic Information</h2>

			<div class="form-group">
				<label for="title">Report Title *</label>
				<input
					id="title"
					type="text"
					bind:value={title}
					placeholder="Enter report title..."
					required
					disabled={isSubmitting}
				/>
			</div>

			<div class="form-group">
				<label for="reportType">Report Type</label>
				<select id="reportType" bind:value={reportType} disabled={isSubmitting}>
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
					placeholder="e.g., Building A - Floor 3, etc."
					required
					disabled={isSubmitting}
				/>
			</div>

			<div class="form-group">
				<label for="description">Description *</label>
				<textarea
					id="description"
					bind:value={description}
					placeholder="Provide a detailed description of the report..."
					rows="4"
					required
					disabled={isSubmitting}
				></textarea>
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
						disabled={isSubmitting}
					/>
				</div>

				<div class="form-group">
					<label for="priority">Priority</label>
					<select id="priority" bind:value={priority} disabled={isSubmitting}>
						{#each priorities as priorityOption}
							<option value={priorityOption.value}>{priorityOption.label}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="form-row">
				<div class="form-group">
					<label for="status">Status</label>
					<select id="status" bind:value={status} disabled={isSubmitting}>
						{#each statuses as statusOption}
							<option value={statusOption.value}>{statusOption.label}</option>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label for="dueDate">Due Date</label>
					<input id="dueDate" type="date" bind:value={dueDate} disabled={isSubmitting} />
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
					disabled={isSubmitting}
				></textarea>
			</div>

			<div class="form-group">
				<label for="findings">Findings/Observations</label>
				<textarea
					id="findings"
					bind:value={findings}
					placeholder="Document key findings, observations, or issues..."
					rows="4"
					disabled={isSubmitting}
				></textarea>
			</div>

			<div class="form-group">
				<label for="recommendations">Recommendations/Actions</label>
				<textarea
					id="recommendations"
					bind:value={recommendations}
					placeholder="Provide recommendations or required actions..."
					rows="3"
					disabled={isSubmitting}
				></textarea>
			</div>
		</div>

		<div class="form-group">
			<label for="fileUpload">
				Upload File
				<input
					type="file"
					id="fileUpload"
					name="fileUpload"
					accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
					multiple
					onchange={(e) => (files = Array.from(e.currentTarget.files || []))}
					disabled={isSubmitting}
				/>
			</label>
		</div>

		<div class="form-actions">
			<button type="button" class="secondary" onclick={handleCancel} disabled={isSubmitting}>
				Cancel
			</button>
			<button type="submit" disabled={isSubmitting}>
				{isSubmitting ? 'Creating Report...' : 'Create Report'}
			</button>
		</div>
	</form>
</main>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
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

	.form-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 2px solid #e9ecef;
	}

	.error {
		background: #f8d7da;
		color: #721c24;
		border: 1px solid #f5c6cb;
		margin-bottom: 1rem;
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
