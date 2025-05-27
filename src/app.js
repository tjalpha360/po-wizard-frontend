// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import './App.css'; // We'll create/modify this for styling

function App() {
  const [projectName, setProjectName] = useState('_MyFilmProject_YYYYMMDD');
  const [jobNo, setJobNo] = useState('Job123');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]); // For showing file names
  const [processingLog, setProcessingLog] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [backendUrl, setBackendUrl] = useState('http://localhost:8000'); // Default for local FastAPI

  // Effect to update backend URL if running in a different environment (for future)
  useEffect(() => {
    // Example:
    // if (process.env.NODE_ENV === 'production') {
    //   setBackendUrl('https://your-deployed-backend-url.com');
    // }
  }, []);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    setFilePreviews(files.map(file => file.name));
  };

  const appendToLog = (message, isError = false) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `${timestamp}: ${message}\n`;
    setProcessingLog(prevLog => prevLog + logEntry);
    // Optionally, add styling for errors later
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (selectedFiles.length === 0) {
      appendToLog('No files selected. Please select PDF files to process.', true);
      alert('Please select files to process.');
      return;
    }
    if (!projectName.trim() || !jobNo.trim()) {
      appendToLog('Project Name and Job Number are required.', true);
      alert('Project Name and Job Number are required.');
      return;
    }

    setIsProcessing(true);
    setProcessingLog(''); // Clear previous logs
    appendToLog(`Starting processing for Project: ${projectName}, Job: ${jobNo}`);

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file); // Key 'files' must match FastAPI endpoint
    });
    formData.append('project_name_context', projectName);
    formData.append('job_number_context', jobNo);

    try {
      // We need an endpoint in FastAPI to handle this, e.g., /api/v1/process-documents/
      const response = await fetch(`${backendUrl}/api/v1/process-documents/`, {
        method: 'POST',
        body: formData,
        // Headers are not strictly needed for FormData by default,
        // but if your backend expects 'multipart/form-data', browser sets it.
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error structure' }));
        throw new Error(`Network response was not ok: ${response.status} ${response.statusText}. ${errorData.detail || ''}`);
      }

      const result = await response.json();
      appendToLog(`Backend response: ${result.message || JSON.stringify(result)}`);
      if (result.results && result.results.length > 0) {
        result.results.forEach(fileResult => {
          appendToLog(`File: ${fileResult.original_filename}`);
          if (fileResult.error) {
            appendToLog(`  Error: ${fileResult.error} - ${fileResult.details || ''}`, true);
          } else {
            appendToLog(`  Status: ${fileResult.status}`);
            appendToLog(`  Doc Type: ${fileResult.extracted_data?.doc_type || 'N/A'}`);
            appendToLog(`  Saved to: ${fileResult.saved_path || 'N/A'}`);
          }
        });
      }
      // Clear selected files after successful processing
      setSelectedFiles([]);
      setFilePreviews([]);
      document.getElementById('fileInput').value = null; // Reset file input

    } catch (error) {
      appendToLog(`Error submitting files: ${error.message}`, true);
      console.error('There was an error!', error);
    } finally {
      setIsProcessing(false);
      appendToLog('--- Processing batch finished ---');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>PO Wizard - Film Edition (Web UI)</h1>
      </header>
      <main className="App-main">
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label htmlFor="projectName">Project Name (Context):</label>
            <input
              type="text"
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="jobNo">Job Number (Context):</label>
            <input
              type="text"
              id="jobNo"
              value={jobNo}
              onChange={(e) => setJobNo(e.target.value)}
              required
            />
          </div>

          <div className="form-group file-input-group">
            <label htmlFor="fileInput" className="file-input-label">
              {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : "Select PDF(s) to Process"}
            </label>
            <input
              type="file"
              id="fileInput"
              multiple
              accept=".pdf" // Only allow PDF files
              onChange={handleFileChange}
              disabled={isProcessing}
            />
            {filePreviews.length > 0 && (
              <div className="file-preview-list">
                <strong>Selected:</strong>
                <ul>
                  {filePreviews.map((name, index) => (
                    <li key={index}>{name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button type="submit" disabled={isProcessing || selectedFiles.length === 0} className="submit-button">
            {isProcessing ? 'Processing...' : 'Upload & Process Files'}
          </button>
        </form>

        {processingLog && (
          <div className="log-container">
            <h2>Processing Log:</h2>
            <pre className="processing-log-area">{processingLog}</pre>
          </div>
        )}
      </main>
      <footer className="App-footer">
        <p>© {new Date().getFullYear()} PO Wizard</p>
      </footer>
    </div>
  );
}

export default App;