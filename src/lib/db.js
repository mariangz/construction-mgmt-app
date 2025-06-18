let db = null;

async function getDb() {
	if (!db) {
	const { default: PouchDB } = await import('pouchdb');
		db = new PouchDB('construction-tasks');
	}
	return db;
}

export const taskDatabase = {
	async addTask(task) {
		try {
			const db = await getDb();

			const doc = {
				_id: new Date().toISOString(),
				title: task.title,
				date: task.date,
				description: task.description
			};

			const result = await db.put(doc);
			console.log('Task saved offline:', doc);
			return result;
		} catch (error) {
			console.error('Error adding task:', error);
			throw error;
		}
	}
};
