const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdfController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Home Page
router.get('/', pdfController.index);

// Split PDF
router.get('/split', pdfController.splitPage);
router.post('/split', upload.single('pdf'), processMiddleware(pdfController.processSplit));

// Merge PDF
router.get('/merge', pdfController.mergePage);
router.post('/merge', upload.array('pdfs', 10), processMiddleware(pdfController.processMerge));

// Image to PDF
router.get('/image-to-pdf', pdfController.imgToPdfPage);
router.post('/image-to-pdf', upload.array('images', 20), processMiddleware(pdfController.processImgToPdf));

// Rearrange PDF
router.get('/rearrange', pdfController.rearrangePage);
router.post('/rearrange', upload.single('pdf'), processMiddleware(pdfController.processRearrange));

// PDF to Image
router.get('/pdf-to-image', pdfController.pdfToImgPage);
router.post('/pdf-to-image', upload.single('pdf'), processMiddleware(pdfController.processPdfToImg));

// Middleware wrapper to handle errors or async
function processMiddleware(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = router;
