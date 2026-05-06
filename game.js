// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
scene.fog = new THREE.Fog(0x050505, 1, 15);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- LIGHTING ---
const ambient = new THREE.AmbientLight(0xffffff, 0.2); // Very dim
scene.add(ambient);

// --- THE HOUSE (Collision Walls) ---
const walls = [];
const wallMat = new THREE.MeshBasicMaterial({ color: 0x221105 });

function createWall(w, h, d, x, z) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    wall.position.set(x, h/2, z);
    scene.add(wall);
    walls.push(new THREE.Box3().setFromObject(wall));
}

// Perimeter
createWall(20, 4, 0.5, 0, 10);   // Back
createWall(20, 4, 0.5, 0, -10);  // Front
createWall(0.5, 4, 20, 10, 0);   // Right
createWall(0.5, 4, 20, -10, 0);  // Left
// Interior Wall
createWall(8, 4, 0.5, -4, 0); 

const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshBasicMaterial({color: 0x111111}));
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// --- THE DOG (Player) ---
const playerGroup = new THREE.Group();
const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.4), new THREE.MeshBasicMaterial({color: 0x8B4513}));
playerGroup.add(body);
const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshBasicMaterial({color: 0x8B4513}));
head.position.set(0.7, 0.1, 0);
playerGroup.add(head);

// Flashlight
const flashlight = new THREE.PointLight(0xffffff, 1, 8);
flashlight.position.set(0.8, 0, 0);
playerGroup.add(flashlight);

playerGroup.position.set(-8, 0.3, 8);
scene.add(playerGroup);

// --- ENEMIES & ITEMS ---
const granny = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 1), new THREE.MeshBasicMaterial({color: 0xff00ff}));
granny.position.set(8, 1, -8);
scene.add(granny);

const goldenBone = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.1), new THREE.MeshBasicMaterial({color: 0xffd700}));
goldenBone.position.set(8, 0.5, 8);
scene.add(goldenBone);

let liam = null;

// --- GAME STATE ---
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
    liam = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 1), new THREE.MeshBasicMaterial({color: 0xff0000}));
    liam.position.set(-8, 2, -8);
    scene.add(liam);
}

function animate() {
    if (isDead || hasWon) return;
    requestAnimationFrame(animate);

    // Movement Logic
    let oldPos = playerGroup.position.clone();
    const speed = 0.12;
    if (keys['KeyW']) playerGroup.translateX(speed);
    if (keys['KeyS']) playerGroup.translateX(-speed);
    if (keys['KeyA']) playerGroup.rotation.y += 0.05;
    if (keys['KeyD']) playerGroup.rotation.y -= 0.05;

    // Wall Collision Check (Basic UE5-style Swept Trace)
    const playerBox = new THREE.Box3().setFromObject(playerGroup);
    for (let wall of walls) {
        if (playerBox.intersectsBox(wall)) {
            playerGroup.position.copy(oldPos);
        }
    }

    // AI Logic
    const gDir = new THREE.Vector3().subVectors(playerGroup.position, granny.position).normalize();
    granny.position.addScaledVector(gDir, 0.06);

    if (liam) {
        const lDir = new THREE.Vector3().subVectors(playerGroup.position, liam.position).normalize();
        liam.position.addScaledVector(lDir, 0.13);
    }

    // 3rd Person Camera
    const offset = new THREE.Vector3(-4, 3, 0).applyMatrix4(playerGroup.matrixWorld);
    camera.position.lerp(offset, 0.1);
    camera.lookAt(playerGroup.position);

    // Win/Loss Condition
    if (playerGroup.position.distanceTo(granny.position) < 0.8) die("CAUGHT BY GRANNY");
    if (liam && playerGroup.position.distanceTo(liam.position) < 1.2) die("LIAM FOUND YOU");
    if (playerGroup.position.distanceTo(goldenBone.position) < 1) win();

    renderer.render(scene, camera);
}

function die(reason) {
    isDead = true;
    document.getElementById('deathReason').innerText = reason;
    document.getElementById('overlay').style.display = 'flex';
}

function win() {
    hasWon = true;
    document.getElementById('winScreen').style.display = 'flex';
}

animate();
