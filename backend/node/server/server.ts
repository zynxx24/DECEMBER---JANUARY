// Import required modules
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import XLSX from 'xlsx';
import axios from 'axios';
import path from 'path';
import bcrypt from 'bcrypt';

// Initialize Express app
const app = express();
const PORT = 5000;
const HOST = 'localhost';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configuration object
const CONFIG = {
    FILE_PATH_USER: path.resolve(__dirname, '../data/data.xlsx'),
    FILE_PATH_BERITA: path.resolve(__dirname, '../data/berita.xlsx'),
    FILE_PATH_SAVED: path.resolve(__dirname, '../data/saved.xlsx'),
    FILE_PATH_AUTH: path.resolve(__dirname, '../data/auth.xlsx'),
    FILE_PATH_KAS: path.resolve(__dirname, '../data/kas.xlsx'),
    FLASK_SERVER_URL: 'http://127.0.0.1:8000/update_kas',
    FLASK_SERVER_URL2: 'http://127.0.0.1:8000/draft',
    
};

// Interface for row data
interface RowData {
    [x: string]: any;
    Nama?: string;
    Kelas?: string;
    'Jumlah Bayar Kas'?: number;
    Nomor?: number;
    Status?: string;
    'Foto Orangnya'?: string;
}

interface User {
    Username: string;
    Password: string;
    Role: string;
}


/*****************************/
/********* UTILITY ***********/
/*****************************/

/**
 * Reads and filters user data from XLSX file.
 * @returns {RowData[]} Filtered data as JSON array.
 */
const readFilteredUserXLSX = (): RowData[] => {
    console.log('Reading user data from file:', CONFIG.FILE_PATH_USER);
    const workbook = XLSX.readFile(CONFIG.FILE_PATH_USER);
    const sheetName = workbook.SheetNames[0];
    console.log('Found sheet name:', sheetName);
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet).map((row: any) => ({
        Nama: row['Nama'],
        Kelas: row['Kelas'],
        Kas: row['Jumlah Bayar Kas'],
        Jabatan: row['Jabatan'],
        Nomor: row['No'],
        Foto: row['Foto Orangnya'],
    }));
    return data;
};

const ReadSaved = (): RowData[] => {
    console.log('Reading user data from file:', CONFIG.FILE_PATH_SAVED);
    const workbook = XLSX.readFile(CONFIG.FILE_PATH_SAVED);
    const sheetName = workbook.SheetNames[0];
    console.log('Found sheet name:', sheetName);
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet).map((row: any) => ({
        Nama: row['Nama'],
        'Jumlah Bayar Kas': row['Jumlah Bayar Kas'],
        Status: row['Status'],
    }));
    return data;
};



/**
 * Reads news data from XLSX file.
 * @returns {any[]} Parsed data as JSON array.
 */
const readNewsXLSX = (): any[] => {
    console.log('Reading news data from file:', CONFIG.FILE_PATH_BERITA);
    const workbook = XLSX.readFile(CONFIG.FILE_PATH_BERITA);
    const sheetName = workbook.SheetNames[0];
    console.log('Found sheet name:', sheetName);
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    return data;
};

/**
 * Reads authentication data from XLSX.
 * @returns {User[]} List of users with roles.
 */
const readAuthXLSX = (): User[] => {
    const workbook = XLSX.readFile(CONFIG.FILE_PATH_AUTH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet) as User[];
};


/**
 * Write updated authentication data to XLSX.
 * @param {User[]} data Authentication data.
 */
const writeAuthXLSX = (data: User[]) => {
    const workbook = XLSX.readFile(CONFIG.FILE_PATH_AUTH);
    const sheetName = workbook.SheetNames[0];
    const worksheet = XLSX.utils.json_to_sheet(data);
    workbook.Sheets[sheetName] = worksheet;
    XLSX.writeFile(workbook, CONFIG.FILE_PATH_AUTH);
};

/**
 * Authenticate a user based on username and password.
 * @param {string} username
 * @param {string} password
 * @returns {User | null} Authenticated user or null.
 */
const authenticateUser = (Username: string, Password: string): User | null => {
    const users = readAuthXLSX();
    const user = users.find((u) => u.Username === Username);
    if (user && bcrypt.compareSync(Password, user.Password)) {
        return user;
    }
    return null;
};

/**
 * Register a new user.
 * @param {string} username
 * @param {string} password
 * @param {string} role
 */
const registerUser = (Username: string, Password: string, Role: string = 'user') => {
    const users = readAuthXLSX();
    if (users.find((u) => u.Username === Username)) {
        throw new Error('Username already exists');
    }
    const hashedPassword = bcrypt.hashSync(Password, 10);
    users.push({ Username, Password: hashedPassword, Role });
    writeAuthXLSX(users);
};

/**
 * Update user role (Admin only).
 * @param {string} username
 * @param {string} newRole
 */
const updateUserRole = (Username: string, newRole: string) => {
    const users = readAuthXLSX();
    const userIndex = users.findIndex((u) => u.Username === Username);
    if (userIndex === -1) {
        throw new Error('User not found');
    }
    users[userIndex].Role = newRole;
    writeAuthXLSX(users);
};

/*****************************/
/********* ROUTES ************/
/*****************************/

/**
 * Fetch user data
 */
app.get('/data', (req: Request, res: Response) => {
    console.log('GET /data request received');
    try {
        const data = readFilteredUserXLSX();
        res.json({ success: true, data });
        console.log('Successfully retrieved filtered user data!');
    } catch (error) {
        console.error('Failed to read user data file:', error);
        res.status(500).json({ success: false, message: 'Failed to read user data file.' });
    }
});

app.get('/draft', (req: Request, res: Response) => {
    console.log('GET /data request received');
    const data = ReadSaved();
    res.json(data);
});

/**
 * Handle check-in requests
 */
app.post('/checkin', async(req: Request, res: Response) => {
    const { nama, kas, status } = req.body;
    const data = readFilteredUserXLSX();
    const user = data.find((row) => row.Nama === nama);
    const got = kas
    const sst = status
    if (user) {
        try {
            data.push({ Nama: nama, Kas: got, Status: 'Pending' });
            const response = await axios.post(CONFIG.FLASK_SERVER_URL2, {
                nama, got, sst
            });
                console.log('Successfully sent data to Flask server:', response.data);
            } catch (error) {
                console.error('Failed to send data to Flask server:', error);
            }
        res.status(201).json({ message: 'Check-in request sent!' });
    }
});

/**
 * Fetch news data
 */
app.get('/berita', (req: Request, res: Response) => {
    console.log('GET /berita request received');
    try {
        const data = readNewsXLSX();
        res.json({ success: true, data });
        console.log('Successfully retrieved news data!');
    } catch (error) {
        console.error('Failed to read news data file:', error);
    }
});

/**
 * Approve or reject user requests
 */
app.post('/approve', async (req: Request, res: Response) => {
    console.log('POST /approve request received');
  
    // Destructure and validate the required fields
    const { nama, approve, kasAmount } = req.body;

  
    // Prepare the user data
    const user = {
      nama,
      jumlah_bayar_kas: kasAmount,
      status: approve ? 'Approved' : 'Rejected',
    };
  
    console.log(`Updating user status for ${user.nama} to ${user.status}`);
  
    try {
      // Send data to Flask server
      const response = await axios.post(CONFIG.FLASK_SERVER_URL, {
        nama: user.nama,
        jumlah_bayar_kas: user.jumlah_bayar_kas,
      });
  
      console.log('Successfully sent data to Flask server:', response.data);
  
      // Respond back to the client
      res.status(200).json({
        message: `User ${user.nama} successfully processed.`,
        serverResponse: response.data,
      });
    } catch (error) {
      console.error('Failed to send data to Flask server:', error);
  
      // Respond with
    }
});

  /**
 * Login route.
 */
app.post('/login', (req: Request, res: Response) => {
    const { Username, Password } = req.body;

    if (!Username || !Password) {
        res.status(400).json({ success: false, message: 'Username and Password are required' });
    }

    try {
        const user = authenticateUser(Username, Password);
        if (user) {
            // Return minimal information for security
            res.json({ success: true, Role: user.Role });
        } else {
            res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Login error:', error); // Logging the exact error for debugging
        res.status(500).json({ success: false, message: 'An internal error occurred during login' });
    }
});


/**
 * Register route (Admin only).
 */
app.post('/register', (req: Request, res: Response) => {
    const { adminUsername, adminPassword, username, password, role } = req.body;

    if (!adminUsername || !adminPassword || !username || !password) {
        res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try {
        // Validate admin credentials
        const admin = authenticateUser(adminUsername, adminPassword);
        if (!admin || admin.Role !== 'admin') {
            res.status(403).json({ success: false, message: 'Access denied. Admin credentials are invalid.' });
        }

        // Register the new user
        try {
            registerUser(username, password, role || 'user');
            res.status(201).json({ success: true, message: 'User registered successfully' });
        } catch (err: any) {
            if (err.message === 'Username already exists') {
                res.status(409).json({ success: false, message: 'Username already exists' });
            }
            throw err; // For unexpected errors
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'An internal error occurred during registration' });
    }
});


/**
 * Update role route (Admin only).
 */
app.put('/update-role', (req: Request, res: Response) => {
    const { adminUsername, adminPassword, username, newRole } = req.body;
    try {
        const admin = authenticateUser(adminUsername, adminPassword);
        if (admin?.Role !== 'admin') {
            res.status(403).json({ success: false, message: 'Access denied' });
        }
        updateUserRole(username, newRole);
        res.status(200).json({ success: true, message: 'Role updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error });
    }
});

            
// Start the server
app.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}/`);
});
