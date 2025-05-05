import init, { parse_markdown } from "./pkg/rust_src.js";

async function main() {
  await init();

  const input = document.getElementById("markdown-input");
  const preview = document.getElementById("preview");

  // Add theme sync functionality
  function syncTheme() {
    // Get the parent document's body if in an iframe, otherwise use current document
    const parentBody = window.parent.document.body || document.body;
    const isDarkTheme = parentBody.classList.contains('dark-theme');
    document.body.classList.toggle('dark-theme', isDarkTheme);
  }

  // Initial theme sync
  syncTheme();

  // Listen for theme changes in the parent document
  const parentWindow = window.parent || window;
  const observer = new MutationObserver(() => {
    syncTheme();
  });

  const parentBody = parentWindow.document.body;
  observer.observe(parentBody, {
    attributes: true,
    attributeFilter: ['class']
  });

  function renderPreview() {
    const raw = input.value;
    const html = parse_markdown(raw);
    preview.innerHTML = html;
  }

  input.addEventListener("input", renderPreview);

  // ...existing code...
}

main();