import { randomUUID } from 'crypto';

// Pembuat ID untuk semua primary key (BIGINT UNSIGNED), sama dengan DK Docs.
// Format: <timestamp ms><SERVER_ID 2 digit><counter>. Nilainya HARUS diperlakukan sebagai
// string di JavaScript (lebih dari 16 digit, melebihi Number.MAX_SAFE_INTEGER).
// Dipakai lewat DI (`idGen`), dengan SERVER_ID dari .env.
class IdGenerator {
  static randId = randomUUID();
  static serverId = (process.env.SERVER_ID || "1")
    .toString()
    .padStart(2, "0");
  static lastTimestamp = 0;
  static counter = 0;

  /** Membuat satu ID baru; counter dinaikkan bila dipanggil di milidetik yang sama. */
  static generate() {
    let now = Date.now();
    // masih di milidetik yang sama dengan ID sebelumnya: naikkan counter
    if (now === this.lastTimestamp) {
      this.counter++;
      if (this.counter > 999) {
        // counter penuh di milidetik yang sama: tunggu milidetik berikutnya agar ID tidak kembar
        do {
          now = Date.now();
        } while (now <= this.lastTimestamp);
        this.counter = 1;
        this.lastTimestamp = now;
      }
    } else {
      // milidetik baru: counter mulai lagi dari 1
      this.counter = 1;
      this.lastTimestamp = now;
    }
    const counterStr = String(this.counter).padStart(2, "0");
    return `${now}${this.serverId}${counterStr}`;
  }
}

export default IdGenerator;
