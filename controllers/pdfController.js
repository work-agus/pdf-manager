const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const { deleteFile, deleteFiles } = require('../utils/fileHandler');

exports.index = (req, res) => {
    res.render('index', { title: 'PDF Manager - Home' });
};

// --- Split PDF ---

exports.splitPage = (req, res) => {
    res.render('split', { title: 'Split PDF' });
};

exports.processSplit = async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const { range } = req.body; // e.g., "1-3, 5"
    if (!range) {
        deleteFile(req.file.path);
        return res.status(400).send('Page range is required.');
    }

    try {
        const existingPdfBytes = fs.readFileSync(req.file.path);
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const newPdfDoc = await PDFDocument.create();
        const totalPages = pdfDoc.getPageCount();

        // Parse range string (e.g., "1-3, 5" -> [0, 1, 2, 4])
        // 1-based index from user to 0-based index for pdf-lib
        const pagesToKeep = new Set();
        const parts = range.split(',').map(p => p.trim());

        for (const part of parts) {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(Number);
                if (!isNaN(start) && !isNaN(end)) {
                    for (let i = start; i <= end; i++) {
                        if (i >= 1 && i <= totalPages) pagesToKeep.add(i - 1);
                    }
                }
            } else {
                const pageNum = Number(part);
                if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                    pagesToKeep.add(pageNum - 1);
                }
            }
        }

        const sortedPages = Array.from(pagesToKeep).sort((a, b) => a - b);

        if (sortedPages.length === 0) {
            throw new Error("Invalid page range or pages out of bounds.");
        }

        const copiedPages = await newPdfDoc.copyPages(pdfDoc, sortedPages);
        copiedPages.forEach(page => newPdfDoc.addPage(page));

        const pdfBytes = await newPdfDoc.save();
        const outputFilename = `split-${Date.now()}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${outputFilename}`);
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error("Split Error:", error);
        res.status(500).send("Error processing PDF: " + error.message);
    } finally {
        deleteFile(req.file.path);
    }
};

// --- Merge PDF ---

exports.mergePage = (req, res) => {
    res.render('merge', { title: 'Merge PDF' });
};

exports.processMerge = async (req, res) => {
    if (!req.files || req.files.length < 2) {
        // Cleanup if only 1 file
        if (req.files) deleteFiles(req.files.map(f => f.path));
        return res.status(400).send('Please upload at least 2 PDF files.');
    }

    try {
        const mergedPdf = await PDFDocument.create();

        for (const file of req.files) {
            const fileBytes = fs.readFileSync(file.path);
            const pdfDoc = await PDFDocument.load(fileBytes);
            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            copiedPages.forEach(page => mergedPdf.addPage(page));
        }

        const pdfBytes = await mergedPdf.save();
        const outputFilename = `merged-${Date.now()}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${outputFilename}`);
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error("Merge Error:", error);
        res.status(500).send("Error merging PDFs: " + error.message);
    } finally {
        // Cleanup uploaded files
        deleteFiles(req.files.map(f => f.path));
    }
};

// --- Image to PDF ---

exports.imgToPdfPage = (req, res) => {
    res.render('img-to-pdf', { title: 'Image to PDF' });
};

exports.processImgToPdf = async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).send('Please upload at least one image.');
    }

    try {
        const pdfDoc = await PDFDocument.create();

        for (const file of req.files) {
            const imgBytes = fs.readFileSync(file.path);
            let image;
            if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
                image = await pdfDoc.embedJpg(imgBytes);
            } else if (file.mimetype === 'image/png') {
                image = await pdfDoc.embedPng(imgBytes);
            } else {
                continue; // Skip unsupported formats
            }

            const page = pdfDoc.addPage([image.width, image.height]);
            page.drawImage(image, {
                x: 0,
                y: 0,
                width: image.width,
                height: image.height,
            });
        }

        const pdfBytes = await pdfDoc.save();
        const outputFilename = `images-to-pdf-${Date.now()}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${outputFilename}`);
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error("Image to PDF Error:", error);
        res.status(500).send("Error converting images to PDF: " + error.message);
    } finally {
        deleteFiles(req.files.map(f => f.path));
    }
};

// --- Rearrange PDF ---

exports.rearrangePage = (req, res) => {
    res.render('rearrange', { title: 'Rearrange PDF' });
};

exports.processRearrange = async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const { order } = req.body; // e.g., "1, 3, 2"
    if (!order) {
        deleteFile(req.file.path);
        return res.status(400).send('Page order is required.');
    }

    try {
        const existingPdfBytes = fs.readFileSync(req.file.path);
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const newPdfDoc = await PDFDocument.create();
        const totalPages = pdfDoc.getPageCount();

        // Parse order string
        const pagesToKeep = [];
        const parts = order.split(',').map(p => p.trim());

        for (const part of parts) {
            const pageNum = Number(part);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                pagesToKeep.add(pageNum - 1);
            }
        }

        // Wait, Rearrange needs to allow duplicates? Usually yes.
        // But the previous "Split" implementation used a Set to avoid duplicates.
        // For rearrange, duplicates might be desired (e.g. duplicating a page).
        // Let's use Array to allow specific order and duplicates.

        const pageIndices = parts
            .map(p => parseInt(p.trim()) - 1)
            .filter(idx => idx >= 0 && idx < totalPages);

        if (pageIndices.length === 0) {
            throw new Error("Invalid page order.");
        }

        const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageIndices);
        copiedPages.forEach(page => newPdfDoc.addPage(page));

        const pdfBytes = await newPdfDoc.save();
        const outputFilename = `rearranged-${Date.now()}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${outputFilename}`);
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error("Rearrange Error:", error);
        res.status(500).send("Error rearranging PDF: " + error.message);
    } finally {
        deleteFile(req.file.path);
    }
};

// --- PDF to Image ---

exports.pdfToImgPage = (req, res) => {
    res.render('pdf-to-img', { title: 'PDF to Image' });
};

exports.processPdfToImg = async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const outputDir = path.join('uploads', `images-${Date.now()}`);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
        const { exec } = require('child_process');
        const archiver = require('archiver');

        // pdftoppm -png input.pdf output_prefix
        const outputPrefix = 'page';
        const command = `pdftoppm -png "${req.file.path}" "${path.join(outputDir, outputPrefix)}"`;

        await new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`pdftoppm error: ${error.message}`);
                    return reject(error);
                }
                resolve();
            });
        });

        // Zip the images
        const zipPath = path.join('uploads', `images-${Date.now()}.zip`);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', function () {
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename=converted-images.zip`);

            const readStream = fs.createReadStream(zipPath);
            readStream.pipe(res);

            readStream.on('end', () => {
                // Cleanup
                deleteFile(zipPath);
                fs.rm(outputDir, { recursive: true, force: true }, (err) => {
                    if (err) console.error("Failed to delete temp dir", err);
                });
                deleteFile(req.file.path);
            });
        });

        archive.on('error', function (err) {
            throw err;
        });

        archive.pipe(output);
        archive.directory(outputDir, false);
        archive.finalize();

    } catch (error) {
        console.error("PDF to Image Error:", error);
        // Cleanup on error
        fs.rm(outputDir, { recursive: true, force: true }, () => { });
        deleteFile(req.file.path);
        res.status(500).send("Error converting PDF to images: " + error.message);
    }
};



