/**
 * =========================================================================
 * GOOGLE APPS SCRIPT - SINKRONISASI PENILAIAN UKK TELKOM
 * =========================================================================
 * 
 * CARA MEMASANG DI GOOGLE SHEETS:
 * 1. Buka file Google Spreadsheet Anda (yang berisi sheet "PENGUJI KOMDIGI 2")
 * 2. Klik menu "Ekstensi" (Extensions) -> "Apps Script"
 * 3. Hapus kode bawaan (myFunction), lalu tempel (paste) seluruh kode di bawah ini.
 * 4. Klik tombol "Simpan" (ikon disket).
 * 5. Klik tombol biru "Terapkan" (Deploy) di kanan atas -> pilih "Penerapan baru" (New deployment).
 * 6. Pada ikon roda gigi "Pilih jenis", pilih "Aplikasi web" (Web app).
 * 7. Isi:
 *    - Deskripsi: Webhook Penilaian UKK
 *    - Jalankan sebagai (Execute as): Saya (email Anda)
 *    - Siapa yang memiliki akses (Who has access): Siapa saja (Anyone)
 * 8. Klik "Terapkan" (Deploy), lalu izinkan hak akses (Authorize access).
 * 9. Salin "URL Aplikasi Web" (Web App URL) yang berakhiran "/exec".
 * 10. Buka website penilaian di HP Poco F7 Anda -> klik ikon Cloud/Export -> tempel URL tersebut!
 */

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("PENGUJI KOMDIGI 2") || ss.getActiveSheet();

    if (!data.students || !Array.isArray(data.students)) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Payload tidak valid, 'students' array tidak ditemukan."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < 6) {
      lastRow = 100;
    }

    // Ambil kolom NIS (Kolom B) dan Nama (Kolom C) dari baris 6 ke bawah
    var rangeNIS = sheet.getRange(6, 2, lastRow - 5, 1).getValues();
    var rangeNama = sheet.getRange(6, 3, lastRow - 5, 1).getValues();

    var updatedCount = 0;

    data.students.forEach(function(student) {
      var targetRow = -1;

      // Cari berdasarkan NIS terlebih dahulu
      if (student.nis) {
        for (var i = 0; i < rangeNIS.length; i++) {
          if (String(rangeNIS[i][0]).trim() === String(student.nis).trim()) {
            targetRow = i + 6;
            break;
          }
        }
      }

      // Jika tidak ketemu berdasarkan NIS, cari berdasarkan Nama
      if (targetRow === -1 && student.nama) {
        for (var j = 0; j < rangeNama.length; j++) {
          if (String(rangeNama[j][0]).trim().toUpperCase() === String(student.nama).trim().toUpperCase()) {
            targetRow = j + 6;
            break;
          }
        }
      }

      // Jika masih tidak ketemu tetapi ada row bawaan
      if (targetRow === -1 && student.excel_row) {
        targetRow = student.excel_row;
      }

      // Jika baris ditemukan, tulis nilai 18 indikator ke Kolom 15 s/d 32
      if (targetRow > 0) {
        var scoresRow = [];
        for (var k = 0; k < 18; k++) {
          var val = (student.nilai && student.nilai[k] !== undefined && student.nilai[k] !== null && student.nilai[k] !== "") 
            ? Number(student.nilai[k]) 
            : "";
          scoresRow.push(val);
        }

        // Tulis 18 nilai kriteria ke Kolom 15 (O) s/d Kolom 32 (AF)
        sheet.getRange(targetRow, 15, 1, 18).setValues([scoresRow]);

        // Tulis Rata-Rata ke Kolom 33 (AG)
        if (student.average !== null && student.average !== undefined) {
          sheet.getRange(targetRow, 33).setValue(Number(student.average));
        }

        // Tulis Keterangan ke Kolom 34 (AH)
        var ket = student.keterangan || student.predicate || "";
        if (ket) {
          sheet.getRange(targetRow, 34).setValue(ket);
        }

        updatedCount++;
      }
    });

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Berhasil memperbarui " + updatedCount + " siswa di Google Sheets.",
      updated: updatedCount,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "Webhook Penilaian UKK RPL",
    time: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

