use wasm_bindgen::prelude::*;
use pulldown_cmark::{Parser, html, Options};

#[wasm_bindgen]
pub fn parse_markdown(input: &str) -> String {
    if input.is_empty() {
        return String::new();
    }

    // Create parser with all extensions enabled
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_FOOTNOTES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);

    let parser = Parser::new_ext(input, options);
    let mut html_output = String::with_capacity(input.len() * 3 / 2);
    
    match html::push_html(&mut html_output, parser) {
        _ => html_output,
    }
}