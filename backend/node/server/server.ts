import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import XLSX from 'xlsx';
import path from 'path';
import crypto from 'crypto';

// Initialize Express app
const app = express();
const PORT = 5000;
const HOST = 'localhost';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configuration object
const CONFIG = {
    FILE_PATHS: {
        DATA: path.resolve(__dirname, '../data/data.xlsx'),
        BERITA: path.resolve(__dirname, '../data/berita.xlsx'),
        SAVED: path.resolve(__dirname, '../data/saved.xlsx'),
        AUTH: path.resolve(__dirname, '../data/auth.xlsx'),
        DEMO: path.resolve(__dirname, '../data/demo.xlsx'),
        LIST: path.resolve(__dirname, '../data/list.xlsx')
    },
    SALT: 'your-secret-salt-key' // Make sure to use a secure salt in production
};

// Interfaces
interface UserData {
    Nama?: string;
    Email?: string;
    'Jumlah Bayar Kas'?: number;
    Status?: string;
    Password?: string;
    'Checkin Count'?: number;
    Role?: string;
    Kelas?: string;
    Jabatan?: string;
    Nomor?: number;
    'Foto Orangnya'?: string;
}

interface NewsData {
    id: number;
    title: string;
    content: string;
    date: string;
    author: string;
}

interface FileOperationResult {
    success: boolean;
    data?: any;
    error?: string;
}

// Security Utils
class SecurityUtils {
    static hashPassword(password: string): string {
        return crypto
            .createHash('sha256')
            .update(password + CONFIG.SALT)
            .digest('hex');
    }

    static verifyPassword(inputPassword: string, hashedPassword: string): boolean {
        const hashedInput = this.hashPassword(inputPassword);
        return hashedInput === hashedPassword;
    }
}

// Enhanced File Operations
class ExcelFileManager {
    private static instance: ExcelFileManager;
    
    private constructor() {}
    
    static getInstance(): ExcelFileManager {
        if (!ExcelFileManager.instance) {
            ExcelFileManager.instance = new ExcelFileManager();
        }
        return ExcelFileManager.instance;
    }

    async loadWorkbook(filePath: string): Promise<XLSX.WorkBook> {
        try {
            return XLSX.readFile(filePath);
        } catch (error) {
            throw new Error(`Failed to load workbook: ${error}`);
        }
    }

    async saveWorkbook(workbook: XLSX.WorkBook, filePath: string): Promise<void> {
        try {
            XLSX.writeFile(workbook, filePath);
        } catch (error) {
            throw new Error(`Failed to save workbook: ${error}`);
        }
    }

    async readFile(filePath: string): Promise<any[]> {
        try {
            const workbook = await this.loadWorkbook(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            return XLSX.utils.sheet_to_json(sheet);
        } catch (error) {
            throw new Error(`Failed to read file: ${error}`);
        }
    }

    async updateFile(filePath: string, data: any[]): Promise<void> {
        try {
            const workbook = await this.loadWorkbook(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = XLSX.utils.json_to_sheet(data);
            workbook.Sheets[sheetName] = worksheet;
            await this.saveWorkbook(workbook, filePath);
        } catch (error) {
            throw new Error(`Failed to update file: ${error}`);
        }
    }
}

// Enhanced User Management
class UserManager {
    private fileManager: ExcelFileManager;

    constructor() {
        this.fileManager = ExcelFileManager.getInstance();
    }

    async getFilteredUserData(): Promise<FileOperationResult> {
        try {
            const data = await this.fileManager.readFile(CONFIG.FILE_PATHS.DATA);
            const filteredData = data.map(row => ({
                Nama: row['Nama'],
                Kelas: row['Kelas'],
                Kas: row['Jumlah Bayar Kas'],
                Jabatan: row['Jabatan'],
                Nomor: row['No'],
                Foto: row['Foto Orangnya'],
            }));
            return { success: true, data: filteredData };
        } catch (error) {
            return { success: false, error: `Failed to get user data: ${error}` };
        }
    }

    async getNews(): Promise<FileOperationResult> {
        try {
            const data = await this.fileManager.readFile(CONFIG.FILE_PATHS.BERITA);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: `Failed to get news: ${error}` };
        }
    }

    async updateKasAmount(nama: string, kasAmount: number): Promise<FileOperationResult> {
        try {
            const data = await this.fileManager.readFile(CONFIG.FILE_PATHS.DATA);
            const userIndex = data.findIndex(user => user.Nama === nama);

            if (userIndex !== -1) {
                data[userIndex]['Jumlah Bayar Kas'] = (data[userIndex]['Jumlah Bayar Kas'] || 0) + kasAmount;
            } else {
                data.push({ Nama: nama, 'Jumlah Bayar Kas': kasAmount });
            }

            await this.fileManager.updateFile(CONFIG.FILE_PATHS.DATA, data);

            // Update draft file
            const draftData = await this.fileManager.readFile(CONFIG.FILE_PATHS.SAVED);
            const draftIndex = draftData.findIndex(user => user.Nama === nama);

            if (draftIndex !== -1) {
                draftData[draftIndex]['Jumlah Bayar Kas'] = 0;
                draftData[draftIndex].Status = "none";
                await this.fileManager.updateFile(CONFIG.FILE_PATHS.SAVED, draftData);
            }

            return { success: true, data: { message: `Cash amount for '${nama}' successfully updated` } };
        } catch (error) {
            return { success: false, error: `Failed to update kas amount: ${error}` };
        }
    }

    async updateDraft(nama: string, kasAmount: number, status: string): Promise<FileOperationResult> {
        try {
            const data = await this.fileManager.readFile(CONFIG.FILE_PATHS.SAVED);
            const userIndex = data.findIndex(user => user.Nama === nama);

            if (userIndex !== -1) {
                data[userIndex]['Jumlah Bayar Kas'] = (data[userIndex]['Jumlah Bayar Kas'] || 0) + kasAmount;
                data[userIndex].Status = status;
            } else {
                data.push({ Nama: nama, 'Jumlah Bayar Kas': kasAmount, Status: status });
            }

            await this.fileManager.updateFile(CONFIG.FILE_PATHS.SAVED, data);
            return { 
                success: true, 
                data: { 
                    message: `Draft data for '${nama}' successfully updated`,
                    updatedData: data
                } 
            };
        } catch (error) {
            return { success: false, error: `Failed to update draft: ${error}` };
        }
    }

    async registerUser(email: string, password: string): Promise<FileOperationResult> {
        try {
            const data = await this.fileManager.readFile(CONFIG.FILE_PATHS.DEMO);
            const userIndex = data.findIndex(user => user.Email === email);
            const hashedPassword = SecurityUtils.hashPassword(password);

            if (userIndex !== -1) {
                data[userIndex]['Checkin Count'] = (data[userIndex]['Checkin Count'] || 0) + 1;
                data[userIndex].Password = hashedPassword;
                data[userIndex].Role = 'user';
            } else {
                data.push({
                    Email: email,
                    Password: hashedPassword,
                    'Checkin Count': 1,
                    Role: 'user'
                });
            }

            await this.fileManager.updateFile(CONFIG.FILE_PATHS.DEMO, data);
            return { success: true, data: { message: `Registration successful for '${email}'` } };
        } catch (error) {
            return { success: false, error: `Failed to register user: ${error}` };
        }
    }

    async verifyLogin(email: string, password: string): Promise<FileOperationResult> {
        try {
            const data = await this.fileManager.readFile(CONFIG.FILE_PATHS.DEMO);
            const user = data.find(u => u.Email === email);

            if (!user) {
                return { success: false, error: 'User not found' };
            }

            if (!SecurityUtils.verifyPassword(password, user.Password)) {
                return { success: false, error: 'Invalid password' };
            }

            // Update check-in count
            await this.handleLogin(email);

            return { 
                success: true, 
                data: { 
                    message: 'Login successful',
                    role: user.Role 
                } 
            };
        } catch (error) {
            return { success: false, error: `Failed to verify login: ${error}` };
        }
    }

    private async handleLogin(email: string): Promise<void> {
        const files = [CONFIG.FILE_PATHS.DATA, CONFIG.FILE_PATHS.DEMO];
        
        for (const filePath of files) {
            const data = await this.fileManager.readFile(filePath);
            const userIndex = data.findIndex(user => user.Email === email);
            
            if (userIndex !== -1) {
                data[userIndex]['Checkin Count'] = (data[userIndex]['Checkin Count'] || 0) + 1;
                await this.fileManager.updateFile(filePath, data);
            }
        }
    }
}

// Initialize managers
const userManager = new UserManager();

// Routes
app.get('/data', async (_req: Request, res: Response) => {
    const result = await userManager.getFilteredUserData();
    if (!result.success) {
        res.status(500).json(result);
    }
    res.json(result);
});

app.get('/berita', async (_req: Request, res: Response) => {
    const result = await userManager.getNews();
    if (!result.success) {
        res.status(500).json(result);
    }
    res.json(result);
});

app.post('/draft', async (req: Request, res: Response) => {
    const { nama, got: kasAmount, sst: status } = req.body;
    
    if (!nama || !status) {
        res.status(400).json({ 
            success: false, 
            error: 'Name and status are required' 
        });
    }

    const result = await userManager.updateDraft(nama, Number(kasAmount) || 0, status);
    if (!result.success) {
        res.status(500).json(result);
    }
    
    res.json(result);
});

app.post('/update_data', async (req: Request, res: Response) => {
    const { nama, jumlah_bayar_kas } = req.body;
    
    if (!nama || jumlah_bayar_kas === undefined) {
        res.status(400).json({ 
            success: false, 
            error: 'Name and cash amount are required' 
        });
    }

    const result = await userManager.updateKasAmount(nama, Number(jumlah_bayar_kas));
    if (!result.success) {
        res.status(500).json(result);
    }
    res.json(result);
});

app.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        res.status(400).json({ 
            success: false, 
            error: 'Email and password are required' 
        });
    }

    const result = await userManager.verifyLogin(email, password);
    if (!result.success) {
        res.status(401).json(result);
    }
    
    res.json(result);
});

app.post('/register', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        res.status(400).json({ 
            success: false, 
            error: 'Email and password are required' 
        });
    }

    const result = await userManager.registerUser(email, password);
    if (!result.success) {
        res.status(500).json(result);
    }
    res.json(result);
});

// Start the server
app.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}/`);
});