const bcrypt = require('bcrypt');
const userPassword = 'user_password'; // Replace with the actual password
bcrypt.hash(userPassword,(err, hash) => {
    if (err) {
        // Handle error
        return;
    }

// Hashing successful, 'hash' contains the hashed password
console.log('Hashed password:', hash);
});