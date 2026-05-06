// --- RENDERER SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false }); // Antialias OFF for speed
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- THE HOUSE ---
const walls = [];
const wallMat = new THREE.MeshBasicMaterial({ color: 0x3d2b1f }); // Basic = No light needed

function createWall(w, h, d, x, z) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    wall.position.set(x, h/2, z);
    scene.add(wall);
    walls.push(new THREE.Box3().setFromObject(wall)); // Collision data
}

// Perimeter Walls
createWall(20, 3, 0.5, 0, 10);   // Back
createWall(20, 3, 0.5, 0, -10);  // Front
createWall(0.5, 3, 20, 10, 0);   // Right
createWall(0.5, 3, 20, -10, 0);  // Left
// Middle Divider
createWall(6, 3, 0.5, -4, 0); 

const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshBasicMaterial({color: 0x222222}));
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// --- THE DOG (Player) ---
const playerGroup = new THREE.Group();
const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.4), new THREE.MeshBasicMaterial({color: 0x8B4513}));
playerGroup.add(body);
const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshBasicMaterial({color: 0x5D2906}));
head.position.set(0.7, 0.1, 0);
playerGroup.add(head);

playerGroup.position.set(-7, 0.3, 7);
scene.add(playerGroup);

// --- ACTORS ---
const granny = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.8), new THREE.MeshBasicMaterial({color: 0xff00ff}));
granny.position.set(7, 0.9, -7);
scene.add(granny);

const goldenBone = new THREE.Mesh(new THREE.SphereGeometry(0.4), new THREE.MeshBasicMaterial({color: 0xffd700}));
goldenBone.position.set(8, 0.4, 8);
scene.add(goldenBone);

let liam = null;
let seconds = 0;
let isDead = false;
let hasWon = false;
const keys = {};

window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

setInterval(() => {
    if (isDead || hasWon) return;
    seconds++;
    document.getElementById('timer').innerText = `SURVIVAL: ${seconds}s`;
    if (seconds === 60) spawnLiam();
}, 1000);

function spawnLiam() {
    liam = new THREE.Mesh(new THREE.BoxGeometry(1.5, 5, 1.5), new THREE.MeshBasicMaterial({color: 0xff0000}));
    liam.position.set(-8, 2.5, -8);
    scene.add(liam);
}

// --- GAME LOOP ---
function animate() {
    if (isDead || hasWon) return;
    requestAnimationFrame(animate);

    let oldPos = playerGroup.position.clone();
    const speed = 0.15;
    
    if (keys['KeyW']) playerGroup.translateX(speed);
    if (keys['KeyS']) playerGroup.translateX(-speed);
    if (keys['KeyA']) playerGroup.rotation.y += 0.06;
    if (keys['KeyD']) playerGroup.rotation.y -= 0.06;

    // Wall Collisions
    const playerBox = new THREE.Box3().setFromObject(playerGroup);
    for (let wall of walls) {
        if (playerBox.intersectsBox(wall)) {
            playerGroup.position.copy(oldPos);
        }
    }

    // AI Tracking
    const gDir = new THREE.Vector3().subVectors(playerGroup.position, granny.position).normalize();
    granny.position.addScaledVector(gDir, 0.07);

    if (liam) {
        const lDir = new THREE.Vector3().subVectors(playerGroup.position, liam.position).normalize();
        liam.position.addScaledVector(lDir, 0.14);
    }

    // Camera Follow
    const offset = new THREE.Vector3(-5, 4, 0).applyMatrix4(playerGroup.matrixWorld);
    camera.position.lerp(offset, 0.1);
    camera.lookAt(playerGroup.position);

    // End Conditions
    if (playerGroup.position.distanceTo(granny.position) < 1) die("GRANNY GOT YOU");
    if (liam && playerGroup.position.distanceTo(liam.position) < 1.5) die("LIAM CAUGHT YOU");
    if (playerGroup.position.distanceTo(goldenBone.position) < 1.2) win();

    renderer.render(scene, camera);
}

function die(msg) {
    isDead = true;
    document.getElementById('deathReason').innerText = msg;
    document.getElementById('overlay').style.display = 'flex';
}

function win() {
    hasWon = true;
    document.getElementById('winScreen').style.display = 'flex';
}

animate();
