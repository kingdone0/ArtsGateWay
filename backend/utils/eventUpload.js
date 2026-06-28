const multer = require('multer');
const path = require('path');
const fs = require('fs');
const identityDir = path.join(__dirname, '../uploads/identity');
const proofsDir = path.join(__dirname, '../uploads/proofs');
if (!fs.existsSync(identityDir)) fs.mkdirSync(identityDir, { recursive: true });
if (!fs.existsSync(proofsDir)) fs.mkdirSync(proofsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'identityDocument') {
      cb(null, identityDir);
    } else if (file.fieldname === 'proofDocument') {
      cb(null, proofsDir);
    } else {
      cb(null, path.join(__dirname, '../uploads'));
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    let prefix = file.fieldname === 'identityDocument' ? 'identity' : 
                 file.fieldname === 'proofDocument' ? 'proof' : 'event';
    cb(null, `${prefix}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const uploadEventMiddleware = (req, res, next) => {
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'identityDocument', maxCount: 1 },
    { name: 'proofDocument', maxCount: 1 }
  ])(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    
    if (req.files?.image) {
      req.body.imageUrl = `/uploads/${req.files.image[0].filename}`;
    }
    if (req.files?.identityDocument) {
      req.body.identityDocument = `/uploads/identity/${req.files.identityDocument[0].filename}`;
    }
    if (req.files?.proofDocument) {
      req.body.proofDocument = `/uploads/proofs/${req.files.proofDocument[0].filename}`;
    }
    next();
  });
};

module.exports = uploadEventMiddleware;