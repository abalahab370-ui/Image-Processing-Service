const Users = require('../Data/users');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const registHandler = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }

        const duplicate = await Users.findOne({ username }).exec();
        if (duplicate) {
            return res.status(409).json({ message: 'This username already exists. Choose a different one.' });
        }

        // 1. Hash password
        const hashpwd = await bcrypt.hash(password, 10);

        // 2. Sign Refresh Token first
        const refreshToken = jwt.sign(
            { username },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '1d' }
        );

        // 3. MUST AWAIT user creation to get the generated _id
        const newuser = await Users.create({
            username,
            password: hashpwd,
            refreshToken
        });

        // 4. Sign Access Token with the generated _id
        const accessToken = jwt.sign(
            {
                userInfo: {
                    username: newuser.username,
                    userId: newuser._id
                }
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '2h' }
        );

        // 5. Send Cookie and JSON Access Token
        res.cookie('jwt', refreshToken, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.status(201).json({ accessToken });

    } catch (err) {
        console.error('Sir We have an error in Registering users!', err);
        res.status(500).json({ message: 'Registration server error.' });
    }
};

module.exports = registHandler;