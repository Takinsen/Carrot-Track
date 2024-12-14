const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const app = express();
const port = 80;

// Path to the JSON file where messages will be stored
const DATA_FILE = './foodData.json';
const TYPE_FILE = './foodTypes.json';
const GROUP_FILE = './groups.json';
const USER_FILE = './users.json';

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

// Initialize messages array by reading from file (if it exists)
let foodData = [];
if (fs.existsSync(DATA_FILE)) {
    const fileData = fs.readFileSync(DATA_FILE, 'utf-8');
    foodData = JSON.parse(fileData) || [];
}

let foodTypes = [];
if (fs.existsSync(TYPE_FILE)) {
    const fileData = fs.readFileSync(TYPE_FILE, 'utf-8');
    foodTypes = JSON.parse(fileData) || [];
}


// Initialize groups array by reading from file (if it exists)
let groups = [];
if (fs.existsSync(GROUP_FILE)) {
    const fileData = fs.readFileSync(GROUP_FILE, 'utf-8');
    groups = JSON.parse(fileData) || [];
}

let users = [];
if (fs.existsSync(USER_FILE)) {
    const fileData = fs.readFileSync(USER_FILE, 'utf-8');
    users = JSON.parse(fileData) || [];
}

// Store connected clients for SSE notifications
let clients = [];
let clientsCount = 0;

// API endpoint to get all messages
app.get('/api/foodData', (req, res) => {
    const search = req.query.search;
    const lowerKeyword = search.toLowerCase();
    if (search == '')
        res.json(foodData);
    else
        res.json(foodData.filter(food => food.tag.toLowerCase() === (lowerKeyword)))
});

//
app.get('/api/foodType', (req, res) => {
    const search = req.query.search;
    const lowerKeyword = search.toLowerCase();
    if (search == '')
        res.json(foodTypes);
    else
        res.json(foodTypes.filter(food => food.name.toLowerCase().includes(lowerKeyword)))
});

// API endpoint to get all groups
app.get('/api/groups', (req, res) => {
    res.json(groups);
});

// Endpoint to handle food data and file upload
app.post('/api/addFoodData', upload.single('image'), (req, res) => {
    const { name, cal, loc, tag } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !cal || !imagePath) {
        return res.status(400).json({ error: 'Name, calorie data, and image are required.' });
    }

    // Add the new food data
    const newFoodData = { name, cal, loc, tag, imagePath };
    foodData.push(newFoodData); 
    
    /*
    // Add new food Types
    if (!foodTypes.some(food => food.name.toLowerCase() === name.toLowerCase())) {
        var num = 1;
        var avgCal = parseInt(cal);
        foodTypes.push({ name , num, avgCal, imagePath});
        fs.writeFileSync(TYPE_FILE, JSON.stringify(foodTypes, null, 2), 'utf-8');
    }
    // edit food types
    else{
        const foodType = foodTypes.find(food => food.name.toLowerCase() == name.toLowerCase());
        foodType.avgCal = parseInt((foodType.avgCal*foodType.num + parseInt(cal)) / (foodType.num+1));
        foodType.num = foodType.num+1;
        fs.writeFileSync(TYPE_FILE, JSON.stringify(foodTypes, null, 2), 'utf-8');
    }
    */

    // add new food to tag
    const foodType = foodTypes.find(food => food.name.toLowerCase() === tag.toLowerCase());
    // base case
    if (foodType.num == 0){
        foodType.avgCal = parseInt(cal);
        foodType.num = 1;
        foodType.imagePath = imagePath;
    }
    else {
        foodType.avgCal = parseInt((foodType.avgCal*foodType.num + parseInt(cal)) / (foodType.num+1));
        foodType.num = foodType.num+1;
    }
    fs.writeFileSync(TYPE_FILE, JSON.stringify(foodTypes, null, 2), 'utf-8');

    

    // Save the updated foodData array to the JSON file
    fs.writeFileSync(DATA_FILE, JSON.stringify(foodData, null, 2), 'utf-8');

    // Send a response confirming the data was added
    res.status(201).json({ message: 'Food data added successfully!', data: newFoodData });
});

// Static file serving for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// API endpoint for Server-Sent Events (SSE) to notify clients
app.get('/api/notify', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send a "connected" message initially
    res.write('data: connected\n\n');


    // Add the client's response object to the array
    clients.push(res);
    clientsCount ++;
    updateClientCount();
    //console.log(clientsCount);

    // Remove the client when the connection is closed
    req.on('close', () => {
        clients = clients.filter(client => client !== res);
        clientsCount --;
        updateClientCount();
        //console.log(clientsCount);
    });
});

app.get('/api/userCount', (req, res) => {
    res.json({count : clientsCount});
})

app.get('/api/userPassword', (req, res) => {
    const userPassword = JSON.parse(req.query.userPassword);
    //console.log(userPassword)
    let exist = false;
    users.forEach(us =>{
        if (us.name == userPassword.name){
            exist = true;
            if (us.password == userPassword.password){
                res.json({pass: "yes"});
            }
            else {
                res.json({pass: "no"});
            }
        }
    })

    if (!exist && userPassword.name != ""){
        users.push(userPassword);
        fs.writeFileSync(USER_FILE, JSON.stringify(users, null, 2), 'utf-8');
        res.json({pass: "new"});
    }
    else if (!exist && userPassword.name == ""){
        res.json({pass: "no"});
    }

}) 


// Function to notify all clients
function notifyClients() {
    clients.forEach(client => {
        // console.log('sse sended')
        client.write('data: fetch\n\n'); // Send an SSE message to each client
    });
}

// Update clientsCount
function updateClientCount(){
    clients.forEach(client => {
        // console.log('sse sended')
        client.write('data: clientUpdate\n\n'); // Send an SSE message to each client
    });
}


// Start the server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${port}`);
});
