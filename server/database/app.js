const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const port = 3030;

app.use(cors());
app.use(express.json());

const Reviews = require('./review');
const Dealerships = require('./dealership');

// Express route to home
app.get('/', async (req, res) => {
    res.send("Welcome to the Mongoose API");
});

// Express route to fetch all reviews
app.get('/fetchReviews', async (req, res) => {
  try {
    const documents = await Reviews.find();
    res.json(documents);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Express route to fetch reviews by a particular dealer
app.get('/fetchReviews/dealer/:id', async (req, res) => {
  try {
    const documents = await Reviews.find({dealership: req.params.id});
    res.json(documents);
  } catch (error) {
    console.error('Error fetching dealer reviews:', error);
    res.status(500).json({ error: 'Error fetching dealer reviews' });
  }
});

// Express route to fetch all dealerships
app.get('/fetchDealers', async (req, res) => {
  try {
    const documents = await Dealerships.find().sort({ id: 1 });
    res.json(documents);
  } catch (error) {
    console.error('Error fetching dealerships:', error);
    res.status(500).json({ error: 'Error fetching dealerships' });
  }
});

// Express route to fetch Dealers by a particular state
app.get('/fetchDealers/:state', async (req, res) => {
  try {
    const escapedState = req.params.state.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let documents;
    if (req.params.state.toLowerCase() === 'all') {
      documents = await Dealerships.find().sort({ id: 1 });
    } else {
      documents = await Dealerships.find({
        state: new RegExp(`^${escapedState}$`, 'i')
      }).sort({ id: 1 });
    }
    res.json(documents);
  } catch (error) {
    console.error('Error fetching dealerships by state:', error);
    res.status(500).json({ error: 'Error fetching dealerships by state' });
  }
});

// Express route to fetch dealer by a particular id
app.get('/fetchDealer/:id', async (req, res) => {
  try {
    const document = await Dealerships.findOne({ id: Number(req.params.id) });
    if (!document) {
      return res.status(404).json({ error: 'Dealership not found' });
    }
    res.json(document);
  } catch (error) {
    console.error('Error fetching dealership:', error);
    res.status(500).json({ error: 'Error fetching dealership' });
  }
});

//Express route to insert review
app.post('/insert_review', async (req, res) => {
  try {
    const data = req.body;
    const latestReview = await Reviews.findOne().sort({ id: -1 });
    const savedReview = await Reviews.create({
      id: latestReview ? latestReview.id + 1 : 1,
      name: data.name,
      dealership: Number(data.dealership),
      review: data.review,
      purchase: Boolean(data.purchase),
      purchase_date: data.purchase_date,
      car_make: data.car_make,
      car_model: data.car_model,
      car_year: Number(data.car_year),
    });
    res.json(savedReview);
  } catch (error) {
    console.error('Error inserting review:', error);
    res.status(500).json({ error: 'Error inserting review' });
  }
});

async function start() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongo_db:27017/', {
    dbName: 'dealershipsDB',
  });

  const reviews = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'data', 'reviews.json'), 'utf8')
  ).reviews;
  const dealerships = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'data', 'dealerships.json'), 'utf8')
  ).dealerships;

  if (await Reviews.countDocuments() === 0) {
    await Reviews.insertMany(reviews);
  }
  if (await Dealerships.countDocuments() === 0) {
    await Dealerships.insertMany(dealerships);
  }

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error('Unable to start dealership API:', error);
  process.exitCode = 1;
});
