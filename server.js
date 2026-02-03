const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// --- MongoDB Connection ---
const mongoURI = "mongodb+srv://trunjbgmi_db_user:easypassword1234@cluster2.3hpa4dj.mongodb.net/iot_project?retryWrites=true&w=majority";
mongoose.connect(mongoURI).then(() => console.log("Cloud Database Connected!")).catch(err => console.log(err));

// --- Data Schema ---
const SensorSchema = new mongoose.Schema({
    temperature: Number, humidity: Number, smoke: Number,
    fire: Boolean, pir: Boolean, safety: Boolean,
    motorState: Boolean, load1State: Boolean, load2State: Boolean, load3State: Boolean,
    timestamp: { type: Date, default: Date.now }
});
const Data = mongoose.model('Data', SensorSchema);

// --- API for ESP8266 to Send Data ---
app.post('/api/update', async (req, res) => {
    try {
        const newData = new Data(req.body);
        await newData.save();
        io.emit('sensorUpdate', req.body); // Send to Web Dashboard instantly
        res.status(200).send("Data Received");
    } catch (err) {
        res.status(500).send(err);
    }
});

// --- API to Get Control Commands (For ESP8266) ---
let lastCommand = { device: "", state: "" };
app.post('/api/control', (req, res) => {
    lastCommand = req.body;
    io.emit('commandSent', lastCommand);
    res.status(200).send("Command queued");
});

app.get('/api/get-command', (req, res) => {
    res.json(lastCommand);
    // lastCommand = { device: "", state: "" }; // Clear after read (optional)
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));