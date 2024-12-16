const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const app = express();
const port = process.env.PORT || 80;

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI; // Replace with your MongoDB URI
const DATABASE_NAME = 'foodApp';
let db;

// Connect to MongoDB
MongoClient.connect(MONGO_URI)
    .then(client => {
        db = client.db(DATABASE_NAME);
        console.log('Connected to MongoDB');
    })
    .catch(err => console.error(err));

// Use body-parser to handle JSON requests
app.use(bodyParser.json());

// Enable CORS to allow requests from different origins
app.use(cors());

app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads'; // Directory to store uploaded files
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir); // Create the directory if it doesn't exist
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

app.use(express.json());

// API endpoint to get all food data
app.get('/api/foodData', async (req, res) => {
    try {
        const search = req.query.search || '';
        const filter = search ? { tag: { $regex: search, $options: 'i' } } : {};
        const foodData = await db.collection('foodData').find(filter).toArray();
        res.json(foodData);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch food data.' });
    }
});

// API endpoint to get all food types
app.get('/api/foodType', async (req, res) => {
    try {
        const search = req.query.search || '';
        const filter = search ? { name: { $regex: search, $options: 'i' } } : {};
        const foodTypes = await db.collection('foodTypes').find(filter).toArray();
        res.json(foodTypes);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch food types.' });
    }
});

// API endpoint to get all groups
app.get('/api/groups', async (req, res) => {
    try {
        const groups = await db.collection('groups').find().toArray();
        res.json(groups);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch groups.' });
    }
});

// Endpoint to get selected items
app.post('/api/selectedItems', async (req, res) => {
    const { selectedDataSet, selectedTypeSet } = req.body;
    try {
        const queries = [];
    
        // Query foodData collection for matches with selectedDataSet
        if (selectedDataSet && selectedDataSet.length > 0) {
            queries.push(
                db.collection('foodData').find({ imagePath: { $in: selectedDataSet } }).toArray()
            );
        } else {
            queries.push(Promise.resolve([])); // Return an empty array if selectedDataSet is empty
        }
    
        // Query foodTypes collection for matches with selectedTypeSet
        if (selectedTypeSet && selectedTypeSet.length > 0) {
            queries.push(
                db.collection('foodTypes').find({ name: { $in: selectedTypeSet } }).toArray()
            );
        } else {
            queries.push(Promise.resolve([])); // Return an empty array if selectedTypeSet is empty
        }
    
        // Execute all queries in parallel
        const [itemsSet1, itemsSet2] = await Promise.all(queries);
    
        // Respond with matched items from both collections
        res.json({
            set1Matches: itemsSet1,
            set2Matches: itemsSet2
        });
    } catch (error) {
        console.error('Error processing match-items request:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});


// Endpoint to handle food data and file upload
app.post('/api/addFoodData', upload.single('image'), async (req, res) => {
  const { name, cal, loc, tag } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  if (!name || !cal || !imagePath) {
      return res.status(400).json({ error: 'Name, calorie data, and image are required.' });
  }

  try {
      const newFoodData = { name, cal: parseInt(cal), loc, tag, imagePath };

      // Add the new food data to the `foodData` collection
      await db.collection('foodData').insertOne(newFoodData);

      // Check the food type
      const foodType = await db.collection('foodTypes').findOne({ name: tag });

      if (foodType) {
          // If the food type exists, update its properties
          if (foodType.num === 0) {
              // If `num` is 0, take properties from the first matching food data
              await db.collection('foodTypes').updateOne(
                  { name: tag },
                  { $set: { avgCal: parseInt(cal), num: 1, imagePath } }
              );
          } else {
              // Otherwise, update the `avgCal` and increment `num`
              const updatedAvgCal = Math.round(
                  ((foodType.avgCal * foodType.num) + parseInt(cal)) / (foodType.num + 1)
              );
              await db.collection('foodTypes').updateOne(
                  { name: tag },
                  { $set: { avgCal: updatedAvgCal }, $inc: { num: 1 } }
              );
          }
      } else {
          // If the food type doesn't exist, return an error (or handle it differently)
          return res.status(400).json({ error: `Food type '${tag}' does not exist.` });
      }

      res.status(201).json({ message: 'Food data added successfully!', data: newFoodData });
  } catch (err) {
      res.status(500).json({ error: 'Failed to add food data.' });
  }
});

// Static file serving for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Start the server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${port}`);
});