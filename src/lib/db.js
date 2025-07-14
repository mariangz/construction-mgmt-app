// all local database operations using PouchDB
let db = null;

async function getDb() {
	if (!db) {
		// check if we're running in the browser
		if (typeof window !== 'undefined') {
			// dynamic import, only load PouchDB in browser
			const { default: PouchDB } = await import('pouchdb-browser');
			// create local database 'construction-app'
			db = new PouchDB('construction-app');
		} else {
			// database not available
			throw new Error('Database not available during SSR');
		}
	}
	return db;
}

	// mark a document as synced
	async function markAsSynced(doc) {
		const db = await getDb();
		doc.synced = true;
		doc.updatedAt = new Date().toISOString();
		await db.put(doc);
	}

// export object with all database operations
// tasks
export const appDatabase = {
	async addTask(task) {
		try {
			// get the database instance
			const db = await getDb();

			// generate timestamp for record creation
			const now = new Date().toISOString();

			// create task document
			const doc = {
				_id: now + '-' + Math.random().toString(36).slice(2),
				type: 'task', // document type for filtering for the view
				title: task.title,
				date: task.date,
				description: task.description,
				status: 'open', // default status for new tasks
				assignedTo: task.assignedTo || null,
				synced: false,
				createdAt: now,
				updatedAt: now,
				createdBy: 'admin' // default
			};

			// save to PouchDB
			const result = await db.put(doc);
			console.log('Task saved offline:', doc);
			console.log('result', result);
			return result;
		} catch (error) {
			console.error('Error adding task:', error);
			throw error;
		}
	},

	// reports
	// sdd a new report to the database
	async addReport(report) {
		try {
			// get the database instance
			const db = await getDb();

			// generate timestamp for record creation
			const now = new Date().toISOString();

			// create  report document
			const doc = {
				_id: now + '-' + Math.random().toString(36).slice(2),
				type: 'report', // document type
				title: report.title,
				description: report.description,
				reportType: report.reportType, // inspection, progress, safety, etc.
				location: report.location,
				assignedTo: report.assignedTo || null,
				priority: report.priority || 'medium', // low, medium, high, urgent
				status: report.status || 'draft', // draft, completed, submitted
				dueDate: report.dueDate || null,
				materials: report.materials || null, // optional
				recommendations: report.recommendations || null,
				synced: false,
				createdAt: now,
				updatedAt: now,
				createdBy: 'admin' // default
			};

			// save to PouchDB
			const result = await db.put(doc);
			console.log('Report saved offline:', doc);
			return result;
		} catch (error) {
			console.error('Error adding report:', error);
			throw error;
		}
	},

	// get all documents from the database (tasks, reports, etc)
	async getAllTasks() {
		try {
			const db = await getDb();

			// get all documents with their content
			const result = await db.allDocs({
				include_docs: true //  full document with all fields
			});
			console.log(result);

			return result.rows.map((row) => row.doc);
		} catch (error) {
			console.error('Error fetching tasks:', error);
			throw error;
		}
	},

	// get a single document by id
	async getDocument(id) {
		try {
			const db = await getDb();
			const doc = await db.get(id);
			return doc;
		} catch (error) {
			console.error('Error fetching task:', error);
			throw error;
		}
	},

	// delete a document (task, report, etc) by id
	async deleteDocument(id) {
		try {
			const db = await getDb();

			// first get the document (needed for PouchDB deletion)
			const doc = await db.get(id);

			// .remove() deletes the document
			const result = await db.remove(doc);
			console.log('Task deleted:', id);
			return result;
		} catch (error) {
			console.error('Error deleting task:', error);
			throw error;
		}
	},

	// sync local PouchDB with remote CouchDB: 
	// upload any local changes to remote, dwnload any remote changes to local
	async liveSync(remoteUrl) {
		const db = await getDb();
		db.sync(remoteUrl, {
			live: true, // continuous sync
			retry: true // automatically retry if connection fails
		}).on('change', async (info) => {
			console.log('Sync change:', info);
			// mark documents as synced when they are synced
			if (info.change?.docs) {
				for (const change of info.change.docs) {
					if ((change.type === 'task' || change.type === 'report') && !change.synced) {
						await markAsSynced(change);
					}
				}
			}
		});
	}
};
