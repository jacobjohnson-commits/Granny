// --- ENGINE INIT ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- WORLD BUILDING ---
const walls = [];
const wallMat = new THREE.MeshBasicMaterial({ color: 0x221105 });

function createWall(w, h, d, x, z) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    wall.position.set(x, h/2, z);
    scene.add(wall);
    walls.push(new THREE.Box3().setFromObject(wall));
}

// Huge House Layout
createWall(60, 5, 1, 0, 30);   // Back
createWall(60, 5, 1, 0, -30);  // Front
createWall(1, 5, 60, 30, 0);   // Right
createWall(1, 5, 60, -30, 0);  // Left
createWall(15, 5, 1, 10, 10);  // Interior Wall 1
createWall(1, 5, 15, -10, -10);// Interior Wall 2

const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ color: 0x111111 }));
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// --- PLAYER (Dachshund) ---
const playerGroup = new THREE.Group();
const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.4), new THREE.MeshBasicMaterial({ color: 0x8B4513 }));
playerGroup.add(body);
const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshBasicMaterial({ color: 0x5D2906 }));
head.position.set(0.8, 0.1, 0);
playerGroup.add(head);
playerGroup.position.set(-20, 0.4, 20);
scene.add(playerGroup);

// --- SCARY GRANNY ---
const grannyGroup = new THREE.Group();
const gBody = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3.5, 1.5), new THREE.MeshBasicMaterial({ color: 0x333333 }));
grannyGroup.add(gBody);

// Evil Red Eyes
const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.15), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
eyeL.position.set(0.5, 1.2, 0.4);
const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.15), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
eyeR.position.set(0.5, 1.2, -0.4);
grannyGroup.add(eyeL, eyeR);

grannyGroup.position.set(20, 1.75, -20);
scene.add(grannyGroup);

// --- ITEMS ---
let bonesCollected = 0;
const bones = [];
for(let i=0; i<5; i++) {
    const bone = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.3), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    bone.position.set(Math.random()*40-20, 0.3, Math.random()*40-20);
    scene.add(bone);
    bones.push(bone);
}

let exitOrb = null;

// --- STATE & INPUT ---
let seconds = 0;
let isDead = false;
let isWin = false;
let sillyMode = false;
const keys = {};

window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

setInterval(() => {
    if (isDead || isWin) return;
    seconds++;
    document.getElementById('timer').innerText = `SURVIVED: ${seconds}s`;

    if (seconds === 30) {
        sillyMode = true;
        document.getElementById('silly-warning').style.display = 'block';
        // Spawn Exit
        exitOrb = new THREE.Mesh(new THREE.SphereGeometry(2), new THREE.MeshBasicMaterial({ color: 0xffd700 }));
        exitOrb.position.set(0, 2, 0);
        scene.add(exitOrb);
    }
}, 1000);

// --- TICK ---
function animate() {
    if (isDead || isWin) return;
    requestAnimationFrame(animate);

    // Movement
    let oldPos = playerGroup.position.clone();
    const speed = sillyMode ? 0.25 : 0.15;
    if (keys['KeyW']) playerGroup.translateX(speed);
    if (keys['KeyS']) playerGroup.translateX(-speed);
    if (keys['KeyA']) playerGroup.rotation.y += 0.06;
    if (keys['KeyD']) playerGroup.rotation.y -= 0.06;

    // Wall Collisions
    const pBox = new THREE.Box3().setFromObject(playerGroup);
    for(let wall of walls) {
        if(pBox.intersectsBox(wall)) playerGroup.position.copy(oldPos);
    }

    // Bone Collection
    bones.forEach(b => {
        if(b.visible && playerGroup.position.distanceTo(b.position) < 1.5) {
            b.visible = false;
            bonesCollected++;
            document.getElementById('counter').innerText = `BONES: ${bonesCollected}/5`;
        }
    });

    // AI
    const gDir = new THREE.Vector3().subVectors(playerGroup.position, grannyGroup.position).normalize();
    grannyGroup.position.addScaledVector(gDir, sillyMode ? 0.16 : 0.07);

    if(sillyMode) {
        grannyGroup.rotation.y += 0.2;
        scene.background = new THREE.Color(`hsl(${(Date.now()/10)%360}, 40%, 10%)`);
    }

    // Camera
    const offset = new THREE.Vector3(-8, 6, 0).applyMatrix4(playerGroup.matrixWorld);
    camera.position.lerp(offset, 0.1);
    camera.lookAt(playerGroup.position);

    // Win/Loss
    if(playerGroup.position.distanceTo(grannyGroup.position) < 2) {
        isDead = true;
        document.getElementById('overlay').style.display = 'flex';
    }

    if(exitOrb && playerGroup.position.distanceTo(exitOrb.position) < 2.5) {
        if(bonesCollected >= 5) {
            isWin = true;
            document.getElementById('winScreen').style.display = 'flex';
        }
    }

    renderer.render(scene, camera);
}

animate();
