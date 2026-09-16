const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Service = require('./models/Service');
const Counter = require('./models/Counter');
const User = require('./models/User');

const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await Service.deleteMany();
        await Counter.deleteMany();

        // Seed Services
        const services = await Service.insertMany([
            { name: 'Vehicle Registration', description: 'New vehicle registration and transfers', averageServiceTime: 20, prefix: 'VR' },
            { name: 'Driving License', description: 'Renewal and new license applications', averageServiceTime: 30, prefix: 'DL' },
            { name: 'Vehicle Inspection', description: 'Technical inspection and clearance', averageServiceTime: 15, prefix: 'VI' },
            { name: 'Revenue License', description: 'Annual revenue license payment', averageServiceTime: 10, prefix: 'RL' }
        ]);

        console.log('Services seeded');

        // Seed Counters (1-to-1 mapping with services)
        await Counter.insertMany([
            { number: 1, servicesHandled: [services[0]._id] }, // Vehicle Registration
            { number: 2, servicesHandled: [services[1]._id] }, // Driving License
            { number: 3, servicesHandled: [services[2]._id] }, // Vehicle Inspection
            { number: 4, servicesHandled: [services[3]._id] }  // Revenue License
        ]);

        console.log('Counters seeded');

        // Seed Users
        await User.deleteMany();

        const superAdminData = {
            name: 'Super Admin',
            email: 'super@vrd.gov.lk',
            password: 'super123',
            phone: '+919000000001',
            role: 'super_admin'
        };

        const adminData = {
            name: 'Counter Manager',
            email: 'admin@vrd.gov.lk',
            password: 'admin123',
            phone: '+919000000002',
            role: 'admin'
        };

        const userData = {
            name: 'Test Citizen',
            email: 'user@example.com',
            password: 'user123',
            phone: '+919000000003',
            role: 'customer'
        };

        await User.create(superAdminData);
        await User.create(adminData);
        await User.create(userData);


        console.log('Users seeded');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
