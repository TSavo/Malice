import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Root directory for world files
const WORLD_ROOT = path.join(__dirname, '../src/database/bootstrap/world');

function extractCoordsFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const regex = /x:\s*(-?\d+),\s*y:\s*(-?\d+),\s*z:\s*(-?\d+)/g;
  const matches = [];
  let match;
  while ((match = regex.exec(content))) {
    const relativePath = path.relative(WORLD_ROOT, filePath);
    matches.push({
      x: parseInt(match[1]),
      y: parseInt(match[2]),
      z: parseInt(match[3]),
      file: path.basename(filePath),
      path: relativePath,
    });
  }
  return matches;
}

function scanDirectory(dir) {
  let coords = [];
  if (!fs.existsSync(dir)) return coords;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      coords = coords.concat(scanDirectory(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      coords = coords.concat(extractCoordsFromFile(fullPath));
    }
  }
  return coords;
}

console.log('Scanning world directory...');
const allCoords = scanDirectory(WORLD_ROOT);
console.log(`Found ${allCoords.length} coordinate entries`);

// Generate HTML with embedded Three.js visualization
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Malice World Map - 3D Visualization</title>
  <style>
    body {
      margin: 0;
      overflow: hidden;
      font-family: monospace;
      background: #000;
      color: #0f0;
    }
    #info {
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.8);
      padding: 15px;
      border: 1px solid #0f0;
      max-width: 300px;
      z-index: 100;
    }
    #info h2 {
      margin: 0 0 10px 0;
      color: #0ff;
    }
    #controls {
      position: absolute;
      bottom: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.8);
      padding: 10px;
      border: 1px solid #0f0;
    }
    button {
      background: #000;
      color: #0f0;
      border: 1px solid #0f0;
      padding: 5px 10px;
      margin: 2px;
      cursor: pointer;
      font-family: monospace;
    }
    button:hover {
      background: #0f0;
      color: #000;
    }
  </style>
</head>
<body>
  <div id="info">
    <h2>Malice World Map</h2>
    <div id="stats"></div>
  </div>
  <div id="controls">
    <button onclick="viewSurface()">Surface (z=0)</button>
    <button onclick="viewUnderground()">Underground</button>
    <button onclick="viewTower()">Smith Tower</button>
    <button onclick="viewAll()">View All</button>
  </div>

  <script type="importmap">
    {
      "imports": {
        "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
        "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
      }
    }
  </script>

  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

    // World data
    const worldData = ${JSON.stringify(allCoords, null, 2)};

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 50, 300);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 50, 100);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(50, 100, 50);
    scene.add(directionalLight);

    // Grid helper
    const gridHelper = new THREE.GridHelper(200, 50, 0x00ff00, 0x003300);
    scene.add(gridHelper);

    // Create materials for different z-levels
    function getColorForZ(z) {
      if (z < 0) {
        // Underground - blue to purple gradient
        const depth = Math.abs(z);
        return new THREE.Color().setHSL(0.6 - depth * 0.02, 0.8, 0.4);
      } else if (z === 0) {
        // Surface - green
        return new THREE.Color(0x00ff00);
      } else {
        // Above ground - yellow to red gradient
        return new THREE.Color().setHSL(0.15 - z * 0.003, 0.9, 0.5);
      }
    }

    // Create room cubes
    const roomGroup = new THREE.Group();
    const roomSize = 1.8;
    const geometry = new THREE.BoxGeometry(roomSize, roomSize, roomSize);

    worldData.forEach(room => {
      const material = new THREE.MeshPhongMaterial({
        color: getColorForZ(room.z),
        transparent: true,
        opacity: 0.8,
        emissive: getColorForZ(room.z),
        emissiveIntensity: 0.2,
      });

      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(room.x * 2, room.z * 2, -room.y * 2); // Note: y and z swapped for better view
      cube.userData = room;
      roomGroup.add(cube);
    });

    scene.add(roomGroup);

    // Add axes helper
    const axesHelper = new THREE.AxesHelper(50);
    scene.add(axesHelper);

    // Statistics
    const zLevels = [...new Set(worldData.map(r => r.z))].sort((a, b) => b - a);
    const stats = document.getElementById('stats');
    stats.innerHTML = \`\` +
      '<strong>Total Rooms:</strong> ' + worldData.length + '<br>' +
      '<strong>Z-Levels:</strong> ' + Math.min(...zLevels) + ' to ' + Math.max(...zLevels) + '<br>' +
      '<strong>Levels:</strong> ' + zLevels.length + '<br>' +
      '<br>' +
      '<strong>Controls:</strong><br>' +
      'Left Click + Drag: Rotate<br>' +
      'Right Click + Drag: Pan<br>' +
      'Scroll: Zoom<br>' +
      '<br>' +
      '<strong>Colors:</strong><br>' +
      '<span style="color: #6666ff">Blue/Purple</span>: Underground<br>' +
      '<span style="color: #00ff00">Green</span>: Surface (z=0)<br>' +
      '<span style="color: #ffaa00">Yellow/Orange</span>: Buildings<br>' +
      '<span style="color: #ff6600">Red</span>: High floors<br>';

    // View presets
    window.viewSurface = () => {
      camera.position.set(0, 80, 0);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
    };

    window.viewUnderground = () => {
      camera.position.set(-20, -10, 40);
      camera.lookAt(-10, -8, 0);
      controls.target.set(-10, -8, 0);
    };

    window.viewTower = () => {
      camera.position.set(-25, 40, 30);
      camera.lookAt(-12, 20, -10);
      controls.target.set(-12, 20, -10);
    };

    window.viewAll = () => {
      camera.position.set(0, 50, 100);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
    };

    // Raycaster for hover effects
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredObject = null;

    function onMouseMove(event) {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(roomGroup.children);

      if (hoveredObject) {
        hoveredObject.material.emissiveIntensity = 0.2;
        hoveredObject = null;
      }

      if (intersects.length > 0) {
        hoveredObject = intersects[0].object;
        hoveredObject.material.emissiveIntensity = 0.5;
      }
    }

    window.addEventListener('mousemove', onMouseMove);

    // Handle window resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }

    animate();
  </script>
</body>
</html>`;

const outputPath = path.join(__dirname, '../world-map-3d.html');
fs.writeFileSync(outputPath, html);
console.log('\nGenerated 3D visualization: ' + outputPath);
console.log('Open world-map-3d.html in your browser to view the 3D map!');
