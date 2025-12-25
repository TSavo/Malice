import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Root directory for world files
const WORLD_ROOT = path.join(__dirname, '../src/database/bootstrap/world');

function extractCoordsFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(WORLD_ROOT, filePath);
  const matches = [];

  // Find all room blocks with their names and coordinates
  // Match room definitions like '%ROOM': { name: '...', ... x: N, y: N, z: N }
  const roomBlockRegex = /'%([^']+)':\s*\{[^}]*?name:\s*['"`]([^'"`]+)['"`][^}]*?x:\s*(-?\d+),\s*y:\s*(-?\d+),\s*z:\s*(-?\d+)/gs;
  let match;
  while ((match = roomBlockRegex.exec(content))) {
    matches.push({
      id: match[1],
      name: match[2],
      x: parseInt(match[3]),
      y: parseInt(match[4]),
      z: parseInt(match[5]),
      file: path.basename(filePath),
      path: relativePath,
    });
  }

  // Also try to find inline coordinate definitions (for simpler formats)
  if (matches.length === 0) {
    const simpleRegex = /x:\s*(-?\d+),\s*y:\s*(-?\d+),\s*z:\s*(-?\d+)/g;
    while ((match = simpleRegex.exec(content))) {
      matches.push({
        id: path.basename(filePath, '.ts'),
        name: path.basename(filePath, '.ts'),
        x: parseInt(match[1]),
        y: parseInt(match[2]),
        z: parseInt(match[3]),
        file: path.basename(filePath),
        path: relativePath,
      });
    }
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
    #tooltip {
      position: absolute;
      background: rgba(0, 0, 0, 0.9);
      padding: 10px;
      border: 1px solid #0ff;
      pointer-events: none;
      display: none;
      max-width: 400px;
      z-index: 100;
    }
    #tooltip h3 {
      margin: 0 0 5px 0;
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
  <div id="tooltip">
    <h3 id="tooltip-title"></h3>
    <div id="tooltip-content"></div>
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
        // Underground - darker blue to deep purple gradient
        const depth = Math.abs(z);
        // Deeper = darker and more purple
        const hue = 0.65 - depth * 0.05; // Blue (0.65) to purple (0.8)
        const lightness = Math.max(0.15, 0.5 - depth * 0.05); // Gets darker with depth
        return new THREE.Color().setHSL(hue, 0.9, lightness);
      } else if (z === 0) {
        // Surface - bright green
        return new THREE.Color(0x00ff00);
      } else {
        // Above ground - yellow to red gradient
        return new THREE.Color().setHSL(0.15 - z * 0.003, 0.9, 0.5);
      }
    }

    function getMaterialOpacity(z) {
      if (z < 0) {
        // Underground more opaque/darker
        return 0.9;
      }
      return 0.8;
    }

    // Create room cubes
    const roomGroup = new THREE.Group();
    const roomSize = 1.8;
    const geometry = new THREE.BoxGeometry(roomSize, roomSize, roomSize);

    worldData.forEach(room => {
      const color = getColorForZ(room.z);
      const material = new THREE.MeshPhongMaterial({
        color: color,
        transparent: true,
        opacity: getMaterialOpacity(room.z),
        emissive: color,
        emissiveIntensity: room.z < 0 ? 0.3 : 0.2, // Underground glows more
        shininess: room.z < 0 ? 10 : 30, // Underground less shiny
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
      '<span style="color: #4444aa">Dark Blue</span>: Deep underground<br>' +
      '<span style="color: #6666ff">Light Blue</span>: Shallow underground<br>' +
      '<span style="color: #00ff00">Green</span>: Surface (z=0)<br>' +
      '<span style="color: #ffaa00">Yellow/Orange</span>: Buildings<br>' +
      '<span style="color: #ff6600">Red</span>: High floors<br>' +
      '<br>' +
      '<em>Hover over rooms for details</em>';

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

    // Raycaster for hover effects and tooltips
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredObject = null;
    const tooltip = document.getElementById('tooltip');
    const tooltipTitle = document.getElementById('tooltip-title');
    const tooltipContent = document.getElementById('tooltip-content');

    function getLevelName(z) {
      if (z < 0) return 'Underground Level ' + Math.abs(z);
      if (z === 0) return 'Surface';
      if (z <= 5) return 'Ground Floor + ' + z;
      return 'Floor ' + z;
    }

    function onMouseMove(event) {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(roomGroup.children);

      // Reset previous hover
      if (hoveredObject) {
        const wasUnderground = hoveredObject.userData.z < 0;
        hoveredObject.material.emissiveIntensity = wasUnderground ? 0.3 : 0.2;
        hoveredObject = null;
      }

      // Hide tooltip by default
      tooltip.style.display = 'none';

      if (intersects.length > 0) {
        hoveredObject = intersects[0].object;
        hoveredObject.material.emissiveIntensity = 0.7;

        // Show tooltip
        const room = hoveredObject.userData;
        tooltipTitle.textContent = room.file;
        tooltipContent.innerHTML =
          '<strong>Coordinates:</strong> (' + room.x + ', ' + room.y + ', ' + room.z + ')<br>' +
          '<strong>Level:</strong> ' + getLevelName(room.z) + '<br>' +
          '<strong>Path:</strong> ' + room.path.replace(/\\\\/g, '/');

        tooltip.style.display = 'block';
        tooltip.style.left = (event.clientX + 15) + 'px';
        tooltip.style.top = (event.clientY + 15) + 'px';
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
