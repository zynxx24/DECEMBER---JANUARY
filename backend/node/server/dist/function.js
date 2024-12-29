"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bacaBeritaXLSX = exports.bacaUserXLSX = void 0;
// Fungsi untuk membaca data user dari file XLSX
const xlsx_1 = __importDefault(require("xlsx"));
const config_1 = require("./config");
const bacaUserXLSX = () => {
    const workbook = xlsx_1.default.readFile(config_1.CONFIG.FILE_PATH_USER);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return xlsx_1.default.utils.sheet_to_json(sheet);
};
exports.bacaUserXLSX = bacaUserXLSX;
// Fungsi untuk membaca data berita dari file XLSX
const bacaBeritaXLSX = () => {
    const workbook = xlsx_1.default.readFile(config_1.CONFIG.FILE_PATH_BERITA);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return xlsx_1.default.utils.sheet_to_json(sheet);
};
exports.bacaBeritaXLSX = bacaBeritaXLSX;
module.exports = exports.bacaBeritaXLSX, exports.bacaUserXLSX;
