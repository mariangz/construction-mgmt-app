<script>
	import { page } from '$app/stores';
	import { appDatabase } from '$lib/db';
	import { goto } from '$app/navigation';

	let report = null;
	let loading = true;
	let error = null;
	let deleting = false;

	const statusColors = {
		draft: '#ffc107',
		completed: '#28a745',
		submitted: '#007bff'
	};

	const priorityColors = {
		low: '#28a745',
		medium: '#ffc107',
		high: '#fd7e14',
		urgent: '#dc3545'
	};

	// get the report id from the url
	$: reportId = $page.params.id;
	$: if (reportId) {
	console.log('reportId', reportId);
	loadReport(reportId);
}

async function loadReport(id) {
		try {
			loading = true;
			error = null;
			report = await appDatabase.getDocument(id);
		} catch (err) {
			error = 'Report not found or failed to load.';
			console.error('Error loading report:', err);
		} finally {
			loading = false;
		}
	}

	async function deleteReport() {
		if (!confirm('Are you sure you want to delete this report?')) {
			return;
		}

		try {
			deleting = true;
			await appDatabase.deleteDocument(reportId);
			goto('/reports');
		} catch (err) {
			alert('Failed to delete report. Please try again.');
			console.error('Error deleting report:', err);
		} finally {
			deleting = false;
		}
	}

	function formatDate(dateString) {
		if (!dateString) return 'Not set';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatDateTime(dateString) {
		if (!dateString) return 'Not set';
		return new Date(dateString).toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

</script>

<!-- tab title -->
<svelte:head>
	<title>{report ? `${report.title} - Report` : 'Loading...'} - Field App</title>
</svelte:head>

<main class="container">
	<nav aria-label="breadcrumb">
		<ul>
			<li><a href="/">Home</a></li>
			<li><a href="/reports">Reports</a></li>
			<li>{loading ? 'Loading...' : (report ? report.title : 'Not Found')}</li>
		</ul>
	</nav>

	{#if loading}
		<article>
			<h1>Loading report...</h1>
			<p>Please wait while we fetch the report details.</p>
		</article>
	{:else if error}
		<article>
			<h1>❌ Error</h1>
			<p>{error}</p>
			<a href="/reports" role="button">← Back to Reports</a>
		</article>
	{:else if report}
		<article class="report-header">
			<header>
				<div class="title-section">
					<h1>{report.title}</h1>
					<div class="badges">
						<span class="status-badge" style="background-color: {statusColors[report.status] || '#6c757d'}">
							{report.status}
						</span>
						<span class="priority-badge" style="background-color: {priorityColors[report.priority] || '#6c757d'}">
							{report.priority} priority
						</span>
						<span class="sync-status">
							{report.synced ? '✅ Synced' : '⏳ Pending'}
						</span>
					</div>
				</div>
			</header>

			<div class="report-meta">
				<div class="meta-grid">
					<div class="meta-item">
						<strong>Report Type:</strong>
						<span>{report.reportType || 'Not specified'}</span>
					</div>
					<div class="meta-item">
						<strong>Location:</strong>
						<span>{report.location || 'Not specified'}</span>
					</div>
					<div class="meta-item">
						<strong>Assigned To:</strong>
						<span>{report.assignedTo || 'Unassigned'}</span>
					</div>
					<div class="meta-item">
						<strong>Due Date:</strong>
						<span>{formatDate(report.dueDate)}</span>
					</div>
					<div class="meta-item">
						<strong>Created:</strong>
						<span>{formatDateTime(report.createdAt)}</span>
					</div>
					<div class="meta-item">
						<strong>Updated:</strong>
						<span>{formatDateTime(report.updatedAt)}</span>
					</div>
				</div>
			</div>
		</article>

		<article class="report-content">
			<header>
				<h2>📋 Description</h2>
			</header>
			<div class="content-section">
				<p>{report.description}</p>
			</div>
		</article>

		{#if report.materials}
			<article class="report-content">
				<header>
					<h2>🧱 Materials</h2>
				</header>
				<div class="content-section">
					<p>{report.materials}</p>
				</div>
			</article>
		{/if}

		{#if report.findings}
			<article class="report-content">
				<header>
					<h2>🔍 Findings</h2>
				</header>
				<div class="content-section">
					<p>{report.findings}</p>
				</div>
			</article>
		{/if}

		{#if report.recommendations}
			<article class="report-content">
				<header>
					<h2>💡 Recommendations</h2>
				</header>
				<div class="content-section">
					<p>{report.recommendations}</p>
				</div>
			</article>
		{/if}

		<div class="actions">
			<a href="/reports" role="button" class="secondary">← Back to Reports</a>
			<button onclick={deleteReport} class="contrast">Delete Report</button>
		</div>
	{/if}
</main>

<style>
	.report-header {
		margin-bottom: 2rem;
	}

	.title-section {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.title-section h1 {
		margin: 0;
		flex: 1;
	}

	.badges {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.status-badge,
	.priority-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.8rem;
		font-weight: 500;
		text-transform: uppercase;
		color: white;
		white-space: nowrap;
	}

	.sync-status {
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.8rem;
		font-weight: 500;
		background-color: #f8f9fa;
		color: #495057;
		border: 1px solid #dee2e6;
		white-space: nowrap;
	}

	.report-meta {
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid #dee2e6;
	}

	.meta-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
	}

	.meta-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.meta-item strong {
		color: #495057;
		font-size: 0.9rem;
	}

	.meta-item span {
		color: #212529;
	}

	.report-content {
		margin-bottom: 1.5rem;
	}

	.report-content header h2 {
		margin: 0;
		color: #495057;
		font-size: 1.25rem;
	}

	.content-section {
		margin-top: 1rem;
		line-height: 1.6;
	}

	.content-section p {
		margin: 0;
		white-space: pre-wrap;
	}

	.actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid #dee2e6;
	}

	@media (max-width: 768px) {
		.title-section {
			flex-direction: column;
			align-items: flex-start;
		}

		.badges {
			align-self: stretch;
		}

		.meta-grid {
			grid-template-columns: 1fr;
		}

		.actions {
			flex-direction: column;
		}
	}
</style> 