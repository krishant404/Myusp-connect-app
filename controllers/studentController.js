// ✅ UPDATED studentController.js (complete file)
const pool = require('../models/db');

// 🧾 View invoice
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

// 🎓 View grades
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

// 📚 View program audit
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

const getFullAudit = async (req, res) => {
  const studentId = req.params.id;

  try {
    // Get student's program
    const studentResult = await pool.query(
      'SELECT student_id, first_name, last_name, program_title, program_year FROM students WHERE student_id = $1',
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const programTitle = studentResult.rows[0].program_title;

    // Get all units in the student's program
    const unitsResult = await pool.query(
      `SELECT 
         u.unit_code,
         u.title,
         u.year_offered,
         u.semester_offered,
         pr.pre_req_unit_code
       FROM units u
       LEFT JOIN prerequisites pr ON u.unit_code = pr.unit_code
       WHERE u.program_title = $1
       ORDER BY u.year_offered, u.semester_offered`,
      [programTitle]
    );

    // Get all registered units for the student
    const registeredResult = await pool.query(
      `SELECT unit_code FROM registered_units WHERE student_id = $1`,
      [studentId]
    );
    const registeredCodes = registeredResult.rows.map(row => row.unit_code);

    // Build final unit list
    const auditUnits = unitsResult.rows.map(unit => ({
      ...unit,
      isRegistered: registeredCodes.includes(unit.unit_code),
      isPrerequisite: !!unit.pre_req_unit_code
    }));

   res.json({
  student: studentResult.rows[0],
  units: auditUnits
});

  } catch (err) {
    console.error('Error fetching audit:', err.message);
    res.status(500).json({ error: 'Error fetching audit' });
  }
};


// 📜 View unit history
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

// 📋 Get student details
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

// 🧾 Register units
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

// 🔍 Fetch eligible units based on student program, year and semester
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
  getFullAudit, 

};
