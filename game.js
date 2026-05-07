const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- THE HOUSE (Better Map) ---
const walls = [];
const wallMat = new THREE.MeshBasicMaterial({ color: 0x3d2b1f });
const floorMat = new THREE.MeshBasicMaterial({ color: 0x1a130e });

function createWall(w, h, d, x, z) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    wall.position.set(x, h/2, z);
    scene.add(wall);
    walls.push(new THREE.Box3().setFromObject(wall));
}

// Larger House with Rooms
createWall(50, 6, 1, 0, 25);   // Back
createWall(50, 6, 1, 0, -25);  // Front
createWall(1, 6, 50, 25, 0);   // Right
createWall(1, 6, 50, -25, 0);  // Left
createWall(20, 6, 1, -15, 5);  // Interior Wall 1
createWall(1, 6, 20, 5, -15);  // Interior Wall 2

const floor = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), floorMat);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// --- SCARY GRANNY MODEL ---
const granny = new THREE.Group();
// Body (The Dress)
const gBody = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2.5, 8), new THREE.MeshBasicMaterial({ color: 0x222222 }));
granny.add(gBody);
// Head
const gHead = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), new THREE.MeshBasicMaterial({ color: 0x444444 }));
gHead.position.y = 1.4;
granny.add(gHead);
// Evil Eyes
const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.1), eyeMat);
eyeL.position.set(0.2, 1.5, 0.25);
const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.1), eyeMat);
eyeR.position.set(0.2, 1.5, -0.25);
granny.add(eyeL, eyeR);

granny.position.set(15, 1.25, -15);
scene.add(granny);

// --- PLAYER (Better Dachshund) ---
const player = new THREE.Group();
const dBody = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 0.4), new THREE.MeshBasicMaterial({ color: 0x8B4513 }));
player.add(dBody);
const dHead = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshBasicMaterial({ color: 0x5D2906 }));
dHead.position.set(0.7, 0.2, 0);
player.add(dHead);
player.position.set(-20, 0.3, 20);
scene.add(player);

// --- BONES & EXIT ---
let bonesCollected = 0;
const bones = [];
for(let i=0; i<5; i++) {
    const bone = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.2), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    bone.position.set(Math.random()*40-20, 0.2, Math.random()*40-20);
    scene.add(bone);
    bones.push(bone);
}

let exitPortal = null;
let seconds = 0;
let isDead = false;
let isSilly = false;
const keys = {};

window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

setInterval(() => {
    if (isDead) return;
    seconds++;
    document.getElementById('timer').innerText = `SURVIVED: ${seconds}s`;
    if (seconds === 30) {
        isSilly = true;
        document.getElementById('silly-warning').style.display = 'block';
        exitPortal = new THREE.Mesh(new THREE.TorusKnotGeometry(1, 0.3), new THREE.MeshBasicMaterial({ color: 0xffd700 }));
        exitPortal.position.set(0, 2, 0);
        scene.add(exitPortal);
    }
}, 1000);

function animate() {
    if (isDead) return;
    requestAnimationFrame(animate);

    const speed = isSilly ? 0.25 : 0.15;
    let oldPos = player.position.clone();

    if (keys['KeyW']) player.translateX(speed);
    if (keys['KeyS']) player.translateX(-speed);
    if (keys['KeyA']) player.rotation.y += 0.05;
    if (keys['KeyD']) player.rotation.y -= 0.05;

    // Collisions
    const pBox = new THREE.Box3().setFromObject(player);
    walls.forEach(w => { if(pBox.intersectsBox(w)) player.position.copy(oldPos); });

    // AI
    const gDir = new THREE.Vector3().subVectors(player.position, granny.position).normalize();
    granny.position.addScaledVector(gDir, isSilly ? 0.18 : 0.08);
    granny.lookAt(player.position);

    // Pickups
    bones.forEach(b => {
        if(b.visible && player.position.distanceTo(b.position) < 1.5) {
            b.visible = false;
            bonesCollected++;
            document.getElementById('counter').innerText = `BONES COLLECTED: ${bonesCollected}/5`;
        }
    });

    // Camera (Spring Arm Style)
    const camOffset = new THREE.Vector3(-8, 6, 0).applyMatrix4(player.matrixWorld);
    camera.position.lerp(camOffset, 0.1);
    camera.lookAt(player.position);

    // End Conditions
    if (player.position.distanceTo(granny.position) < 1.8) {
        isDead = true;
        document.getElementById('overlay').style.display = 'flex';
    }
    if (exitPortal && player.position.distanceTo(exitPortal.position) < 2.5 && bonesCollected >= 5) {
        document.getElementById('winScreen').style.display = 'flex';
        isDead = true;
    }

    renderer.render(scene, camera);
}
animate();
