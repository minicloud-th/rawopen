#![cfg_attr(not(test), no_std)]

const MAX_SAFE: i64 = 9_007_199_254_740_991;
static mut INPUT: [u8; 128] = [0; 128];

#[cfg(all(not(test), target_arch = "wasm32"))]
#[panic_handler]
fn panic(_: &core::panic::PanicInfo) -> ! { core::arch::wasm32::unreachable() }

#[no_mangle]
pub extern "C" fn input_ptr() -> *mut u8 { core::ptr::addr_of_mut!(INPUT) as *mut u8 }

fn parse(bytes: &[u8]) -> i64 {
    if bytes.is_empty() { return -1; }
    let mut whole = 0_i64;
    let mut fraction = 0_i64;
    let mut decimals = 0;
    let mut dot = false;
    let mut digits = 0;
    for &byte in bytes {
        if byte == b'.' && !dot && digits > 0 { dot = true; continue; }
        if !byte.is_ascii_digit() { return -1; }
        let digit = (byte - b'0') as i64;
        if dot {
            decimals += 1;
            if decimals > 2 { return -1; }
            fraction = fraction * 10 + digit;
        } else {
            digits += 1;
            whole = match whole.checked_mul(10).and_then(|v| v.checked_add(digit)) { Some(v) if v <= MAX_SAFE / 100 => v, _ => return -1 };
        }
    }
    if digits == 0 || (dot && decimals == 0) { return -1; }
    if decimals == 1 { fraction *= 10; }
    match whole.checked_mul(100).and_then(|v| v.checked_add(fraction)) { Some(v) if v <= MAX_SAFE => v, _ => -1 }
}

#[no_mangle]
pub extern "C" fn parse_amount(length: u32) -> i64 {
    if length > 128 { return -1; }
    // The Worker copies this bounded input and invokes synchronously on one thread.
    let bytes = unsafe { core::slice::from_raw_parts(core::ptr::addr_of!(INPUT) as *const u8, length as usize) };
    parse(bytes)
}

#[no_mangle]
pub extern "C" fn line_total(unit_satang: i64, quantity: i32) -> i64 {
    if unit_satang < 0 || unit_satang > MAX_SAFE || !(1..=9).contains(&quantity) { return -1; }
    match unit_satang.checked_mul(quantity as i64) { Some(v) if v <= MAX_SAFE => v, _ => -1 }
}

#[no_mangle]
pub extern "C" fn checked_add(left: i64, right: i64) -> i64 {
    if left < 0 || right < 0 { return -1; }
    match left.checked_add(right) { Some(v) if v <= MAX_SAFE => v, _ => -1 }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn decimals_are_exact_satang() {
        for (text, amount) in [("0", 0), ("0.29", 29), ("250.5", 25050), ("1000.00", 100000)] { assert_eq!(parse(text.as_bytes()), amount); }
    }
    #[test]
    fn invalid_and_overflowing_amounts_are_rejected() {
        for text in ["", ".5", "1.", "1.001", "-1", "NaN", "1e3", "1,000", "90071992547409.92", "999999999999999999999999999"] { assert_eq!(parse(text.as_bytes()), -1, "{text}"); }
    }
    #[test]
    fn totals_are_checked_and_bounded() {
        assert_eq!(line_total(129000, 2), 258000);
        assert_eq!(line_total(0, 1), 0);
        assert_eq!(line_total(129000, 10), -1);
        assert_eq!(line_total(-1, 1), -1);
        assert_eq!(line_total(MAX_SAFE, 2), -1);
        assert_eq!(checked_add(29, 1), 30);
        assert_eq!(checked_add(MAX_SAFE, 1), -1);
    }
}
