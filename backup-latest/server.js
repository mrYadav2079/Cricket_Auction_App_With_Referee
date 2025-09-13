const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = 'auctionData.json';
const url='http://localhost:3000';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
        teamABudget: 100.0,
        teamBBudget: 100.0,
        teamASquad: [],
        teamBSquad: [],
        unsoldPlayers: [],
        availablePlayers: {
            Batsmen: [
                { name: "Amit Singh", basePrice: 2.0 },
                { name: "Amit RLI", basePrice: 2.0 },
                { name: "Govind", basePrice: 2.0 },
                { name: "Manjit", basePrice: 2.0 },
                { name: "Prabhat", basePrice: 2.0 },
                { name: "Prakash", basePrice: 2.0 },
                { name: "Rajan", basePrice: 2.0 }
            ],
            Bowlers: [
                { name: "Jasprit Bumrah", basePrice: 2.0 },
                { name: "Mohammed Shami", basePrice: 2.0 },
                { name: "Yuzvendra Chahal", basePrice: 2.0 },
                { name: "Bhuvneshwar Kumar", basePrice: 2.0 },
                { name: "Kuldeep Yadav", basePrice: 2.0 },
                { name: "Mohammed Siraj", basePrice: 2.0 }
            ],
            Allrounders: [
                { name: "Hardik Pandya", basePrice: 2.0 },
                { name: "Ravindra Jadeja", basePrice: 2.0 },
                { name: "Washington Sundar", basePrice: 2.0 },
                { name: "Axar Patel", basePrice: 2.0 },
                { name: "Deepak Hooda", basePrice: 2.0 },
                { name: "Krunal Pandya", basePrice: 2.0 }
            ]
        },
        defaultPlayers: {
            Batsmen: [
                { name: "Amit Singh", basePrice: 2.0 },
                { name: "Amit RLI", basePrice: 2.0 },
                { name: "Govind", basePrice: 2.0 },
                { name: "Manjit", basePrice: 2.0 },
                { name: "Prabhat", basePrice: 2.0 },
                { name: "Prakash", basePrice: 2.0 },
                { name: "Rajan", basePrice: 2.0 }
            ],
            Bowlers: [
                { name: "Jasprit Bumrah", basePrice: 2.0 },
                { name: "Mohammed Shami", basePrice: 2.0 },
                { name: "Yuzvendra Chahal", basePrice: 2.0 },
                { name: "Bhuvneshwar Kumar", basePrice: 2.0 },
                { name: "Kuldeep Yadav", basePrice: 2.0 },
                { name: "Mohammed Siraj", basePrice: 2.0 }
            ],
            Allrounders: [
                { name: "Hardik Pandya", basePrice: 2.0 },
                { name: "Ravindra Jadeja", basePrice: 2.0 },
                { name: "Washington Sundar", basePrice: 2.0 },
                { name: "Axar Patel", basePrice: 2.0 },
                { name: "Deepak Hooda", basePrice: 2.0 },
                { name: "Krunal Pandya", basePrice: 2.0 }
            ]
        }
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

// Helper function to read data
function readData() {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

// Helper function to write data
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Routes
app.get('/api/data', (req, res) => {
    const data = readData();
    res.json(data);
});

app.post('/api/update', (req, res) => {
    const newData = req.body;
    writeData(newData);
    res.json({ success: true, message: 'Data updated successfully' });
});

app.post('/api/reset', (req, res) => {
    const data = readData();
    const initialData = {
        teamABudget: 100.0,
        teamBBudget: 100.0,
        teamASquad: [],
        teamBSquad: [],
        unsoldPlayers: [],
        availablePlayers: JSON.parse(JSON.stringify(data.defaultPlayers)),
        defaultPlayers: data.defaultPlayers
    };
    writeData(initialData);
    res.json({ success: true, message: 'Auction reset successfully' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});