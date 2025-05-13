use pulldown_cmark::{html, Options, Parser};
use wasm_bindgen::prelude::*;

// Use `wee_alloc` as the global allocator to keep the WASM size small
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
    // Import the `window.alert` function from the Web API
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// Function to initialize panic hook for better error reporting
#[wasm_bindgen(start)]
pub fn start() -> Result<(), JsValue> {
    console_error_panic_hook::set_once();
    Ok(())
}

/// Parse markdown to HTML with extended features
#[wasm_bindgen]
pub fn parse_markdown(markdown: &str) -> String {
    // Set up options for the Markdown parser - enable all available options
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_FOOTNOTES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);
    options.insert(Options::ENABLE_SMART_PUNCTUATION);
    options.insert(Options::ENABLE_HEADING_ATTRIBUTES);
    
    // Parse the markdown
    let parser = Parser::new_ext(markdown, options);
    
    // Generate HTML from the parsed markdown
    let mut html_output = String::new();
    html::push_html(&mut html_output, parser);
    
    // Return the HTML
    html_output
}

/// Retrieve the version of the Markdown parser
#[wasm_bindgen]
pub fn get_version() -> String {
    "1.1.0".to_string()
}

/// Sanitize user input to prevent XSS attacks
#[wasm_bindgen]
pub fn sanitize_input(input: &str) -> String {
    input
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")
        .replace("'", "&#39;")
}

/// Count words in markdown text
#[wasm_bindgen]
pub fn count_words(text: &str) -> u32 {
    text.split_whitespace().count() as u32
}

/// Count characters in markdown text
#[wasm_bindgen]
pub fn count_characters(text: &str) -> u32 {
    text.chars().count() as u32
}

/// Extract headings from markdown
#[wasm_bindgen]
pub fn extract_headings(markdown: &str) -> String {
    let mut result = Vec::new();
    
    for line in markdown.lines() {
        if line.starts_with('#') {
            let mut count = 0;
            for c in line.chars() {
                if c == '#' {
                    count += 1;
                } else {
                    break;
                }
            }
            
            if count > 0 && count <= 6 {
                let heading = line[count..].trim();
                result.push(format!("{{\"level\": {}, \"text\": \"{}\"}}", count, heading));
            }
        }
    }
    
    format!("[{}]", result.join(","))
}

/// Check if markdown contains tables
#[wasm_bindgen]
pub fn has_tables(markdown: &str) -> bool {
    for line in markdown.lines() {
        if line.trim().starts_with('|') && line.trim().ends_with('|') {
            return true;
        }
    }
    false
}

/// Get table of contents from markdown
#[wasm_bindgen]
pub fn get_table_of_contents(markdown: &str) -> String {
    let headings = extract_headings(markdown);
    
    // Parse the JSON string back to a Vec
    let headings: Vec<serde_json::Value> = match serde_json::from_str(&headings) {
        Ok(h) => h,
        Err(_) => return "[]".to_string(),
    };
    
    let mut toc = String::from("<ul class=\"toc\">\n");
    
    for heading in headings {
        if let (Some(level), Some(text)) = (heading["level"].as_u64(), heading["text"].as_str()) {
            let indent = "  ".repeat(level as usize);
            toc.push_str(&format!("{}  <li class=\"toc-h{}\">{}</li>\n", indent, level, text));
        }
    }
    
    toc.push_str("</ul>");
    toc
}