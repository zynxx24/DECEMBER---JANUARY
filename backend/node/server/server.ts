import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import XLSX from 'xlsx';
import path from 'path';
import * as crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createLogger, error, format, transports } from 'winston';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = 5000;
const HOST = process.env.HOST || 'localhost';

// Configure Winston logger
const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' })
  ]
});

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true,
}));
app.use(bodyParser.json({ limit: '100kb' })); // Limit payload size

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(limiter);
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
    SALT: '53 0b 63 cb 3a 8e 27 57 40 8b a3 52 b2 1d 0d b9 72 43 44 ac 2f 76 52 ed da 0f 78 29 9d 8d e5 32'
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
    lastLogin?: Date;
    failedLoginAttempts?: number;
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
    timestamp?: Date;
}


class SecurityUtils {
    static hashPassword(password: string): string {
        const salt = crypto.randomBytes(16); 
        const hash = crypto.pbkdf2Sync(password, salt, 10000, 256, 'sha256');
        return `${salt.toString('binary')}:${hash.toString('binary')}`; 
    }

    // Verify the password against the stored hash
    static verifyPassword(inputPassword: string, storedHash: string): boolean {
        try {
            const [saltBinary, hashBinary] = storedHash.split(':');
            const salt = Buffer.from(saltBinary, 'binary'); 
            const inputHash = crypto.pbkdf2Sync(inputPassword, salt, 10000, 256, 'sha256');
            return inputHash.toString('binary') === hashBinary; 
        } catch (error) {
            return false;
        }
    }

    // Generate a secure random token
    static generateToken(): string {
        return crypto.randomBytes(32).toString('binary'); // Binary token
    }

    // Sanitize input to prevent basic injection
    static sanitizeInput(input: string): string {
        return input.replace(/[<>{}]/g, ''); // Simplistic sanitization
    }
}



// Error Handler Middleware
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Error:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    res.status(500).json({
        success: false,
        error: 'Internal server error',
        requestId: crypto.randomBytes(8).toString('hex')
    });
};

// Enhanced File Operations with Backup
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
            logger.error(`Failed to load workbook: ${error}`);
            throw new Error(`Failed to load workbook: ${error}`);
        }
    }

    async saveWorkbook(workbook: XLSX.WorkBook, filePath: string): Promise<void> {
        try {
            // Create backup before saving
            const backupPath = `${filePath}.backup`;
            if (await this.fileExists(filePath)) {
                await this.copyFile(filePath, backupPath);
            }

            XLSX.writeFile(workbook, filePath);
        } catch (error) {
            logger.error(`Failed to save workbook: ${error}`);
            throw new Error(`Failed to save workbook: ${error}`);
        }
    }

    private async fileExists(filePath: string): Promise<boolean> {
        try {
            await import('fs').then(fs => fs.promises.access(filePath));
            return true;
        } catch {
            return false;
        }
    }

    private async copyFile(src: string, dest: string): Promise<void> {
        const fs = await import('fs').then(fs => fs.promises);
        await fs.copyFile(src, dest);
    }

    async readFile(filePath: string): Promise<any[]> {
        try {
            const workbook = await this.loadWorkbook(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            return XLSX.utils.sheet_to_json(sheet);
        } catch (error) {
            logger.error(`Failed to read file: ${error}`);
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
            logger.error(`Failed to update file: ${error}`);
            throw new Error(`Failed to update file: ${error}`);
        }
    }
}

// Enhanced User Management
class UserManager {
    private fileManager: ExcelFileManager;
    loginAttempts: any;

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

    async verifyLogin(email: string, password: string): Promise<FileOperationResult> {
        try {
            // Check login attempts
            const attempts = this.loginAttempts.get(email) || { count: 0, lastAttempt: new Date() };
            
            if (attempts.count >= 5 && 
                (new Date().getTime() - attempts.lastAttempt.getTime()) < 15 * 60 * 1000) {
                return { 
                    success: false, 
                    error: 'Account temporarily locked. Please try again later.',
                    timestamp: new Date()
                };
            }

            const data = await this.fileManager.readFile(CONFIG.FILE_PATHS.DEMO);
            const user = data.find(u => u.Email === email);

            if (!user) {
                this.updateLoginAttempts(email, false);
                return { success: false, error: 'User not found' };
            }

            if (!SecurityUtils.verifyPassword(password, user.Password)) {
                this.updateLoginAttempts(email, false);
                return { success: false, error: 'Invalid password' };
            }

            // Reset login attempts on successful login
            this.loginAttempts.delete(email);

            // Update login timestamp and reset failed attempts
            await this.handleLogin(email);

            return { 
                success: true, 
                data: { 
                    message: 'Login successful',
                    role: user.Role,
                    token: SecurityUtils.generateToken()
                },
                timestamp: new Date()
            };
        } catch (error) {
            logger.error(`Failed to verify login: ${error}`);
            return { 
                success: false, 
                error: `Failed to verify login: ${error}`,
                timestamp: new Date()
            };
        }
    }
    handleLogin(email: string) {
        throw new Error('Method not implemented.');
    }

    private updateLoginAttempts(email: string, success: boolean): void {
        const attempts = this.loginAttempts.get(email) || { count: 0, lastAttempt: new Date() };
        
        if (!success) {
            attempts.count++;
            attempts.lastAttempt = new Date();
            this.loginAttempts.set(email, attempts);
        } else {
            this.loginAttempts.delete(email);
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

    async getdraft(): Promise<FileOperationResult> {
        try {
            const data = await this.fileManager.readFile(CONFIG.FILE_PATHS.SAVED);
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

app.get('/draft', async (_req: Request, res: Response) => {
    const result = await userManager.getdraft()
    if (!result.success) {
        res.status(500).json(result);
    }
    res.json(result);
});

app.post('/approve', async (req: Request, res: Response) => {
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

const validateLoginRequest = (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    
    if (!email || !password || 
        typeof email !== 'string' || 
        typeof password !== 'string' ||
        email.length > 100 || 
        password.length > 100) {
        res.status(400).json({ 
            success: false, 
            error: 'Invalid input data'
        });
    }

    next();
};

app.post('/login', validateLoginRequest, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        const result = await userManager.verifyLogin(email, password);
        
        if (!result.success) {
            res.status(401).json(result);
        }
        
        res.json(result);
    } catch (error) {
        next(error);
    }
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