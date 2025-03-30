import * as THREE from 'three';
import { FlightSystem } from './flightSystem.js';
import { CameraSystem } from './cameraSystem.js';
import { UI } from './ui.js';
import { UFOSystem } from './ufoSystem.js';
import { ProjectileSystem } from './projectileSystem.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue background

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(50, 50, 50);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
scene.add(directionalLight);

// Add a helper grid for better perspective
const gridHelper = new THREE.GridHelper(20, 20);
scene.add(gridHelper);

// Create ground
function createGround() {
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x2d5a27,  // Changed to green color to match grass
        side: THREE.DoubleSide 
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    return ground;
}

// Create tree
function createTree() {
    const tree = new THREE.Group();

    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
    const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x4a2f1b });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    // Tree foliage (multiple layers for fuller look)
    const foliageColors = [0x1d8c2c, 0x166e21, 0x145a1e];
    const foliageSizes = [1.5, 1.2, 0.9];
    const foliageHeights = [1.8, 2.2, 2.6];

    foliageSizes.forEach((size, i) => {
        const foliageGeometry = new THREE.ConeGeometry(size, 2, 8);
        const foliageMaterial = new THREE.MeshPhongMaterial({ 
            color: foliageColors[i],
            flatShading: true 
        });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = foliageHeights[i];
        foliage.castShadow = true;
        foliage.receiveShadow = true;
        tree.add(foliage);
    });

    return tree;
}

// Create grass patch
function createGrassPatch(width, depth) {
    const grass = new THREE.Group();

    // Base grass plane
    const grassGeometry = new THREE.PlaneGeometry(width, depth);
    const grassMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x2d5a27,
        side: THREE.DoubleSide
    });
    const grassPlane = new THREE.Mesh(grassGeometry, grassMaterial);
    grassPlane.rotation.x = -Math.PI / 2;
    grassPlane.position.y = 0.01; // Slightly above ground to prevent z-fighting
    grassPlane.receiveShadow = true;
    grass.add(grassPlane);

    return grass;
}

// Modify createCity function to include grass and trees
function createCity() {
    const city = new THREE.Group();
    const buildingCount = 100;
    const citySize = 80;
    const treeCount = 150; // Number of trees to add
    const grassPatchCount = 30; // Number of grass patches
    
    // Building colors - updated to lighter and warmer tones
    const buildingColors = [
        0xE8E8E8, // Light gray
        0xD3D3D3, // Lighter gray
        0xECE4D8, // Warm light beige
        0xE8E3D9, // Light cream
        0xDCDCDC  // Very light gray
    ];

    // Window texture
    const windowTexture = createWindowTexture();

    // Create buildings
    const occupiedSpaces = [];
    
    for (let i = 0; i < buildingCount; i++) {
        const x = (Math.random() - 0.5) * citySize;
        const z = (Math.random() - 0.5) * citySize;
        
        const width = 2 + Math.random() * 4;
        const height = 5 + Math.random() * 25;
        const depth = 2 + Math.random() * 4;

        // Store occupied space
        occupiedSpaces.push({
            x: x,
            z: z,
            radius: Math.max(width, depth) / 2 + 1 // Add buffer for spacing
        });

        const building = createBuilding(
            width, 
            height, 
            depth, 
            buildingColors[Math.floor(Math.random() * buildingColors.length)],
            windowTexture
        );

        building.position.set(x, height / 2, z);
        city.add(building);
    }

    // Add grass patches
    for (let i = 0; i < grassPatchCount; i++) {
        const width = 5 + Math.random() * 10;
        const depth = 5 + Math.random() * 10;
        const x = (Math.random() - 0.5) * citySize;
        const z = (Math.random() - 0.5) * citySize;

        // Check if space is free
        if (!isSpaceOccupied(x, z, Math.max(width, depth) / 2, occupiedSpaces)) {
            const grassPatch = createGrassPatch(width, depth);
            grassPatch.position.set(x, 0, z);
            city.add(grassPatch);

            // Add trees around grass patch
            const treesPerPatch = Math.floor(3 + Math.random() * 4);
            for (let j = 0; j < treesPerPatch; j++) {
                const treeX = x + (Math.random() - 0.5) * width * 0.8;
                const treeZ = z + (Math.random() - 0.5) * depth * 0.8;
                
                const tree = createTree();
                const scale = 0.8 + Math.random() * 0.4;
                tree.scale.set(scale, scale, scale);
                tree.position.set(treeX, 0, treeZ);
                tree.rotation.y = Math.random() * Math.PI * 2;
                city.add(tree);
            }

            occupiedSpaces.push({
                x: x,
                z: z,
                radius: Math.max(width, depth) / 2
            });
        }
    }

    // Add individual trees in remaining spaces
    for (let i = 0; i < treeCount; i++) {
        const x = (Math.random() - 0.5) * citySize;
        const z = (Math.random() - 0.5) * citySize;

        if (!isSpaceOccupied(x, z, 1.5, occupiedSpaces)) {
            const tree = createTree();
            const scale = 0.8 + Math.random() * 0.4;
            tree.scale.set(scale, scale, scale);
            tree.position.set(x, 0, z);
            tree.rotation.y = Math.random() * Math.PI * 2;
            city.add(tree);

            occupiedSpaces.push({
                x: x,
                z: z,
                radius: 1.5
            });
        }
    }

    return city;
}

// Helper function to check if a space is occupied
function isSpaceOccupied(x, z, radius, occupiedSpaces) {
    return occupiedSpaces.some(space => {
        const distance = Math.sqrt(
            Math.pow(space.x - x, 2) + 
            Math.pow(space.z - z, 2)
        );
        return distance < (space.radius + radius);
    });
}

// Create a single building
function createBuilding(width, height, depth, color, windowTexture) {
    const building = new THREE.Group();

    // Main building structure
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshPhongMaterial({
        color: color,
        map: windowTexture,
        bumpMap: windowTexture,
        bumpScale: 0.1,
        shininess: 30
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    building.add(mesh);

    // Add roof details (optional)
    if (Math.random() > 0.5) {
        const roofHeight = 0.5;
        const roofGeometry = new THREE.BoxGeometry(width * 0.8, roofHeight, depth * 0.8);
        const roofMesh = new THREE.Mesh(roofGeometry, new THREE.MeshPhongMaterial({ color: 0x505050 }));
        roofMesh.position.y = height / 2 + roofHeight / 2;
        roofMesh.castShadow = true;
        building.add(roofMesh);
    }

    return building;
}

// Create window texture
function createWindowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 32, 32);

    // Draw windows
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (Math.random() > 0.3) { // 70% chance of window being lit
                ctx.fillRect(i * 8 + 1, j * 8 + 1, 6, 6);
            }
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 2); // Repeat the texture vertically
    
    return texture;
}

// Create plane model
function createPlane() {
    const group = new THREE.Group();

    // Fuselage
    const fuselageGeometry = new THREE.CylinderGeometry(0.4, 0.4, 4, 12);
    const fuselageMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
    const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
    fuselage.rotation.z = Math.PI / 2;
    group.add(fuselage);

    // Wings
    const wingGeometry = new THREE.BoxGeometry(12, 0.15, 1.5);
    const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.y = 0;
    group.add(wings);

    // Tail
    const tailGeometry = new THREE.BoxGeometry(2, 0.15, 1.5);
    const tailMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.z = 1.75;
    group.add(tail);

    // Vertical stabilizer
    const stabilizerGeometry = new THREE.BoxGeometry(0.15, 1.5, 1.5);
    const stabilizerMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
    const stabilizer = new THREE.Mesh(stabilizerGeometry, stabilizerMaterial);
    stabilizer.position.z = 1.75;
    stabilizer.position.y = 0.75;
    group.add(stabilizer);

    // Propeller
    const propellerGeometry = new THREE.BoxGeometry(2.25, 0.15, 0.15);
    const propellerMaterial = new THREE.MeshPhongMaterial({ color: 0x404040 });
    const propeller = new THREE.Mesh(propellerGeometry, propellerMaterial);
    propeller.position.z = -2;
    group.add(propeller);

    // Cockpit (glass dome)
    const cockpitGeometry = new THREE.SphereGeometry(0.45, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x87CEEB,
        transparent: true,
        opacity: 0.6,
        shininess: 100
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.y = 0.35;
    group.add(cockpit);

    return group;
}

// Create UFO model
function createUFO() {
    const group = new THREE.Group();

    // Main saucer body
    const saucerGeometry = new THREE.CapsuleGeometry(3, 0.5, 32, 16);
    const saucerMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x8B0000,  // Deep red
        metalness: 0.8,
        shininess: 60
    });
    const saucer = new THREE.Mesh(saucerGeometry, saucerMaterial);
    saucer.rotation.z = Math.PI / 2;
    group.add(saucer);

    // Top dome
    const domeGeometry = new THREE.SphereGeometry(1.5, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x8B0000,
        metalness: 0.8,
        shininess: 60
    });
    const dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.y = 0.5;
    group.add(dome);

    // Bottom rim
    const rimGeometry = new THREE.TorusGeometry(3.2, 0.3, 16, 32);
    const rimMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x600000,  // Darker red for contrast
        metalness: 0.9,
        shininess: 70
    });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = -0.2;
    group.add(rim);

    return group;
}

// Create cloud texture
function createCloudTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Fill with transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, 128, 128);

    // Create multiple overlapping circles for fluffy appearance
    const cloudCircles = [
        { x: 64, y: 64, r: 45 },  // Center
        { x: 45, y: 64, r: 35 },  // Left
        { x: 83, y: 64, r: 35 },  // Right
        { x: 64, y: 45, r: 35 },  // Top
        { x: 64, y: 83, r: 35 },  // Bottom
        { x: 45, y: 45, r: 30 },  // Top-left
        { x: 83, y: 45, r: 30 },  // Top-right
        { x: 45, y: 83, r: 30 },  // Bottom-left
        { x: 83, y: 83, r: 30 }   // Bottom-right
    ];

    // Draw cloud shape
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    cloudCircles.forEach(circle => {
        ctx.moveTo(circle.x + circle.r, circle.y);
        ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
    });
    ctx.fill();

    // Add some inner shading for depth
    const gradient = ctx.createRadialGradient(64, 50, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.premultiplyAlpha = true;
    return texture;
}

// Create cloud system
function createClouds() {
    const cloudGroup = new THREE.Group();
    const cloudTexture = createCloudTexture();
    const cloudCount = 50;
    const clouds = [];
    
    // Create cloud instances
    for (let i = 0; i < cloudCount; i++) {
        // Create a random sized sprite for each cloud
        const cloudMaterial = new THREE.SpriteMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: 1.0,  // Full opacity
            depthWrite: false,  // Prevent transparency sorting issues
            depthTest: true
        });
        const cloud = new THREE.Sprite(cloudMaterial);
        
        // Random position in sky
        const radius = 150 + Math.random() * 100; // Distance from center
        const angle = Math.random() * Math.PI * 2;
        const height = 40 + Math.random() * 40; // Height between 40 and 80 units
        
        cloud.position.set(
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius
        );
        
        // Random scale for variety (slightly smaller for better definition)
        const scale = 10 + Math.random() * 20;
        cloud.scale.set(scale, scale, 1);
        
        // Store initial position for animation
        cloud.userData = {
            angle: angle,
            radius: radius,
            rotationSpeed: 0.02 + Math.random() * 0.02,
            height: height,
            verticalSpeed: 0.1 + Math.random() * 0.1,
            verticalOffset: Math.random() * Math.PI * 2
        };
        
        clouds.push(cloud);
        cloudGroup.add(cloud);
    }
    
    return { group: cloudGroup, clouds: clouds };
}

// Create ground and city
const ground = createGround();
scene.add(ground);

const city = createCity();
scene.add(city);

// Remove the old UFO creation code and replace with:
const ufoSystem = new UFOSystem(scene);

// Add clouds to the scene
const cloudSystem = createClouds();
scene.add(cloudSystem.group);

// Add projectile system
const projectileSystem = new ProjectileSystem(scene);

// Add shooting controls
let canShoot = true;
const shootingCooldown = 0.2; // Seconds between shots
let timeSinceLastShot = 0;

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && canShoot) {
        // Get direction from plane's orientation
        const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(plane.quaternion);
        
        // Position projectile at the plane's nose (propeller position)
        const position = plane.position.clone();
        const propellerOffset = new THREE.Vector3(0, 0, -2);  // Match propeller position
        propellerOffset.applyQuaternion(plane.quaternion);
        position.add(propellerOffset);
        
        // Add slight upward angle to projectiles
        direction.y += 0.1;
        direction.normalize();
        
        projectileSystem.shoot(position, direction);
        
        // Apply cooldown
        canShoot = false;
        timeSinceLastShot = 0;
    }
});

// Initialize systems
const flightSystem = new FlightSystem();
const cameraSystem = new CameraSystem(camera);
const ui = new UI();

// Create and position plane
const plane = createPlane();
// Position plane above and outside city, approaching inward
plane.position.set(0, 30, 100);
plane.rotation.x = THREE.MathUtils.degToRad(-5); // Slight nose-down attitude
scene.add(plane);

// Clock for delta time
const clock = new THREE.Clock();

// Animation loop
function animate() {
    const deltaTime = clock.getDelta();
    
    // Calculate plane's position relative to city center
    const distanceFromCenter = Math.sqrt(
        plane.position.x * plane.position.x + 
        plane.position.z * plane.position.z
    );
    
    // Flight path parameters
    const targetRadius = 80; // Larger radius for wider turns
    const targetHeight = 30;
    const maxBankAngle = 0.4; // Slightly steeper bank for more natural turns
    const turnRate = 0.4; // Controls how quickly the plane turns
    const heightCorrectionRate = 0.02; // Gentler height corrections
    
    // Calculate current angle and desired position
    const currentAngle = Math.atan2(plane.position.x, plane.position.z);
    const targetX = Math.sin(currentAngle + turnRate * deltaTime) * targetRadius;
    const targetZ = Math.cos(currentAngle + turnRate * deltaTime) * targetRadius;
    
    // Calculate desired direction
    const targetDirection = new THREE.Vector3(targetX - plane.position.x, 0, targetZ - plane.position.z).normalize();
    const currentDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(plane.quaternion);
    
    // Calculate turn amount
    const turnDot = currentDirection.dot(targetDirection);
    const turnCross = currentDirection.cross(targetDirection).y;
    const bankAmount = Math.max(-maxBankAngle, Math.min(maxBankAngle, turnCross * 2));
    
    // Apply controls
    flightSystem.setAutoBanking(bankAmount);
    
    // Smoother height control
    const heightDiff = targetHeight - plane.position.y;
    const pitchAmount = Math.max(-0.3, Math.min(0.3, heightDiff * heightCorrectionRate));
    flightSystem.setPitch(pitchAmount);
    
    // Adjust speed based on bank angle
    const baseThrottle = 0.6;
    const bankCompensation = Math.abs(bankAmount) * 0.2; // Add power in turns
    flightSystem.setThrottle(baseThrottle + bankCompensation);
    
    // Update flight physics
    flightSystem.updateInputs(deltaTime);
    const flightData = flightSystem.updatePhysics(deltaTime);
    
    // Update plane position and rotation
    plane.position.add(flightData.velocity);
    plane.quaternion.copy(flightData.rotation);
    
    // Rotate propeller (faster in turns)
    const propeller = plane.children[4];
    propeller.rotation.z += 0.2 + (flightData.speed * 0.01) + (Math.abs(bankAmount) * 0.1);
    
    // Update UFO system
    ufoSystem.update(deltaTime, plane.position, city.children);
    
    // Animate clouds
    cloudSystem.clouds.forEach(cloud => {
        const userData = cloud.userData;
        
        // Rotate around city center
        userData.angle += userData.rotationSpeed * deltaTime;
        cloud.position.x = Math.cos(userData.angle) * userData.radius;
        cloud.position.z = Math.sin(userData.angle) * userData.radius;
        
        // Gentle vertical motion
        cloud.position.y = userData.height + 
            Math.sin(clock.elapsedTime * userData.verticalSpeed + userData.verticalOffset) * 2;
        
        // Make clouds always face camera
        cloud.quaternion.copy(camera.quaternion);
    });
    
    // Update camera
    cameraSystem.update(plane.position, plane.quaternion, deltaTime);
    
    // Update UI
    ui.updateSpeed(flightData.speed, flightSystem.getSpeedNormalized());
    
    // Update shooting cooldown
    if (!canShoot) {
        timeSinceLastShot += deltaTime;
        if (timeSinceLastShot >= shootingCooldown) {
            canShoot = true;
        }
    }
    
    // Update projectiles and check collisions
    projectileSystem.update(deltaTime);
    const hitUfo = projectileSystem.checkCollisions(ufoSystem.ufos);
    
    if (hitUfo) {
        // Move hit UFO far away and reset its pattern
        hitUfo.position.set(
            (Math.random() - 0.5) * 200,
            30 + Math.random() * 20,
            (Math.random() - 0.5) * 200
        );
        hitUfo.userData.patrolAngle = Math.random() * Math.PI * 2;
    }
    
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// Handle window resize
window.addEventListener('resize', () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(newWidth, newHeight);
});

// Start the animation loop
animate(); 