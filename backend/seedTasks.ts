import pool from './src/config/db';

async function seed() {
  try {
    // Check if any employees exist
    const [employees]: any = await pool.query('SELECT id FROM employees LIMIT 1');
    const empId = employees.length > 0 ? employees[0].id : null;

    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const lastWeek = new Date(today); lastWeek.setDate(lastWeek.getDate() - 7);
    const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const dummyTasks = [
      { title: 'Update Dashboard UI', priority: 'High', status: 'Completed', start: formatDate(lastWeek), due: formatDate(yesterday) },
      { title: 'Fix Login Bug', priority: 'Medium', status: 'Completed', start: formatDate(lastWeek), due: formatDate(today) },
      { title: 'Write API Documentation', priority: 'Low', status: 'Completed', start: formatDate(lastWeek), due: formatDate(today) },
      { title: 'Migrate Database', priority: 'High', status: 'In Progress', start: formatDate(yesterday), due: formatDate(nextWeek) },
      { title: 'Implement File Uploads', priority: 'Medium', status: 'In Progress', start: formatDate(today), due: formatDate(tomorrow) },
      { title: 'Create Admin Reports', priority: 'High', status: 'Pending', start: formatDate(tomorrow), due: formatDate(nextWeek) },
      { title: 'Design Notification System', priority: 'Medium', status: 'Pending', start: formatDate(today), due: formatDate(nextWeek) },
      { title: 'Setup CI/CD Pipeline', priority: 'High', status: 'Overdue', start: formatDate(lastWeek), due: formatDate(yesterday) },
      { title: 'Audit Security Logs', priority: 'High', status: 'Overdue', start: formatDate(lastWeek), due: formatDate(lastWeek) },
      { title: 'Employee Onboarding', priority: 'Low', status: 'Pending', start: formatDate(tomorrow), due: formatDate(nextWeek) },
    ];

    for (const task of dummyTasks) {
      await pool.query(
        `INSERT INTO tasks (title, description, priority, status, start_date, due_date, assigned_employee_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [task.title, `Dummy description for ${task.title}`, task.priority, task.status, task.start, task.due, empId]
      );
    }
    console.log(`✅ Successfully seeded ${dummyTasks.length} tasks!`);
  } catch (error) {
    console.error('Error seeding tasks:', error);
  } finally {
    process.exit(0);
  }
}

seed();
