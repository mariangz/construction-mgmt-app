<script>
	import { onMount } from 'svelte';
	import { taskDatabase } from '$lib/db';

  const remoteUrl = 'http://admin:admin@localhost:5984/construction-app';
  onMount(() => {
		taskDatabase.liveSync(remoteUrl);
	});
</script>

<main class="container">
	<h1>Construction App</h1>
	<nav>
		<ul>
			<li><a href="/tasks">📝 View All Tasks</a></li>
			<li><a href="/new">➕ Add New Task</a></li>
		</ul>
	</nav>
</main>
