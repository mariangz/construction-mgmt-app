<script>
	import { onMount } from 'svelte';
	import { taskDatabase } from '$lib/db';

	let reports = [];
	let isLoading = true;
 let filteredReports = [];

	onMount(async () => {
		await loadReports();
		isLoading = false;
	});

	async function loadReports() {
		try {
			const allDocs = await taskDatabase.getAllTasks();
			reports = allDocs.filter(doc => doc.type === 'report');
			filteredReports = reports;
		} catch (error) {
			console.error('Error loading reports:', error);
		}
	}

	async function deleteReport(id) {
		if (confirm('Are you sure you want to delete this report?')) {
			try {
				await taskDatabase.deleteTask(id);
				await loadReports();
			} catch (error) {
				console.error('Error deleting report:', error);
			}
		}
	}

	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString();
	}
</script>

<main class="container">
 <header class="page-header">
  <h1>📊 Reports</h1>
  <a href="/reports/new" class="add-button">➕ Add Report</a>
 </header>

 {#if isLoading}
  <div class="loading">Loading reports...</div>
 {:else if filteredReports.length === 0}
  <div class="empty-state">
   <p>No reports found.</p>
   <a href="/reports/new" class="add-button">Create your first report</a>
  </div>
 {:else}
  <div class="reports-grid">
   {#each filteredReports as report}
    <div class="report-card">
     <div class="report-header">
      <h3 class="report-title">{report.title}</h3>
      <span class="status-badge {report.status}">{report.status}</span>
     </div>
     <p class="report-description">{report.description}</p>
     <div class="report-meta">
      <span class="report-date">Created: {formatDate(report.createdAt)}</span>
      {#if report.assignedTo}
       <span class="report-assigned">Assigned to: {report.assignedTo}</span>
      {/if}
     </div>
     <div class="report-actions">
      <a href="/reports/{report._id}" class="view-button">View</a>
      <button class="delete-button" onclick={() => deleteReport(report._id)}>
       Delete
      </button>
     </div>
    </div>
   {/each}
  </div>
 {/if}

 <nav class="bottom-nav">
  <a href="/" class="nav-link">← Back to Home</a>
 </nav>
</main>

<style>
 .container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
 }

 .page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
 }

 .page-header h1 {
  font-size: 2rem;
  margin: 0;
  color: #1a1a1a;
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

 .loading {
  text-align: center;
  padding: 2rem;
  color: #666;
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

 .reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
 }

 .report-card {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s ease;
 }

 .report-card:hover {
  border-color: #007bff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
 }

 .report-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
 }

 .report-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
  color: #1a1a1a;
  flex: 1;
 }

 .status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
 }

 .status-badge.draft {
  background: #ffc107;
  color: #856404;
 }

 .status-badge.completed {
  background: #28a745;
  color: white;
 }

 .status-badge.submitted {
  background: #007bff;
  color: white;
 }

 .report-description {
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.5;
 }

 .report-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #666;
 }

 .report-actions {
  display: flex;
  gap: 0.5rem;
 }

 .view-button {
  background: #28a745;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.9rem;
  transition: background 0.2s ease;
 }

 .view-button:hover {
  background: #1e7e34;
 }

 .delete-button {
  background: #dc3545;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s ease;
 }

 .delete-button:hover {
  background: #c82333;
 }

 .bottom-nav {
  text-align: center;
  margin-top: 2rem;
 }

 .nav-link {
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
 }

 .nav-link:hover {
  text-decoration: underline;
 }

 @media (max-width: 768px) {
  .page-header {
   flex-direction: column;
   gap: 1rem;
   align-items: stretch;
  }

  .filters {
   flex-direction: column;
  }

  .reports-grid {
   grid-template-columns: 1fr;
  }
 }
</style> 