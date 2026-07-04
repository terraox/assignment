import pool from './src/config/db';

async function updateSchema() {
  try {
    // Check if column exists
    const [columns]: any = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'task_management' 
      AND TABLE_NAME = 'tasks' 
      AND COLUMN_NAME = 'completed_at'
    `);

    if (columns[0].count === 0) {
      await pool.query('ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP NULL DEFAULT NULL');
      console.log('✅ Added completed_at column to tasks table.');
    } else {
      console.log('ℹ️ completed_at column already exists.');
    }

    // Set completed_at for existing completed tasks (set it to 1 day before due_date for dummy data purposes)
    await pool.query(`
      UPDATE tasks 
      SET completed_at = DATE_SUB(due_date, INTERVAL 1 DAY) 
      WHERE status = 'Completed' AND completed_at IS NULL
    `);
    console.log('✅ Updated existing completed tasks with a completed_at timestamp.');

  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    process.exit(0);
  }
}

updateSchema();
