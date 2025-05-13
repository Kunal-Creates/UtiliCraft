// Check if the WebAssembly module exists and handle errors gracefully
let wasmModule;

async function loadWasmModule() {
  try {
    // Get the base URL for the current deployment
    const baseUrl = new URL('.', window.location.href).pathname;
    
    // Use dynamic import with properly resolved path
    // First try relative path (for local development)
    try {
      const module = await import("./pkg/rust_src.js");
      await module.default();
      console.log("Successfully loaded WebAssembly module from relative path");
      return module;
    } catch (relativeError) {
      console.warn("Failed to load from relative path, trying with base URL:", baseUrl);
      
      // If relative path fails, try with base URL path (for GitHub Pages)
      try {
        const module = await import(`${baseUrl}pkg/rust_src.js`);
        await module.default();
        console.log("Successfully loaded WebAssembly module with base URL path");
        return module;
      } catch (baseUrlError) {
        // If that fails too, try with absolute path from repo root
        console.warn("Failed with base URL path, trying absolute path from repo root");
        const repoName = window.location.pathname.split('/')[1]; // Extract repo name from URL
        const absolutePath = repoName ? `/${repoName}/pkg/rust_src.js` : '/pkg/rust_src.js';
        
        try {
          const module = await import(absolutePath);
          await module.default();
          console.log("Successfully loaded WebAssembly module with absolute path");
          return module;
        } catch (absoluteError) {
          console.error("All loading attempts failed. Details:", { 
            relativeError, 
            baseUrlError, 
            absoluteError,
            paths: {
              relative: "./pkg/rust_src.js",
              baseUrl: `${baseUrl}pkg/rust_src.js`,
              absolute: absolutePath
            }
          });
          throw new Error("Failed to load WebAssembly module after multiple attempts");
        }
      }
    }
  } catch (error) {
    console.error("Failed to load WebAssembly module:", error);
    
    // Display error message in the preview area for better debugging
    const preview = document.getElementById("preview");
    if (preview) {
      preview.innerHTML = `
        <div class="wasm-error">
          <h3>⚠️ WebAssembly module failed to load</h3>
          <p>This could be due to CORS issues or path resolution problems when deployed on GitHub Pages.</p>
          <p>Error details: ${error.message}</p>
          <h4>Troubleshooting:</h4>
          <ul>
            <li>Check browser console for detailed error messages</li>
            <li>Ensure all WASM files are properly built and deployed</li>
            <li>Try adding a .nojekyll file to your GitHub repo to prevent Jekyll processing</li>
          </ul>
        </div>
      `;
    }
    return null;
  }
}

async function main() {
  // Try to load the WebAssembly module
  wasmModule = await loadWasmModule();
  
  const input = document.getElementById("markdown-input");
  const preview = document.getElementById("preview");
  const downloadPdfBtn = document.getElementById("download-pdf");
  const downloadHtmlBtn = document.getElementById("download-html");

  // Add theme sync functionality
  function syncTheme() {
    try {
      // Check if we're in an iframe with same-origin access
      const isInIframe = window !== window.parent;
      
      if (isInIframe) {
        try {
          // Try to access parent window (will throw if cross-origin)
          const parentBody = window.parent.document.body;
          const isDarkTheme = parentBody.classList.contains('dark-theme');
          document.body.classList.toggle('dark-theme', isDarkTheme);
        } catch (corsError) {
          // Fall back to localStorage or default if cross-origin error
          const savedTheme = localStorage.getItem('utilicraft-theme');
          if (savedTheme) {
            document.body.classList.toggle('dark-theme', savedTheme === 'dark-theme');
          }
        }
      } else {
        // We're not in an iframe, check local storage for theme preference
        const savedTheme = localStorage.getItem('utilicraft-theme');
        if (savedTheme) {
          document.body.classList.toggle('dark-theme', savedTheme === 'dark-theme');
        }
      }
    } catch (e) {
      console.error("Theme sync error:", e);
    }
  }

  // Initial theme sync
  syncTheme();

  // Listen for theme changes in the parent document if in iframe
  try {
    // Set up message listening for theme changes
    window.addEventListener('message', (event) => {
      // Add origin checking for production
      // if (event.origin !== "https://your-production-domain.com") return;
      
      if (event.data && event.data.type === 'theme-change') {
        document.body.classList.toggle('dark-theme', event.data.isDarkTheme);
      }
    });
  } catch (e) {
    console.error("Theme observer setup error:", e);
  }

  function renderPreview() {
    const raw = input.value;
    
    // Check if WebAssembly module loaded successfully
    if (wasmModule && wasmModule.parse_markdown) {
      try {
        const html = wasmModule.parse_markdown(raw);
        preview.innerHTML = html;
        
        // Apply additional styling to tables for better rendering
        const tables = preview.querySelectorAll('table');
        tables.forEach(table => {
          if (!table.classList.contains('styled-table')) {
            table.classList.add('styled-table');
          }
        });
        
        // Ensure scrolling is reset to top when content changes significantly
        if (preview.scrollHeight > preview.clientHeight) {
          preview.scrollTop = 0;
        }
      } catch (renderError) {
        console.error("Error rendering markdown:", renderError);
        preview.innerHTML = `
          <div class="error-message">
            <p>Error rendering markdown: ${renderError.message}</p>
            <pre>${escapeHtml(raw)}</pre>
          </div>
        `;
      }
    } else {
      // Fallback rendering if WebAssembly failed to load
      preview.innerHTML = `
        <div class="fallback-preview">
          <p><strong>WebAssembly module not loaded.</strong> Using fallback preview:</p>
          <pre>${escapeHtml(raw)}</pre>
        </div>
      `;
    }
  }
  
  // Simple HTML escape function for the fallback renderer
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Function to download content as HTML
  function downloadAsHtml() {
    if (!input.value) {
      alert("Please add some content first!");
      return;
    }
    
    // Get the HTML content from the preview div
    const htmlContent = preview.innerHTML;
    
    // Create a complete HTML document
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Markdown Export</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
          }
          img { max-width: 100%; }
          pre { 
            background-color: #f5f5f5; 
            padding: 15px; 
            border-radius: 5px; 
            overflow-x: auto; 
          }
          table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 1em 0;
          }
          table, th, td { 
            border: 1px solid #ddd; 
          }
          th, td { 
            padding: 8px; 
            text-align: left; 
          }
          th {
            background-color: #f5f5f5;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          blockquote { 
            border-left: 4px solid #ddd; 
            margin-left: 0; 
            padding-left: 15px; 
            color: #666; 
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;
    
    // Create a Blob with the HTML content
    const blob = new Blob([fullHtml], { type: 'text/html' });
    
    // Create download link and trigger the download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'markdown-export.html';
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Function to download content as PDF
  function downloadAsPdf() {
    if (!input.value) {
      alert("Please add some content first!");
      return;
    }
    
    // Create a temporary container for PDF rendering
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = preview.innerHTML;
    tempContainer.style.padding = '20px';
    tempContainer.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif';
    tempContainer.style.lineHeight = '1.6';
    
    // Fix image sizes
    const images = tempContainer.querySelectorAll('img');
    images.forEach(img => {
      img.style.maxWidth = '100%';
    });
    
    // Fix code blocks
    const codeBlocks = tempContainer.querySelectorAll('pre');
    codeBlocks.forEach(pre => {
      pre.style.backgroundColor = '#f5f5f5';
      pre.style.padding = '15px';
      pre.style.borderRadius = '5px';
      pre.style.overflowX = 'auto';
      pre.style.fontFamily = 'monospace';
      pre.style.fontSize = '14px';
    });
    
    // Fix blockquotes
    const blockquotes = tempContainer.querySelectorAll('blockquote');
    blockquotes.forEach(blockquote => {
      blockquote.style.borderLeft = '4px solid #ddd';
      blockquote.style.marginLeft = '0';
      blockquote.style.paddingLeft = '15px';
      blockquote.style.color = '#666';
    });
    
    // Fix tables
    const tables = tempContainer.querySelectorAll('table');
    tables.forEach(table => {
      table.style.borderCollapse = 'collapse';
      table.style.width = '100%';
      table.style.margin = '1em 0';
      table.style.pageBreakInside = 'avoid'; // Try to avoid breaking tables across pages
      
      const allCells = table.querySelectorAll('th, td');
      allCells.forEach(cell => {
        cell.style.border = '1px solid #ddd';
        cell.style.padding = '8px';
        cell.style.textAlign = 'left';
      });
      
      const headerCells = table.querySelectorAll('th');
      headerCells.forEach(header => {
        header.style.backgroundColor = '#f5f5f5';
        header.style.fontWeight = 'bold';
      });
      
      const evenRows = table.querySelectorAll('tr:nth-child(even)');
      evenRows.forEach(row => {
        row.style.backgroundColor = '#f9f9f9';
      });
    });
    
    // Add heading styles
    const headings = tempContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
      heading.style.pageBreakAfter = 'avoid'; // Try to avoid page breaks after headings
      heading.style.pageBreakBefore = 'auto';
    });
    
    // Set up PDF options
    const opt = {
      margin: [10, 10, 10, 10], // top, right, bottom, left margins in mm
      filename: 'markdown-export.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true
      },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy'], // Try to avoid breaking inside elements
        before: '.page-break-before',
        after: '.page-break-after'
      }
    };
    
    // Use html2pdf library with improved settings
    html2pdf().set(opt).from(tempContainer).save();
  }

  // Add event listeners
  input.addEventListener("input", renderPreview);
  downloadPdfBtn.addEventListener("click", downloadAsPdf);
  downloadHtmlBtn.addEventListener("click", downloadAsHtml);

  // Add some initial content with table example
  const defaultMarkdown = `# Welcome to the Markdown Editor

This is a simple markdown editor that renders in real-time.

## Features
- Real-time preview
- Supports standard markdown syntax
- Synchronized with the main site's theme
- Export to PDF and HTML

## Table Example

| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

## Code Block Example

\`\`\`javascript
function helloWorld() {
  console.log("Hello, world!");
}
\`\`\``;
  
  input.value = defaultMarkdown;
  renderPreview();
}

// Start the application
main();