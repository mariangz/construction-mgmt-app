let db = null;

async function getDb() {
	if (!db) {
		// we’re in the browser?
		if (typeof window !== 'undefined') {
			// only import PouchDB on the browser
			const { default: PouchDB } = await import('pouchdb-browser');
			db = new PouchDB('construction-tasks');
		} else {
			throw new Error();
		}
	}
	return db;
}

export const taskDatabase = {
	async addTask(task) {
		try {
			// get the database instance
			const db = await getDb();

			const now = new Date().toISOString();
			const doc = {
				_id: now + '-' + Math.random().toString(36).slice(2),
				type: 'task',
				title: task.title,
				date: task.date,
				description: task.description,
				status: 'open',
				assignedTo: task.assignedTo || null,
				createdAt: now,
				updatedAt: now,
				createdBy: 'admin'
			};

			const result = await db.put(doc);
			console.log('Task saved offline:', doc);
			return result;
		} catch (error) {
			console.error('Error adding task:', error);
			throw error;
		}
	},
	async addReport(report) {
		try {
			// get the database instance
			const db = await getDb();

			const now = new Date().toISOString();
			const doc = {
				_id: now + '-' + Math.random().toString(36).slice(2),
				type: 'report',
				title: report.title,
				description: report.description,
				reportType: report.reportType,
				location: report.location,
				assignedTo: report.assignedTo || null,
				priority: report.priority || 'medium',
				status: report.status || 'draft',
				dueDate: report.dueDate || null,
				materials: report.materials || null,
				findings: report.findings || null,
				recommendations: report.recommendations || null,
				createdAt: now,
				updatedAt: now,
				createdBy: 'admin'
			};

			const result = await db.put(doc);
			console.log('Report saved offline:', doc);
			return result;
		} catch (error) {
			console.error('Error adding report:', error);
			throw error;
		}
	},
	async getAllTasks() {
		try {
			const db = await getDb();
			const result = await db.allDocs({
				include_docs: true
			});
			console.log(result);

			return result.rows.map((row) => row.doc);
		} catch (error) {
			console.error('Error fetching tasks:', error);
			throw error;
		}
	},
	async getTask(id) {
		try {
			const db = await getDb();
			const doc = await db.get(id);
			return doc;
		} catch (error) {
			console.error('Error fetching task:', error);
			throw error;
		}
	},
	async deleteTask(id) {
		try {
			const db = await getDb();
			const doc = await db.get(id);
			const result = await db.remove(doc);
			console.log('Task deleted:', id);
			return result;
		} catch (error) {
			console.error('Error deleting task:', error);
			throw error;
		}
	},
	// sync with couchdb
	async liveSync(remoteUrl) {
		const db = await getDb();
		db.sync(remoteUrl, {
			live: true,
			retry: true
		});
	}
};
