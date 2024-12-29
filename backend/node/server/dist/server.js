"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Import modul yang dibutuhkan
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const cors_1 = __importDefault(require("cors"));
const config_1 = require("./config");
const function_1 = require("./function");
const function_2 = require("./function");
// Inisialisasi aplikasi Express
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const PORT = 3001;
// Endpoint untuk mendapatkan data user
app.get('/data', (req, res) => {
    try {
        const data = (0, function_2.bacaUserXLSX)();
        res.json({ sukses: true, data });
        console.log('Berhasil mengembalikan data user!');
    }
    catch (error) {
        console.error('Gagal membaca file data user:', error);
        res.status(500).json({ sukses: false, pesan: 'Gagal membaca file data user.' });
    }
});
// Endpoint untuk mendapatkan data berita
app.get('/berita', (req, res) => {
    try {
        const data = (0, function_1.bacaBeritaXLSX)();
        res.json({ sukses: true, data });
        console.log('Berhasil mengembalikan data berita!');
    }
    catch (error) {
        console.error('Gagal membaca file data berita:', error);
        res.status(500).json({ sukses: false, pesan: 'Gagal membaca file data berita.' });
    }
});
// Menonton perubahan file user XLSX
fs_1.default.watch(config_1.CONFIG.FILE_PATH_USER, () => {
    console.log('File data user telah diperbarui.');
    try {
        const data = (0, function_2.bacaUserXLSX)();
        console.log('Data user terkini:', data);
    }
    catch (error) {
        console.error('Gagal membaca file user setelah diperbarui:', error);
    }
});
// Menonton perubahan file berita XLSX
fs_1.default.watch(config_1.CONFIG.FILE_PATH_BERITA, () => {
    console.log('File berita telah diperbarui.');
    try {
        const data = (0, function_1.bacaBeritaXLSX)();
        console.log('Data berita terkini:', data);
    }
    catch (error) {
        console.error('Gagal membaca file berita setelah diperbarui:', error);
    }
});
// Menjalankan server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
