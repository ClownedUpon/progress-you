fn main() {
    println!("cargo:rerun-if-changed=../src/index.html");
    tauri_build::build()
}