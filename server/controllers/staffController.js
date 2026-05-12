const db         = require('../config/db');
const xlsx        = require('xlsx');
const csv         = require('csv-parser');
const fs          = require('fs');
const path        = require('path');
const { Readable } = require('stream');

// ─── Helper: sanitize a staff row ──────────────────────────────────────────
function sanitizeRow(row) {
  const keys = Object.keys(row);
  const get = (patterns) => {
    // 1. Try exact/trimmed/case-insensitive match
    for (let p of patterns) {
      const found = keys.find(k => k.trim().toLowerCase() === p.toLowerCase());
      if (found && row[found] !== undefined && row[found] !== null) return String(row[found]).trim();
    }
    // 2. Try partial match
    for (let p of patterns) {
      const found = keys.find(k => k.toLowerCase().includes(p.toLowerCase()));
      if (found && row[found] !== undefined && row[found] !== null) return String(row[found]).trim();
    }
    return '';
  };

  // Fallback for xlsx if keys are __EMPTY_0, etc.
  const getByIndex = (idx) => {
    const key = keys[idx] || `__EMPTY_${idx}`;
    return row[key] ? String(row[key]).trim() : '';
  };

  let name = get(['staff_name', 'staff name', 'name', 'full name', 'employee name']);
  if (!name && keys.length > 0) name = getByIndex(0); // Fallback to 1st column

  let dept = get(['department', 'dept', 'unit', 'division']);
  if (!dept && keys.length > 1) dept = getByIndex(1); // Fallback to 2nd column

  return {
    staff_name:    name,
    department:    dept,
    designation:   get(['designation', 'role', 'pos', 'rank']) || getByIndex(2),
    extension_no:  get(['extension_no', 'extension', 'ext'])  || getByIndex(3) || null,
    did:           get(['did'])                                || getByIndex(4) || null,
    direct_number: get(['direct_number', 'direct', 'direct no']) || getByIndex(5) || null,
    mobile_number: get(['mobile_number', 'mobile', 'phone'])     || getByIndex(6) || null,
  };
}

// ─── GET /api/staff/departments ───────────────────────────────────────────
exports.getDepartments = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT DISTINCT dept AS name FROM (
        SELECT name AS dept FROM departments
        UNION
        SELECT department AS dept FROM staff
        WHERE COALESCE(TRIM(department), '') <> ''
      ) AS u
      ORDER BY dept
    `);
    return res.json({ success: true, data: rows.map(r => r.name) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch departments.' });
  }
};

// ─── POST /api/staff/departments ──────────────────────────────────────────
exports.addDepartment = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
  try {
    await db.query('INSERT IGNORE INTO departments (name) VALUES (?)', [name]);
    const [rows] = await db.query('SELECT name FROM departments ORDER BY name');
    return res.json({ success: true, message: 'Department added', data: rows.map(r => r.name) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to add department' });
  }
};

// ─── DELETE /api/staff/departments ────────────────────────────────────────
exports.removeDepartment = async (req, res) => {
  const { name } = req.params;
  try {
    await db.query('DELETE FROM departments WHERE name = ?', [name]);
    const [rows] = await db.query('SELECT name FROM departments ORDER BY name');
    return res.json({ success: true, message: 'Department removed', data: rows.map(r => r.name) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to remove department' });
  }
};

// ─── GET /api/staff  (search + paginate) ───────────────────────────────────
exports.search = async (req, res) => {
  const {
    q = '',
    department = '',
    page      = 1,
    limit     = 20,
    sortBy    = 'staff_name',
    order     = 'ASC',
  } = req.query;

  const pageNum  = Math.max(1, parseInt(page));
  const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
  const offset   = (pageNum - 1) * pageSize;

  const allowedSort  = ['staff_name','department','designation','extension_no','did','direct_number','mobile_number'];
  const allowedOrder = ['ASC','DESC'];
  const safeSort  = allowedSort.includes(sortBy)  ? sortBy  : 'staff_name';
  const safeOrder = allowedOrder.includes(order.toUpperCase()) ? order.toUpperCase() : 'ASC';

  try {
    let countQuery, dataQuery, params;

    if (q.trim()) {
      // Full-text search
      const searchTerm = q.trim();
      countQuery = `
        SELECT COUNT(*) AS total FROM staff
        WHERE MATCH(staff_name, department, designation, extension_no, did, direct_number, mobile_number)
              AGAINST (? IN BOOLEAN MODE)
           OR staff_name    LIKE ?
           OR department    LIKE ?
           OR designation   LIKE ?
           OR extension_no  LIKE ?
           OR did           LIKE ?
           OR direct_number LIKE ?
           OR mobile_number LIKE ?
      `;
      dataQuery = `
        SELECT * FROM staff
        WHERE MATCH(staff_name, department, designation, extension_no, did, direct_number, mobile_number)
              AGAINST (? IN BOOLEAN MODE)
           OR staff_name    LIKE ?
           OR department    LIKE ?
           OR designation   LIKE ?
           OR extension_no  LIKE ?
           OR did           LIKE ?
           OR direct_number LIKE ?
           OR mobile_number LIKE ?
        ORDER BY ${safeSort} ${safeOrder}
        LIMIT ? OFFSET ?
      `;
      const like = `%${searchTerm}%`;
      const ftTerm = `*${searchTerm}*`;
      params = [ftTerm, like, like, like, like, like, like, like];

      const [[{ total }]] = await db.query(countQuery, params);
      const [rows]        = await db.query(dataQuery, [...params, pageSize, offset]);

      return res.json({ success: true, total, page: pageNum, limit: pageSize, data: rows });

    } else if (department.trim()) {
      // Department filter
      const like = `%${department.trim()}%`;
      countQuery = 'SELECT COUNT(*) AS total FROM staff WHERE department LIKE ?';
      dataQuery  = `SELECT * FROM staff WHERE department LIKE ? ORDER BY ${safeSort} ${safeOrder} LIMIT ? OFFSET ?`;

      const [[{ total }]] = await db.query(countQuery, [like]);
      const [rows]        = await db.query(dataQuery, [like, pageSize, offset]);

      return res.json({ success: true, total, page: pageNum, limit: pageSize, data: rows });

    } else {
      // All records
      const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM staff');
      const [rows]        = await db.query(
        `SELECT * FROM staff ORDER BY ${safeSort} ${safeOrder} LIMIT ? OFFSET ?`,
        [pageSize, offset]
      );

      return res.json({ success: true, total, page: pageNum, limit: pageSize, data: rows });
    }
  } catch (err) {
    console.error('Search error:', err);
    return res.status(500).json({ success: false, message: 'Search failed.' });
  }
};

// ─── GET /api/staff/:id ────────────────────────────────────────────────────
exports.getOne = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM staff WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Staff not found.' });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch staff.' });
  }
};

// ─── POST /api/staff ────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  const row = sanitizeRow(req.body);

  if (!row.staff_name) {
    return res.status(400).json({ success: false, message: 'Staff name is required.' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO staff (staff_name, department, designation, extension_no, did, direct_number, mobile_number)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [row.staff_name, row.department, row.designation, row.extension_no, row.did, row.direct_number, row.mobile_number]
    );
    return res.status(201).json({ success: true, id: result.insertId, message: 'Staff added successfully.' });
  } catch (err) {
    console.error('Create error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create staff.' });
  }
};

// ─── PUT /api/staff/:id ────────────────────────────────────────────────────
exports.update = async (req, res) => {
  const row = sanitizeRow(req.body);

  if (!row.staff_name) {
    return res.status(400).json({ success: false, message: 'Staff name is required.' });
  }

  try {
    const [result] = await db.query(
      `UPDATE staff SET staff_name=?, department=?, designation=?, extension_no=?, did=?, direct_number=?, mobile_number=?
       WHERE id=?`,
      [row.staff_name, row.department, row.designation, row.extension_no, row.did, row.direct_number, row.mobile_number, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Staff not found.' });
    return res.json({ success: true, message: 'Staff updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update staff.' });
  }
};

// ─── DELETE /api/staff/:id ─────────────────────────────────────────────────
exports.remove = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM staff WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Staff not found.' });
    return res.json({ success: true, message: 'Staff deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete staff.' });
  }
};

// ─── POST /api/staff/bulk-upload ───────────────────────────────────────────
exports.bulkUpload = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  const filePath = req.file.path;
  const ext      = path.extname(req.file.originalname).toLowerCase();
  let records    = [];

  try {
    if (ext === '.xlsx' || ext === '.xls') {
      // ── Excel parsing
      const workbook  = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet     = workbook.Sheets[sheetName];
      records         = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    } else if (ext === '.csv') {
      // ── CSV parsing
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', row => records.push(row))
          .on('end', resolve)
          .on('error', reject);
      });

    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ success: false, message: 'Only .xlsx, .xls, or .csv files are supported.' });
    }

    // ── Cleanup temp file
    fs.unlinkSync(filePath);

    if (!records.length) {
      return res.status(400).json({ success: false, message: 'File is empty or has no valid rows.' });
    }

    // ── Bulk insert with duplicate handling
    let inserted = 0, skipped = 0, errors = [];

    for (let i = 0; i < records.length; i++) {
      const row = sanitizeRow(records[i]);
      if (!row.staff_name) {
        skipped++;
        errors.push(`Row ${i + 2}: Missing staff name.`);
        continue;
      }

      try {
        await db.query(
          `INSERT INTO staff (staff_name, department, designation, extension_no, did, direct_number, mobile_number)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             department    = VALUES(department),
             designation   = VALUES(designation),
             extension_no  = VALUES(extension_no),
             did           = VALUES(did),
             direct_number = VALUES(direct_number),
             mobile_number = VALUES(mobile_number)`,
          [row.staff_name, row.department, row.designation, row.extension_no, row.did, row.direct_number, row.mobile_number]
        );
        inserted++;
      } catch (rowErr) {
        skipped++;
        errors.push(`Row ${i + 2}: ${rowErr.message}`);
      }
    }

    return res.json({
      success: true,
      message: `Upload complete. ${inserted} records inserted/updated, ${skipped} skipped.`,
      inserted,
      skipped,
      errors: errors.slice(0, 20),
    });

  } catch (err) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    console.error('Bulk upload error:', err);
    return res.status(500).json({ success: false, message: 'File processing failed.' });
  }
};

// ─── GET /api/staff/export ─────────────────────────────────────────────────
exports.exportExcel = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT staff_name, department, designation, extension_no, did, direct_number, mobile_number FROM staff ORDER BY staff_name'
    );

    const wsData = [
      ['Staff Name','Department','Designation','Extension No','DID','Direct','Mobile Number'],
      ...rows.map(r => [r.staff_name, r.department, r.designation, r.extension_no, r.did, r.direct_number, r.mobile_number])
    ];

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.aoa_to_sheet(wsData);
    xlsx.utils.book_append_sheet(wb, ws, 'Staff Directory');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="kochi-metro-staff.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);

  } catch (err) {
    console.error('Export error:', err);
    return res.status(500).json({ success: false, message: 'Export failed.' });
  }
};
