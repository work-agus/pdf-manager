const fs = require('fs');

const deleteFile = (filePath) => {
    if (filePath) {
        fs.unlink(filePath, (err) => {
            if (err) console.error(`Failed to delete file ${filePath}:`, err);
        });
    }
};

const deleteFiles = (filePaths) => {
    if (filePaths && filePaths.length > 0) {
        filePaths.forEach(path => {
            fs.unlink(path, (err) => {
                if (err) console.error(`Failed to delete file ${path}:`, err);
            });
        });
    }
}

module.exports = { deleteFile, deleteFiles };
