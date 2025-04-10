/**
 * @file studentController.js
 * @description Handles all student-related API logic including invoice retrieval, 
 * grades, registration, audit, and unit queries.
 */

const pool = require('../models/db');

/**
 * @function getInvoice
 * @description Fetches the invoice for a specific student.
 * @route GET /students/:id/invoice
 * @param {Request} req - Express request object containing student ID as param.
 * @param {Response} res - Express response object for returning invoice data.
 */
const getInvoice = async (req, res) => {
  const studentId = req.params.id;
  try {
    const result = await pool.query(
      'SELECT * FROM invoice WHERE student_id = $1',
      [studentId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching invoice' });
  }
};

/**
 * @function getGrades
 * @description Retrieves all grades for a specific student.
 * @route GET /students/:id/grades
 * @param {Request} req
 * @param {Response} res
 */
const getGrades = async (req, res) => {
  const studentId = req.params.id;
  try {
    const result = await pool.query(
      `SELECT u.title AS unit_name, g.grade, g.semester, g.year
       FROM grades g
       JOIN units u ON g.unit_id = u.id
       WHERE g.student_id = $1`,
      [studentId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching grades' });
  }
};

/**
 * @function getAudit
 * @description Provides a pass/fail audit for each completed unit.
 * @route GET /students/:id/audit
 * @param {Request} req
 * @param {Response} res
 */
const getAudit = async (req, res) => {
  const studentId = req.params.id;
  try {
    const result = await pool.query(
      `SELECT u.title, g.grade,
              CASE
                WHEN g.grade IN ('A', 'B', 'C', 'D') THEN 'Passed'
                ELSE 'Failed'
              END AS status
       FROM grades g
       JOIN units u ON g.unit_id = u.id
       WHERE g.student_id = $1`,
      [studentId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching audit' });
  }
};

/**
 * @function getFullAudit
 * @description Returns a complete unit overview for a student's program including prerequisites and registration status.
 * @route GET /students/:id/full-audit
 * @param {Request} req
 * @param {Response} res
 */
const getFullAudit = async (req, res) => {
  const studentId = req.params.id;

  try {
    const studentResult = await pool.query(
      'SELECT program_title FROM students WHERE student_id = $1',
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const programTitle = studentResult.rows[0].program_title;

    const allUnitsResult = await pool.query(
      `SELECT u.unit_code, u.title, u.year_offered, u.semester_offered,
              CASE WHEN p.unit_id IS NOT NULL THEN true ELSE false END AS is_prerequisite
       FROM units u
       LEFT JOIN prerequisites p ON u.unit_code = p.unit_code
       WHERE u.program_title = $1
       ORDER BY u.year_offered, u.semester_offered`,
      [programTitle]
    );

    const registeredUnitsResult = await pool.query(
      'SELECT unit_code FROM registered_units WHERE student_id = $1',
      [studentId]
    );

    const registeredSet = new Set(registeredUnitsResult.rows.map(row => row.unit_code));

    const result = allUnitsResult.rows.map(unit => ({
      unitCode: unit.unit_code,
      title: unit.title,
      yearOffered: unit.year_offered,
      semesterOffered: unit.semester_offered,
      isPrerequisite: unit.is_prerequisite,
      isRegistered: registeredSet.has(unit.unit_code),
    }));

    res.json(result);
  } catch (err) {
    console.error('Error fetching audit:', err.message);
    res.status(500).json({ error: 'Failed to load full audit' });
  }
};

/**
 * @function getUnitHistory
 * @description Retrieves a student's unit action history.
 * @route GET /students/:id/history
 * @param {Request} req
 * @param {Response} res
 */
const getUnitHistory = async (req, res) => {
  const studentId = req.params.id;
  try {
    const result = await pool.query(
      `SELECT u.title, h.action, h.timestamp
       FROM history h
       JOIN units u ON h.unit_id = u.id
       WHERE h.student_id = $1
       ORDER BY h.timestamp DESC`,
      [studentId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching history' });
  }
};

/**
 * @function getStudentDetails
 * @description Returns core student details including program and year.
 * @route GET /students/:id/details
 * @param {Request} req
 * @param {Response} res
 */
const getStudentDetails = async (req, res) => {
  const studentId = req.params.id;
  try {
    const result = await pool.query(
      'SELECT student_id, first_name, last_name, program_title, program_year FROM students WHERE student_id = $1',
      [studentId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching student details:', err.message);
    res.status(500).json({ error: 'Error fetching student details' });
  }
};

/**
 * @function registerUnits
 * @description Registers a student for up to 4 units per semester, checking for duplicates and existing registrations.
 * @route POST /students/register
 * @param {Request} req - Includes student_id and units array in the body.
 * @param {Response} res
 */
const registerUnits = async (req, res) => {
  const { student_id, units } = req.body;
  try {
    const semesters = {};
    for (const unit of units) {
      if (!semesters[unit.semester]) {
        semesters[unit.semester] = [];
      }
      semesters[unit.semester].push(unit);
    }

    for (const semester in semesters) {
      const newUnits = semesters[semester];

      const existing = await pool.query(
        `SELECT COUNT(*) FROM registered_units WHERE student_id = $1 AND semester = $2`,
        [student_id, semester]
      );

      const existingCount = parseInt(existing.rows[0].count);
      const totalUnits = existingCount + newUnits.length;

      if (totalUnits > 4) {
        return res.status(400).json({
          error: `You can only register for up to 4 units in ${semester}. You already have ${existingCount} units.`,
        });
      }

      for (const unit of newUnits) {
        const duplicateCheck = await pool.query(
          `SELECT * FROM registered_units 
           WHERE student_id = $1 AND unit_code = $2 AND semester = $3`,
          [student_id, unit.unit_code, unit.semester]
        );
      
        if (duplicateCheck.rows.length > 0) {
          return res.status(400).json({
            error: `Unit ${unit.unit_code} has already been registered for ${semester}.`,
          });
        }
      
        await pool.query(
          `INSERT INTO registered_units (student_id, unit_code, semester, program_year)
           VALUES ($1, $2, $3, $4)`,
          [student_id, unit.unit_code, unit.semester, unit.program_year]
        );
      }
    }

    res.json({ message: 'Units registered successfully!' });
  } catch (err) {
    console.error('Error registering units:', err.message);
    res.status(500).json({ error: 'Failed to register units' });
  }
};

/**
 * @function getAvailableUnits
 * @description Fetches all units available to a student based on their current program, year, and semester.
 * @route GET /students/available-units
 * @param {Request} req - Query must include programTitle, yearOffered, semester.
 * @param {Response} res
 */
const getAvailableUnits = async (req, res) => {
  const { programTitle, yearOffered, semester } = req.query;
  try {
    const result = await pool.query(
      `SELECT unit_code, title 
       FROM units 
       WHERE program_title = $1 AND year_offered = $2 AND semester_offered = $3`,
      [programTitle, yearOffered, semester]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching units:', err.message);
    res.status(500).json({ error: 'Error fetching units' });
  }
};

module.exports = {
  getInvoice,
  getGrades,
  getAudit,
  getUnitHistory,
  registerUnits,
  getStudentDetails,
  getAvailableUnits,
  getFullAudit
};
