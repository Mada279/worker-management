const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./workers.db');

// حذف الجدول إذا كان موجودًا وإعادة إنشائه (للحل المؤقت)
db.serialize(() => {
    db.run("DROP TABLE IF EXISTS workers", (err) => {
        if (err) console.error('Error dropping table:', err.message);
    });
    db.run(`
        CREATE TABLE workers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            present INTEGER DEFAULT 0,
            dailyWage REAL DEFAULT 0,
            advances REAL DEFAULT 0,
            totalEarnings REAL DEFAULT 0
        )
    `, (err) => {
        if (err) {
            console.error('Error creating table:', err.message);
        } else {
            console.log('Workers table created or exists');
        }
    });
});

module.exports = db;