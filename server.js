const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // Allows us to accept JSON data from the frontend

// ==========================================
// 1. HELPER FUNCTIONS
// ==========================================

// Calculate Manhattan Distance between two points
const getManhattanDistance = (p1, p2) => Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);

// Generate all possible orders to visit the stones
const getPermutations = (arr) => {
    if (arr.length === 0) return [[]];
    const result = [];
    for (let i = 0; i < arr.length; i++) {
        const rest = getPermutations([...arr.slice(0, i), ...arr.slice(i + 1)]);
        for (let j = 0; j < rest.length; j++) {
            result.push([arr[i], ...rest[j]]);
        }
    }
    return result;
};

// ==========================================
// 2. CORE LOGIC
// ==========================================

const findShortestPath = (start, stones) => {
    // If there are no stones, she just stays at the start
    if (stones.length === 0) return { distance: 0, path: [start, start] };

    const permutations = getPermutations(stones);
    let minDistance = Infinity;
    let bestPath = [];

    // Brute-force check every single possible route
    for (const currentPath of permutations) {
        let totalDistance = 0;
        
        // 1. Distance from Start to the First Stone
        totalDistance += getManhattanDistance(start, currentPath[0]);

        // 2. Distance jumping between the rest of the stones
        for (let i = 0; i < currentPath.length - 1; i++) {
            totalDistance += getManhattanDistance(currentPath[i], currentPath[i + 1]);
        }

        // 3. Distance from the Last Stone back to Start
        totalDistance += getManhattanDistance(currentPath[currentPath.length - 1], start);

        // If this route is shorter than our previous best, save it
        if (totalDistance < minDistance) {
            minDistance = totalDistance;
            // Save the exact sequence of coordinates so the frontend can draw it
            bestPath = [start, ...currentPath, start]; 
        }
    }

    return {
        distance: minDistance,
        route: bestPath
    };
};

// ==========================================
// 3. API ENDPOINT
// ==========================================

app.post('/api/calculate-path', (req, res) => {
    try {
        const { start, stones } = req.body;

        // Basic validation to ensure the frontend sent the right data
        if (!start || !start.x || !start.y || !Array.isArray(stones)) {
            return res.status(400).json({ error: "Invalid data format provided." });
        }
        if (stones.length > 10) {
            return res.status(400).json({ error: "Maximum of 10 stones allowed." });
        }

        // Run the algorithm
        const result = findShortestPath(start, stones);

        // Send the result back to the frontend
        res.status(200).json({
            success: true,
            message: `The shortest path length is ${result.distance}`,
            totalDistance: result.distance,
            visualRoute: result.route
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Jadrolita API is running on http://localhost:${PORT}`);
});