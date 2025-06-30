<script>

</script>

<main class="container">
	<header class="app-header">
		<div class="title-section">
			<h1 class="app-title">
				Field App
				<span class="crane-icon">🏗️</span>
			</h1>
			<p class="app-subtitle">Capture tasks and reports from the field — even offline.</p>
		</div>
	</header>

	<nav class="main-nav">
		<a href="/tasks" class="nav-button">
			<span class="icon">📋</span>
			View Tasks
		</a>

		<a href="/reports" class="nav-button">
			<span class="icon">📊</span>
			View Reports
		</a>

		<a href="/new" class="nav-button add-button">
			<span class="icon">➕</span>
			Add Task
		</a>

		<a href="/reports/new" class="nav-button add-button">
			<span class="icon">📝</span>
			Add Report
		</a>
	</nav>
</main>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 1rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.app-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.app-title {
		font-size: 3rem;
		font-weight: 700;
		color: #1a1a1a;
		margin: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	.crane-icon {
		font-size: 2.5rem;
	}

	.app-subtitle {
		font-size: 1.2rem;
		color: #666;
		margin: 1rem 0 0 0;
		line-height: 1.5;
	}

	.main-nav {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 3rem;
	}

	.nav-button {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem 1.5rem;
		background: #f8f9fa;
		border: 2px solid #e9ecef;
		border-radius: 12px;
		text-decoration: none;
		color: #495057;
		font-size: 1.1rem;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.nav-button:hover {
		background: #e9ecef;
		border-color: #dee2e6;
		transform: translateY(-1px);
	}

	.add-button {
		background: #007bff;
		color: white;
		border-color: #007bff;
	}

	.add-button:hover {
		background: #0056b3;
		border-color: #0056b3;
	}

	.icon {
		font-size: 1.2rem;
	}
	@media (max-width: 600px) {
		.container {
			padding: 1rem;
		}

		.app-title {
			font-size: 2.5rem;
		}
	}
</style>
