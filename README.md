# PDF Manager

A simple, modern, and stateless PDF management tool built with Node.js, Express, and Tailwind CSS. This application allows you to perform various operations on PDF files without storing them permanently on the server.

## Features

-   **Split PDF**: Extract specific page ranges from a PDF.
-   **Merge PDF**: Combine multiple PDF files into a single document.
-   **Image to PDF**: Convert JPG and PNG images into a PDF file.
-   **Rearrange Pages**: Reorder the pages of a PDF document.
-   **PDF to Image**: Convert PDF pages into high-quality PNG images (downloaded as a ZIP).

## Technology Stack

-   **Backend**: Node.js, Express.js
-   **Frontend**: EJS (Templating), Tailwind CSS (Styling), Vanilla JS (AJAX)
-   **PDF Processing**: `pdf-lib`
-   **Image Processing**: `pdftoppm` (via `poppler-utils`)
-   **File Handling**: `multer` (uploads), `archiver` (zipping)

## Prerequisites

Before running the application, ensure you have the following installed:

1.  **Node.js** (v14 or higher)
2.  **Poppler Utils** (Required for PDF to Image conversion)
    -   **Linux (Debian/Ubuntu)**: `sudo apt-get install poppler-utils`
    -   **macOS**: `brew install poppler`
    -   **Windows**: Download binary and add to PATH.

## Installation

1.  Clone the repository (or download the source code):
    ```bash
    git clone <repository-url>
    cd pdf-manager
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

## Usage

### Development Mode
To run the server with hot-reloading (via `--watch`) and Tailwind CSS watching:
```bash
npm run dev
```
Access the app at `http://localhost:3000`.

### Production Mode
To build the CSS and start the server:
```bash
npm start
```

## Project Structure

```
pdf-manager/
├── controllers/    # Route logic
├── public/
│   ├── css/        # Compiled CSS
│   └── js/         # Client-side scripts
├── routes/         # Express routes
├── src/            # Source CSS (Tailwind input)
├── uploads/        # Temp storage for uploads (auto-cleaned)
├── utils/          # Helper functions
├── views/          # EJS templates
├── server.js       # Entry point
└── package.json
```

## License

ISC
