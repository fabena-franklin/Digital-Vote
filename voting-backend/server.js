const db = require('./db'); 
const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs'); 
const path = require('path');

const app = express();
const port = 3000;

// Multer handles the temporary 'uploads' folder for the hashing process
const upload = multer({ dest: 'uploads/' });
app.use(express.json());

app.post('/register', upload.single('iris_image'), async (req, res) => {
    try {
        const { aadharnumber, name, phone_number, has_voted ,voterid} = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: "No image file uploaded" });
        }

        const imagePath = req.file.path;

        // --- STEP 1: SPAWN THE PROCESS ---
        // Ensure path points to where app.py is located
        const pythonProcess = spawn('python', [path.join(__dirname, 'app.py'), imagePath]);

        // --- STEP 2: PASTE YOUR NEW CODE HERE ---
        let irisPattern = "";

        // Listen for the hash from Python's print() statement
        pythonProcess.stdout.on('data', (data) => {
            irisPattern += data.toString().trim();
            console.log(`Captured Hash from Python: ${irisPattern}`); 
        });

        // Listen for actual Python errors
        pythonProcess.stderr.on('data', (data) => {
            console.error(`PYTHON SCRIPT ERROR: ${data}`); 
        });

        // Handle the closing of the script and DB insertion
        pythonProcess.on('close', async (code) => {
            console.log(`Python process exited with code ${code}`);
            
            if (code !== 0 || !irisPattern || irisPattern.startsWith("Error")) {
                console.error("❌ Registration failed logic triggered.");
                if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
                return res.status(500).json({ error: "Failed to generate iris hash." });
            }

            try {
                // Database query goes inside the 'close' event
                const query = 'INSERT INTO voters (aadharnumber, iris_template, name, phone_number, has_voted) VALUES ($1, $2, $3, $4, $5)';
                await db.query(query, [aadharnumber, irisPattern, name, phone_number, has_voted === 'true']);
                
                if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
                res.status(201).json({ message: "Registration Successful!", hash: irisPattern });
            } catch (dbErr) {
                console.error("Database Error:", dbErr);
                res.status(500).json({ error: "Database insertion failed" });
            }
        });

    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📂 Temporary storage active in /uploads`);
});