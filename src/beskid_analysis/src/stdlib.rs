pub const STDLIB_PRELUDE: &str = r#"
enum StdInterop {
    IoPrint(string text),
    IoPrintln(string text),
    StringLen(string text),
}
"#;
