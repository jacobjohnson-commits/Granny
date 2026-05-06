import * as THREE from 'three';

// --- INITIALIZATION ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020202);
scene.fog = new THREE.Fog(0x020202, 2, 15);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- HOUSE CONSTRUCTION ---
const wallMat = new THREE.MeshStandardMaterial({ color: 0x443322 });
const floorMat = new THREE.MeshStandardMaterial({ color: 0x221105 });

// Room: Floor and Walls
const floor = new THREE.Mesh(new THREE.BoxGeometry(20, 0.2, 20), floorMat);
floor.receiveShadow = true;
scene.add(floor);

function createWall(w, h, d, x, z) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    wall.position.set(x, h/2, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
}
createWall(20, 4, 0.5, 0, 10);  // Back
createWall(20, 4, 0.5, 0, -10); // Front
createWall(0.5, 4, 20, 10, 0);  // Right
createWall(0.5, 4, 20, -10, 0); // Left

// --- MODELS ---
// Better Weiner Dog (Player)
const playerGroup = new THREE.Group();
const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.8, 4, 8), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
body.rotation.z = Math.PI / 2;
playerGroup.add(body);
const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
head.position.set(0.6, 0.1, 0);
playerGroup.add(head);
playerGroup.position.y = 0.4;
scene.add(playerGroup);

// Flashlight (Spotlight)
const flashlight = new THREE.SpotLight(0xffffff, 20);
flashlight.angle = Math.PI / 6;
flashlight.penumbra = 0.3;
flashlight.castShadow = true;
flashlight.position.set(0.6, 0.2, 0);
playerGroup.add(flashlight);
playerGroup.add(flashlight.target);
flashlight.target.position.set(5, 0, 0);

// Granny
const granny = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 1.2, 4, 8), new THREE.MeshStandardMaterial({ color: 0xff00ff }));
granny.position.set(5, 0.8, 5);
scene.add(granny);

// Liam (The 1-Minute Monster)
let liam = null;
let liamSpawned = false;

// --- STATE & INPUT ---
let secondsAlive = 0;
let isDead = false;
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

setInterval(() => {
    if (!isDead) {
        secondsAlive++;
        document.getElementById('timer').innerText = `SURVIVED: ${secondsAlive}s`;
        
        if (secondsAlive === 60 && !liamSpawned) {
            spawnLiam();
        }
    }
}, 1000);

function spawnLiam() {
    liamSpawned = true;
    const liamGeo = new THREE.BoxGeometry(1, 3, 1);
    const liamMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000 });
    liam = new THREE.Mesh(liamGeo, liamMat);
    liam.position.set(-8, 1.5, -8);
    scene.add(liam);
    document.getElementById('status').innerText = "RUN! LIAM HAS AWAKENED!";
    document.getElementById('status').style.color = "red";
}

// --- GAME LOOP ---
function animate() {
    if (isDead) return;
    requestAnimationFrame(animate);

    // Movement & Rotation
    if (keys['KeyW']) playerGroup.translateX(0.12);
    if (keys['KeyS']) playerGroup.translateX(-0.08);
    if (keys['KeyA']) playerGroup.rotation.y += 0.05;
    if (keys['KeyD']) playerGroup.rotation.y -= 0.05;

    // AI: Granny
    const gDir = new THREE.Vector3().subVectors(playerGroup.position, granny.position).normalize();
    granny.position.addScaledVector(gDir, 0.05);

    // AI: Liam (Fast & Dangerous)
    if (liam) {
        const lDir = new THREE.Vector3().subVectors(playerGroup.position, liam.position).normalize();
        liam.position.addScaledVector(lDir, 0.13); // Faster than player forward speed
    }

    // Third Person Camera logic (UE5 Spring Arm style)
    const relativeCameraOffset = new THREE.Vector3(-4, 3, 0);
    const cameraOffset = relativeCameraOffset.applyMatrix4(playerGroup.matrixWorld);
    camera.position.lerp(cameraOffset, 0.1);
    camera.lookAt(playerGroup.position);

    // Collision
    if (playerGroup.position.distanceTo(granny.position) < 0.8) die("CAUGHT BY GRANNY");
    if (liam && playerGroup.position.distanceTo(liam.position) < 1.0) die("ELIMINATED BY LIAM");

    renderer.render(scene, camera);
}

function die(reason) {
    isDead = true;
    document.getElementById('deathReason').innerText = reason;
    document.getElementById('overlay').style.display = 'flex';
}

animate();
