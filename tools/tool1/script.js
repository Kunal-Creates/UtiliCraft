import init, { parse_markdown } from "./pkg/rust_src.js";

async function main() {
  await init();

  const input = document.getElementById("markdown-input");
  const preview = document.getElementById("preview");

  // Add theme sync functionality
  function syncTheme() {
    try {
      // Check if we're in an iframe
      const isInIframe = window !== window.parent;
      
      if (isInIframe) {
        // We're in an iframe, get theme from parent
        const parentBody = window.parent.document.body;
        const isDarkTheme = parentBody.classList.contains('dark-theme');
        document.body.classList.toggle('dark-theme', isDarkTheme);
      } else {
        // We're not in an iframe, maybe direct access to the tool
        // Check local storage for theme preference
        const savedTheme = localStorage.getItem('utilicraft-theme');
        if (savedTheme) {
          document.body.classList.toggle('dark-theme', savedTheme === 'dark-theme');
        }
      }
    } catch (e) {
      // Handle cross-origin issues
      console.error("Theme sync error:", e);
    }
  }

  // Initial theme sync
  syncTheme();

  // Listen for theme changes in the parent document if in iframe
  try {
    if (window !== window.parent) {
      // Create a polling mechanism since MutationObserver might not work across frames
      setInterval(syncTheme, 500);
      
      // Also try to set up message listening for theme changes
      window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'theme-change') {
          document.body.classList.toggle('dark-theme', event.data.isDarkTheme);
        }
      });
    }
  } catch (e) {
    console.error("Theme observer setup error:", e);
  }

  function renderPreview() {
    const raw = input.value;
    const html = parse_markdown(raw);
    preview.innerHTML = html;
  }

  input.addEventListener("input", renderPreview);

  // Add some initial content
  const defaultMarkdown = "# Welcome to the Markdown Editor\n\nThis is a simple markdown editor that renders in real-time.\n\n## Features\n- Real-time preview\n- Supports standard markdown syntax\n- Synchronized with the main site's theme";
  
  input.value = defaultMarkdown;
  renderPreview();
}

main();