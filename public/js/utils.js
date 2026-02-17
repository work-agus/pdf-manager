/**
 * Handles form submission via AJAX to show a download button instead of immediate download.
 * @param {HTMLFormElement} form - The form element to handle.
 * @param {string} resultContainerId - ID of the container to show the download button.
 * @param {string} downloadBtnId - ID of the anchor tag meant for the download button.
 * @param {string} errorContainerId - ID of the container to show errors.
 */
function handleFormSubmit(form, resultContainerId, downloadBtnId, errorContainerId) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerText;
        const resultContainer = document.getElementById(resultContainerId);
        const downloadBtn = document.getElementById(downloadBtnId);
        const errorContainer = document.getElementById(errorContainerId);

        // Reset UI
        resultContainer.classList.add('hidden');
        errorContainer.classList.add('hidden');
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processing...`;

        try {
            const formData = new FormData(form);
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Processing failed');
            }

            // Extract filename from Content-Disposition header if possible
            const disposition = response.headers.get('Content-Disposition');
            let filename = 'downloaded-file';
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            downloadBtn.href = url;
            downloadBtn.download = filename;
            downloadBtn.onclick = () => {
                setTimeout(() => window.URL.revokeObjectURL(url), 100);
            };

            resultContainer.classList.remove('hidden');
            resultContainer.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error(error);
            errorContainer.textContent = error.message;
            errorContainer.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = originalBtnText;
        }
    });
}
