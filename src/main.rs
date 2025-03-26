
use serde_json::Value;
use std::fs::OpenOptions;
use std::io::Write;
use warp::Filter;
use bytes::Bytes;

#[tokio::main]
async fn main() {
    let route = warp::post()
        .and(warp::body::bytes()) // Capture the body as bytes
        .map(|body: Bytes| {
            let body_str = String::from_utf8_lossy(&body);

            // Parse JSON
            let json_body: Value = match serde_json::from_str(&body_str) {
                Ok(json) => json,
                Err(err) => {
                    println!("JSON parsing error: {}", err);
                    return "Invalid JSON";
                }
            };

            // Check if "data" exists and is an array
            let data_array = match json_body["data"].as_array() {
                Some(arr) if !arr.is_empty() => arr, // Ensure it's not empty
                _ => {
                    println!("No 'data' array found in JSON or it's empty");

                    println!("{}", &body_str);
                    return "No data array";
                }
            };

            // Process transactions
            let mut found_match = false;

            if let Some(transactions) = data_array[0]["transactions"].as_array() {
                for item in transactions {
                    if let Some(transaction) = item.get("transaction")
                        .and_then(|t| t.get("message"))
                        .and_then(|m| m.get("instructions"))
                        .and_then(|i| i.as_array()) 
                    {

                        
                    let signature = item.get("transaction")
                        .and_then(|s| s.get("signatures")) // Ensure it's an array
                        .and_then(|arr| arr.get(0)) // Get the first element
                        .and_then(|val| val.as_str()) // Ensure it's a string
                        .unwrap_or("no signature"); // Default if missing
                                                    //
                        for instruction in transaction {
                            let data = instruction
                                .get("data")
                                .and_then(|d| d.as_str())
                                .unwrap_or("N/A"); // Default to "N/A" if missing

                            let program_id = instruction
                                .get("programId")
                                .and_then(|p| p.as_str())
                                .unwrap_or("N/A"); // Default to "N/A" if missing

                            if data.starts_with("CpoVi745fTa") 
                                && program_id == "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C" 
                            {
                                let account = instruction
                                    .get("accounts")
                                    .and_then(|acc| acc.as_array())
                                    .and_then(|arr| arr.get(5))
                                    .and_then(|val| val.as_str())
                                    .unwrap_or("N/A");                                            

                                println!("Transaction MATCH found!");
                                log_to_file("hits.log", &format!("data: {}, programId: {}, account: {}, signature: {}", data, program_id, account, signature));
                                found_match = true;
                            } else {
                                log_to_file("no_transactions.log", &format!("data: {}, programId: {}, signature: {}", data, program_id, signature));
                            }
                        }
                    }
                }
            } else {
                println!("'transactions' key is missing or not an array.");
            }

            if !found_match {
                println!("No transactions matched criteria. Logging full request body.");
            }

            "OK"
        });

    warp::serve(route).run(([0, 0, 0, 0], 8080)).await;
}

// Helper function to write to a log file
fn log_to_file(filename: &str, content: &str) {
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(filename)
        .expect("Failed to open log file");

    if let Err(e) = writeln!(file, "{}", content) {
        eprintln!("Failed to write to log file: {}", e);
    }
}

