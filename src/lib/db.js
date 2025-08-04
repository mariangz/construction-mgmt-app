import { v4 as uuidv4 } from 'uuid';
// all local database operations using PouchDB
let db = null;
let indexCreated = false;

async function getDb() {
	if (!db) {
		// check if we're running in the browser
		if (typeof window !== 'undefined') {
			// dynamic import, only load PouchDB in browser
			const PouchDB = (await import('pouchdb-browser')).default;
			const PouchDBFind = (await import('pouchdb-find')).default;

			// add the find plugin
			PouchDB.plugin(PouchDBFind);

			// create local database 'construction-app'
			db = new PouchDB('construction-app');

			// if the index hasn't been created, create it
			if (!indexCreated) {
				await createTypeIndex();
				indexCreated = true;
			}
		} else {
			// database not available
			throw new Error('Database not available during SSR');
		}
	}
	return db;
}

// index on type field function
async function createTypeIndex() {
	try {
		const db = await getDb();
		await db.createIndex({
			index: {
				fields: ['synced']
			}
		});
		console.log('Type index created successfully');
	} catch (error) {
		console.log('Type index error creating:', error.message);
	}
}

// get display name from localStorage settings
function getDisplayName() {
	try {
		const stored = localStorage.getItem('couchdb-settings');
		if (stored) {
			const settings = JSON.parse(stored);
			return settings.displayName || 'Unknown User';
		}
	} catch (error) {
		console.error('Error getting display name:', error);
	}
	return 'Unknown User';
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

			// create task document (no _id, the db will generate it)
			const doc = {
				_id: `task:${uuidv4()}`,
				type: 'task', // document type for filtering for the view
				title: task.title,
				date: task.date,
				description: task.description,
				status: 'open', // default status for new tasks
				assignedTo: task.assignedTo || null,
				synced: false,
				createdAt: now,
				updatedAt: now,
				createdBy: getDisplayName()
			};

			// save to PouchDB using put() with a generated _id
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
	// add a new report to the database
	async addReport(report) {
		try {
			// get the database instance
			const db = await getDb();

			// generate timestamp for record creation
			const now = new Date().toISOString();

			// create report document (no _id, the db will generate it)
			const doc = {
				_id: `report:${uuidv4()}`,
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
				findings: report.findings || null, // optional
				recommendations: report.recommendations || null,
				synced: false,
				createdAt: now,
				updatedAt: now,
				createdBy: getDisplayName()
			};

			// save to PouchDB using put() with a generated _id
			const result = await db.put(doc);
			console.log('Report saved offline:', doc);
			return result;
		} catch (error) {
			console.error('Error adding report:', error);
			throw error;
		}
	},

	// get all tasks from the database
	async getAllTasks() {
		try {
			const db = await getDb();
			const result = await db.allDocs({
				include_docs: true,
				startkey: 'task:',
				endkey: 'task:\uffff'
			});

			console.log('all tasks', result);
			return result.rows.map(row => row.doc);
		} catch (error) {
			console.error('Error fetching tasks:', error);
			throw error;
		}
	},

	// get paginated tasks
	async getTasksPage({ limit = 10, startAfter = null } = {}) {
		const db = await getDb();

		const options = {
			include_docs: true,
			startkey: startAfter || 'task:',
			endkey: 'task:\uffff',
			limit
		};

		if (startAfter) {
			options.skip = 1;
			options.startkey = startAfter;
		}

		const result = await db.allDocs(options);
		return result.rows.map(row => row.doc);
	},

	// get all reports from the database
	async getAllReports() {
		try {
			const db = await getDb();
			const result = await db.allDocs({
				include_docs: true,
				startkey: 'report:',
				endkey: 'report:\uffff'
			});
			console.log('all reports', result);
			return result.rows.map(row => row.doc);
		} catch (error) {
			console.error('Error fetching reports:', error);
			throw error;
		}
	},

	// get paginated reports
	async getReportsPage({ limit = 10, startAfter = null } = {}) {
		const db = await getDb();

		const options = {
			include_docs: true,
			startkey: startAfter || 'report:',
			endkey: 'report:\uffff',
			limit
		};

		if (startAfter) {
			options.skip = 1;
			options.startkey = startAfter;
		}

		const result = await db.allDocs(options);
		return result.rows.map(row => row.doc);
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

	// update a document by id
	async updateDocument(doc) {
		try {
			const db = await getDb();

			// update timestamp
			doc.updatedAt = new Date().toISOString();

			// save changes
			const result = await db.put(doc);
			console.log('Document updated:', result);
			return result;
		} catch (error) {
			console.error('Error updating document:', error);
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
	// upload any local changes to remote, download any remote changes to local
	async syncOnce(remoteUrl) {
		const db = await getDb();
		return db
			.sync(remoteUrl)
			.on('change', async (info) => {
				console.log('Sync change:', info);
				// mark documents as synced when they are synced, use bulkDocs to update multiple documents at once
				const docsToUpdate = info.change.docs
				.filter(doc => (doc.type === 'task' || doc.type === 'report') && !doc.synced)
				.map(doc => ({
					...doc,
					synced: true,
					updatedAt: new Date().toISOString()
				}))
				if (docsToUpdate.length > 0) {
					console.log('Updating docs to synced:', docsToUpdate);
					await db.bulkDocs(docsToUpdate);
				}
			})
			.on('complete', (info) => {
				console.log('Sync completed:', info);
			})
			.on('error', (err) => {
				console.error('Sync error:', err);
			});
	},

	// get the number of unsynced documents for each type
	async getUnsyncedCounts() {
		const db = await getDb();
		const result = await db.find({
			selector: {
				synced: false
			}
		});
		console.log('unsynced docs', result);
		let tasks = 0;
		let reports = 0;

		for (const doc of result.docs) {
			if (doc.type === 'task') tasks++;
			if (doc.type === 'report') reports++;
		}

		return { tasks, reports };
	}
};
