const express = require('express');
const multer  = require('multer');
const path    = require('path');
const router  = express.Router();
const staff   = require('../controllers/staffController');
const auth    = require('../middleware/auth');

// ── RBAC Middleware
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Forbidden: Admin access required.' });
};

// ── Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename:    (req, file, cb) => cb(null, `upload_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

// ── Public routes (Accessible by both admin and staff)
router.get('/departments',       auth, staff.getDepartments);
router.get('/export',            auth, staff.exportExcel);
router.get('/',                  auth, staff.search);
router.get('/:id',               auth, staff.getOne);

// ── Protected routes (Admin only)
router.post('/departments',      auth, isAdmin, staff.addDepartment);
router.delete('/departments/:name', auth, isAdmin, staff.removeDepartment);
router.post('/bulk-upload',      auth, isAdmin, upload.single('file'), staff.bulkUpload);
router.post('/',            auth, isAdmin, staff.create);
router.put('/:id',          auth, isAdmin, staff.update);
router.delete('/:id',       auth, isAdmin, staff.remove);

module.exports = router;
