const pool = require('../models/db');

const bcrypt = require('bcrypt');

const createStudent = async (req, res) => {
  const {
    student_id,
    password,
    first_name,
    last_name,
    email,
    address,
    phone,
    program_id
  } = req.body;

  try {
    // Check if student already exists
    const check = await pool.query('SELECT * FROM students WHERE student_id = $1', [student_id]);
    if (check.rows.length > 0) {
      return res.status(400).json({ message: 'Student already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert student
    await pool.query(
      `INSERT INTO students
       (student_id, password, first_name, last_name, email, address, phone, program_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [student_id, hashedPassword, first_name, last_name, email, address, phone, program_id]
    );

    res.json({ message: 'Student created successfully' });
  } catch (err) {
    console.error('Error creating student:', err.message);
    res.status(500).json({ error: 'Error creating student' });
  }
};



// 🧾 Update Invoice OR Insert if it doesn't exist
const updateInvoice = async (req, res) => {
  const { studentId } = req.params;
  const { total_fees, amount_paid, holds } = req.body;

  try {
    const check = await pool.query(
      'SELECT * FROM invoice WHERE student_id = $1',
      [studentId]
    );

    if (check.rows.length > 0) {
      // Update existing invoice
      await pool.query(
        `UPDATE invoice
         SET total_fees = $1, amount_paid = $2, holds = $3
         WHERE student_id = $4`,
        [total_fees, amount_paid, holds, studentId]
      );

      res.json({ message: 'Invoice updated successfully' });
    } else {
      // Insert new invoice record
      await pool.query(
        `INSERT INTO invoice (student_id, total_fees, amount_paid, holds)
         VALUES ($1, $2, $3, $4)`,
        [studentId, total_fees, amount_paid, holds]
      );

      res.json({ message: 'Invoice created successfully' });
    }
  } catch (err) {
    console.error('Error updating invoice:', err.message);
    res.status(500).json({ error: 'Error updating or inserting invoice' });
  }
};

// 🎓 Update Grade OR Insert if it doesn't exist

/**
 * Updates or inserts a grade for a student.
 *
 * This function checks if a grade record exists for the given student and unit.
 * If a record is found, it updates the record with the new grade, semester, and year.
 * Otherwise, it inserts a new grade record.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.params - The request parameters.
 * @param {string} req.params.studentId - Identifier for the student.
 * @param {string} req.params.unitId - Identifier for the unit.
 * @param {Object} req.body - The request body containing grade details.
 * @param {number|string} req.body.grade - Grade to be assigned.
 * @param {string} req.body.semester - Semester associated with the grade.
 * @param {number|string} req.body.year - Year associated with the grade.
 * @param {Object} res - Express response object.
 * @returns {void} Responds with a JSON message indicating success or error.
 */
const updateGrade = async (req, res) => {
  const { studentId, unitId } = req.params;
  const { grade, semester, year } = req.body;

  try {
    const check = await pool.query(
      `SELECT * FROM grades WHERE student_id = $1 AND unit_id = $2`,
      [studentId, unitId]
    );

    if (check.rows.length > 0) {
      // Update the existing grade record
      await pool.query(
        `UPDATE grades
         SET grade = $1, semester = $2, year = $3
         WHERE student_id = $4 AND unit_id = $5`,
        [grade, semester, year, studentId, unitId]
      );

      res.json({ message: 'Grade updated successfully' });
    } else {
      // Insert a new grade record
      await pool.query(
        `INSERT INTO grades (unit_id, student_id, semester, year, grade)
         VALUES ($1, $2, $3, $4, $5)`,
        [unitId, studentId, semester, year, grade]
      );

      res.json({ message: 'Grade created successfully' });
    }
  } catch (err) {
    console.error('Error updating grade:', err.message);
    res.status(500).json({ error: 'Error updating or inserting grade' });
  }
};

// ➕ Create Program
const createProgram = async (req, res) => {
  const { title, description, program_year } = req.body;

  try {
    await pool.query(
      `INSERT INTO programs (title, description, program_year)
       VALUES ($1, $2, $3)`,
      [title, description, program_year]
    );

    res.json({ message: 'Program created successfully' });
  } catch (err) {
    console.error('Error creating program:', err.message);
    res.status(500).json({ error: 'Error creating program' });
  }
};

// ➕ Create Unit
const createUnit = async (req, res) => {
  const { title, unit_code, description, semester_offered, unit_fee, program_id } = req.body;

  try {
    await pool.query(
      `INSERT INTO units (title, unit_code, description, semester_offered, unit_fee, program_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [title, unit_code, description, semester_offered, unit_fee, program_id]
    );

    res.json({ message: 'Unit created successfully' });
  } catch (err) {
    console.error('Error creating unit:', err.message);
    res.status(500).json({ error: 'Error creating unit' });
  }
};

module.exports = {
  updateInvoice,
  updateGrade,
  createStudent,
  createProgram,
  createUnit
};
