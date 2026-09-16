const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/queue_system');

const FeedbackSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: Number,
    comments: String,
    reply: String,
    createdAt: { type: Date, default: Date.now }
});
const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema);

async function seed() {
    await Feedback.create({
        user: new mongoose.Types.ObjectId(), // Dummy user
        rating: 4,
        comments: "Great service, very fast!"
    });
    console.log("Feedback seeded.");
    process.exit(0);
}
seed();
