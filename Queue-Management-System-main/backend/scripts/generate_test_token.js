const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/queue_system');
const User = require('./models/User');

async function run() {
    const admin = await User.findOne({ role: 'super_admin' });
    if (!admin) {
        console.log("No super_admin found.");
        process.exit(1);
    }
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log("TOKEN=" + token);
    process.exit(0);
}
run();
