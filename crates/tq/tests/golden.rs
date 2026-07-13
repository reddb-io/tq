use std::fs;
use std::io::Write;
use std::process::{Command, Stdio};

#[derive(Debug)]
struct Case {
    args: Vec<String>,
    stdin: String,
    stdout: String,
    stderr: String,
    exit_code: i32,
}

#[test]
fn golden_cli_cases() {
    let root = env!("CARGO_MANIFEST_DIR");
    let cases_dir = std::path::Path::new(root).join("tests/golden");

    for entry in fs::read_dir(cases_dir).expect("golden cases directory exists") {
        let entry = entry.expect("golden case directory entry is readable");
        if !entry.file_type().expect("golden case file type").is_dir() {
            continue;
        }

        let case = read_case(&entry.path());
        let output = run_case(&case);

        assert_eq!(
            output.status.code(),
            Some(case.exit_code),
            "{} exit code",
            entry.file_name().to_string_lossy()
        );
        assert_eq!(
            String::from_utf8(output.stdout).expect("stdout is utf-8"),
            case.stdout,
            "{} stdout",
            entry.file_name().to_string_lossy()
        );
        assert_eq!(
            String::from_utf8(output.stderr).expect("stderr is utf-8"),
            case.stderr,
            "{} stderr",
            entry.file_name().to_string_lossy()
        );
    }
}

fn read_case(path: &std::path::Path) -> Case {
    let args = fs::read_to_string(path.join("args.txt"))
        .expect("args fixture exists")
        .split_whitespace()
        .map(ToOwned::to_owned)
        .collect();

    let exit_code = fs::read_to_string(path.join("exit.txt"))
        .expect("exit fixture exists")
        .trim()
        .parse()
        .expect("exit fixture is an integer");

    Case {
        args,
        stdin: fs::read_to_string(path.join("stdin.toon")).expect("stdin fixture exists"),
        stdout: fs::read_to_string(path.join("stdout.toon")).expect("stdout fixture exists"),
        stderr: fs::read_to_string(path.join("stderr.txt")).expect("stderr fixture exists"),
        exit_code,
    }
}

fn run_case(case: &Case) -> std::process::Output {
    let mut child = Command::new(env!("CARGO_BIN_EXE_tq"))
        .args(&case.args)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("spawn tq");

    child
        .stdin
        .as_mut()
        .expect("stdin is piped")
        .write_all(case.stdin.as_bytes())
        .expect("write stdin");

    child.wait_with_output().expect("wait for tq")
}
