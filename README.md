# TipTop Topological Optimization

A demo for visualizing and optimizing 3D models using topological optimization techniques. This application allows users to upload STL models and create optimized versions with reduced material usage while maintaining structural integrity.

## Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/nicolesplaining/tiptop-demo.git
   cd tiptop-demo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Technical Implementation

### Stack

- **React**: Front-end UI framework
- **Three.js**: WebGL-based 3D rendering library
- **STLLoader/STLExporter**: For importing and exporting STL files
- **OrbitControls**: For interactive camera navigation around 3D models

### Project Structure

- `src/App.js`: Main application component
- `src/HardcodedSTLViewer.js`: Core component containing the 3D viewer and optimization logic
- `src/CADViewer.css`: Styling for the application
- `public/models/`: Directory containing sample STL models
