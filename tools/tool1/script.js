// Check if the WebAssembly module exists and handle errors gracefully
let wasmModule;

async function loadWasmModule() {
  try {
    // Dynamic import with error handling
    const module = await import("./pkg/rust_src.js");
    await module.default();
    return module;
  } catch (error) {
    console.error("Failed to load WebAssembly module:", error);
    return null;
  }
}

async function main() {
  // Try to load the WebAssembly module
  wasmModule = await loadWasmModule();
  
  const input = document.getElementById("markdown-input");
  const preview = document.getElementById("preview");

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
      const html = wasmModule.parse_markdown(raw);
      preview.innerHTML = html;
    } else {
      // Fallback rendering if WebAssembly failed to load
      preview.innerHTML = `<div>
        <pre>${escapeHtml(raw)}</pre>
      </div>`;
    }
  }
  
  // Simple HTML escape function for the fallback renderer
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  input.addEventListener("input", renderPreview);

  // Add some initial content
  const defaultMarkdown = "# Welcome to the Markdown Editor\n\nThis is a simple markdown editor that renders in real-time.\n\n## Features\n- Real-time preview\n- Supports standard markdown syntax\n- Synchronized with the main site's theme";
  
  input.value = defaultMarkdown;
  renderPreview();
}

// Start the application
main();