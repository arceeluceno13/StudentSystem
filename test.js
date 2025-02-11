const bcrypt = require('bcryptjs');

const plainPassword = '123123';
const saltRounds = 10;

bcrypt.hash(plainPassword, saltRounds, (err, hash) => {
    if (err) throw err;
    console.log('Hashed Password:', hash);
});