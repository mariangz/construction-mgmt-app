<script>
	let reports = [
		{ _id: '1', title: 'Pour concrete', date: '2025-06-17', description: 'East site, base layer' },
		{ _id: '2', title: 'Framing', date: '2025-06-15', description: 'North wall structure' },
		{ _id: '3', title: 'Electrical work', date: '2025-06-12', description: 'East site wiring' }
	];

	function openReport(id) {
		alert(`Go to detail view for report ID: ${id}`);
	}
</script>

<main class="container">
	<h1>Task List</h1>

	{#if reports.length === 0}
		<p>No tasks yet. <a href="/new">Create one</a>.</p>
	{:else}
		<ul>
			{#each reports as report}
				<li
					onclick={() => openReport(report._id)}
				>
					<strong>{report.title}</strong><br />
					<small>{report.date}</small><br />
					<p>{report.description}</p>
				</li>
			{/each}
		</ul>
	{/if}
</main>
