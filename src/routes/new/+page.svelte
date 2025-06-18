<script>
	import { taskDatabase } from '$lib/db';

	let taskTitle = '';
	let date = '';
	let description = '';

	async function handleSubmit(event) {
		event.preventDefault();
		console.log('Task saved offline:');

		try {
			await taskDatabase.addTask({

				title: taskTitle,
				date: date,
				description: description
			});

			alert('Task saved offline!');

			taskTitle = '';
			date = '';
			description = '';
		}
		catch(error){
			console.error(error);
		}
	}
</script>

<main class="container">
	<h1>Add New Task</h1>

	<form onsubmit={handleSubmit}>
		<label for="taskTitle">
			Task Title:
			<input
				type="text"
				id="taskTitle"
				name="taskTitle"
				bind:value={taskTitle}
				placeholder="Enter task title"
				required
			/>
		</label>

		<label for="date">
			Date:
			<input type="date" id="date" name="date" bind:value={date} required />
		</label>

		<label for="description">
			Description:
			<textarea
				id="description"
				name="description"
				bind:value={description}
				rows="4"
				placeholder="Enter task description"
				required
			></textarea>
		</label>

		<button type="submit">Save Task</button>
	</form>
</main>
