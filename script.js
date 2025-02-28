// script.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/loaders/GLTFLoader.js';

// הגדרות ראשוניות וכלים עזר
const randomColor = () => Math.floor(Math.random() * 0xffffff);
const textureLoader = new THREE.TextureLoader();

// יצירת הסצנה, המצלמה והרנדרר
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// שחקן (אובייקט "שחקן" שעליו יתווסף המטוס)
const player = new THREE.Object3D();
player.position.set(0, 1.1, 40);
scene.add(player);

// ניצור משתנה שמחזיק את המטוס הנוכחי (כדי שנוכל להוריד אותו אם השחקן בוחר מטוס אחר)
let currentPlane = null;
const loader = new GLTFLoader();

/**
 * פונקציה לטעינת מטוס לפי שם מודל/סוג.
 * אם כבר קיים מטוס בסצנה – נסיר אותו לפני שנוסיף את החדש.
 */
function loadPlane(modelName) {
  // במידה ויש מטוס קיים, נסיר אותו מהשחקן
  if (currentPlane) {
    player.remove(currentPlane);
    currentPlane = null;
  }

  // הגדרות בסיסיות לכל מודל – אפשר לשנות/להוסיף לפי צורך
  let path, scale, position, rotation;
  switch (modelName) {
    case '747':
      path = 'assets/planes/747/airplane.gltf';
      scale = new THREE.Vector3(40, 40, 40);
      position = new THREE.Vector3(0, 2.9, 0);
      rotation = new THREE.Euler(0, Math.PI, 0);
      break;
    case 'F35':
      path = 'assets/planes/F35/F35.gltf';
      scale = new THREE.Vector3(30, 30, 30);
      position = new THREE.Vector3(0, 0.1, 0);
      rotation = new THREE.Euler(0, Math.PI, 0);
      break;
    case 'intergalactic':
      path = 'assets/intergalactic/intergalactic.gltf';
      scale = new THREE.Vector3(1, 1, 1);
      position = new THREE.Vector3(0, 0.9, 1);
      rotation = new THREE.Euler(0, Math.PI, 0);
      break;
    default:
      console.warn('לא זוהה מטוס בשם:', modelName);
      return;
  }

  loader.load(
    path,
    (gltf) => {
      currentPlane = gltf.scene;
      currentPlane.scale.copy(scale);
      currentPlane.position.copy(position);
      currentPlane.rotation.copy(rotation);
      player.add(currentPlane);
      console.log('המודל נטען בהצלחה:', modelName);
    },
    undefined,
    (error) => console.error(`שגיאה בטעינת ${modelName}:`, error)
  );
}

// ניצור 2 כפתורים לבחירת המטוס לדוגמה
function createPlaneSelectionUI() {
  const button747 = document.createElement('button');
  button747.innerText = 'בחר מטוס 747';
  button747.style.cssText = 'position: absolute; top: 10px; left: 150px; z-index: 9999;';
  button747.addEventListener('click', () => loadPlane('747'));
  document.body.appendChild(button747);
  
  const buttonF35 = document.createElement('button');
  buttonF35.innerText = 'בחר מטוס F35';
  buttonF35.style.cssText = 'position: absolute; top: 40px; left: 150px; z-index: 9999;';
  buttonF35.addEventListener('click', () => loadPlane('F35'));
  document.body.appendChild(buttonF35);

  const buttonIntergalactic = document.createElement('button');
  buttonIntergalactic.innerText = 'בחר מטוס Intergalactic';
  buttonIntergalactic.style.cssText = 'position: absolute; top: 70px; left: 150px; z-index: 9999;';
  buttonIntergalactic.addEventListener('click', () => loadPlane('intergalactic'));
  document.body.appendChild(buttonIntergalactic);
}
createPlaneSelectionUI();

// ממשק משתמש בסיסי (אלטיטוד, ניקוד, וכו')
function createUI() {
  const altitudeDisplay = document.createElement('div');
  altitudeDisplay.id = 'altitude';
  altitudeDisplay.style.cssText = `
    position: absolute; top: 10px; left: 10px; padding: 8px;
    background-color: rgba(0, 0, 0, 0.5); color: #fff;
    font-family: Arial, sans-serif; z-index: 9999;
  `;
  document.body.appendChild(altitudeDisplay);

  const scoreDisplay = document.createElement('div');
  scoreDisplay.id = 'score';
  scoreDisplay.style.cssText = `
    position: absolute; top: 50px; left: 10px; padding: 8px;
    background-color: rgba(0, 0, 0, 0.5); color: #fff;
    font-family: Arial, sans-serif; z-index: 9999;
  `;
  document.body.appendChild(scoreDisplay);

  const crashOverlay = document.createElement('div');
  crashOverlay.id = 'crash';
  crashOverlay.style.cssText = `
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        padding: 20px; background-color: rgba(255, 0, 0, 0.7); color: #fff;
        font-family: Arial, sans-serif; font-size: 24px; z-index: 9999; display: none;
    `;
  crashOverlay.innerHTML = "התרסקת! לחץ R לאיתחול";
  document.body.appendChild(crashOverlay);

  return { altitudeDisplay, scoreDisplay, crashOverlay };
}

const ui = createUI();

// תאורה
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

// קרקע ומסלול המראה
function createGroundAndRunway() {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(10000, 10000),
    new THREE.MeshBasicMaterial({ color: 0x01af10 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const groundCollision = new THREE.Mesh(
    new THREE.BoxGeometry(10000, 1, 10000),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  groundCollision.position.y = -0.3;
  scene.add(groundCollision);

  const runway = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.02, 100),
    new THREE.MeshBasicMaterial({ color: 0xaaaaaa })
  );
  runway.position.y = 0.052;
  scene.add(runway);

  const runwayLine = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 190),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  runwayLine.rotation.x = -Math.PI / 2;
  runwayLine.position.y = 0.11;
  scene.add(runwayLine);

  return { groundCollision, runway };
}

const { groundCollision, runway } = createGroundAndRunway();

// --------------------------------------
//   טעינת מודלי בניינים במקום קוביות
// --------------------------------------

const buildingLoader = new GLTFLoader();
// רשימת קבצי GLTF של בניינים – שים פה את הקבצים שיש ברשותך
const buildingPaths = [
  'assets/buildings/ploads_files_2929331_desert+house.gltf',
  // הוסף כמה שתרצה
];

// כאן נשמור את ה־scene של כל מודל טעון. לאחר מכן נשכפל (clone) בעת יצירה בעולם
const buildingModels = [];

// נטען את כל מודלי הבניינים מראש (באופן אסינכרוני)
buildingPaths.forEach((path) => {
  buildingLoader.load(
    path,
    (gltf) => {
      buildingModels.push(gltf.scene);
      console.log('מודל בניין נטען:', path);
    },
    undefined,
    (error) => console.error('שגיאה בטעינת מודל בניין:', path, error)
  );
});

// פונקציה שעושה clone למודל בניין רנדומלי מתוך הרשימה
function createRandomBuildingModel() {
  if (buildingModels.length === 0) {
    // אם עדיין לא נטענו מודלים או אין בכלל
    // נחזיר null כדי שלא ניצור כלום
    return null;
  }
  // בחירת מודל רנדומלי
  const randomIndex = Math.floor(Math.random() * buildingModels.length);
  const originalScene = buildingModels[randomIndex];
  // שיבוט של כל העץ
  const building = originalScene.clone(true);
  return building;
}

// ------------------------------------------------------
//   החלפת הקוד הישן של יצירת גורדי שחקים בקוביות – 
//    במקום זה נשתמש במודלים מ־GLTF (אם נטענו)
// ------------------------------------------------------

const buildings = new Map();
const gridSize = 30;
const renderDistance = 25;
const removeDistance = 35;

function updateBuildings() {
  const playerI = Math.floor(player.position.x / gridSize);
  const playerJ = Math.floor(player.position.z / gridSize);

  for (let i = playerI - renderDistance; i <= playerI + renderDistance; i++) {
    for (let j = playerJ - renderDistance; j <= playerJ + renderDistance; j++) {
      const key = `${i},${j}`;
      // נוודא שלא תיצור במיקום המסלול
      if (!buildings.has(key) && !(i === 0 && j >= -5 && j <= 5)) {
        // נקבע ש־70% מהפעמים ייבנה בניין
        if (Math.random() < 0.7) {
          const buildingScene = createRandomBuildingModel();
          if (buildingScene) {
            // אפשר להוסיף שינויים – למשל קנה מידה, סיבוב וכו'
            // למשל להגדיל חלק מהמודלים, או למקם אותם בצורה קצת רנדומלית
            buildingScene.scale.set(1.5, 1.5, 1.5);

            // נרצה לדעת את גובה המודל כדי להניח אותו נכון על הרצפה,
            // אבל לשם הפשטות נמקם אותו ככה שה"בסיס" שלו יהיה בגובה 0.
            // אם צריך התאמה מדויקת – יש למדוד boundingBox של המודל.
            buildingScene.position.set(i * gridSize, 0, j * gridSize);

            scene.add(buildingScene);
            buildings.set(key, buildingScene);
          } else {
            // אם אין מודל זמין – נשתמש בגיבוי של קובייה
            const height = Math.random() * 40;
            const fallbackBox = new THREE.Mesh(
              new THREE.BoxGeometry(10, height, 8),
              new THREE.MeshBasicMaterial({ color: randomColor() })
            );
            fallbackBox.position.set(i * gridSize, height / 2, j * gridSize);
            scene.add(fallbackBox);
            buildings.set(key, fallbackBox);
          }
        } else {
          buildings.set(key, null);
        }
      }
    }
  }

  // מחיקת בניינים רחוקים מדי
  const keysToRemove = [];
  buildings.forEach((building, key) => {
    if (!building) return;
    const [i, j] = key.split(',').map(Number);
    if (Math.abs(i - playerI) > removeDistance || Math.abs(j - playerJ) > removeDistance) {
      scene.remove(building);
      // אם זה Mesh, מומלץ לפנות זיכרון:
      if (building.geometry) building.geometry.dispose();
      if (building.material) building.material.dispose();
      keysToRemove.push(key);
    }
  });
  keysToRemove.forEach((key) => buildings.delete(key));
}

// ==================== אירוע שינוי גודל חלון ====================
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ==================== תנועת עכבר כשה pointerLock פעיל ====================
function onMouseMove(event) {
  if (!isPointerLocked) return;
  mouseX -= event.movementX * mouseSensitivity;
  mouseY -= event.movementY * mouseSensitivity;
}

// ==================== ירי טילים ====================
function shootMissile() {
  // בדיקת זמן מאז הירי האחרון
  const now = performance.now();
  if (now - lastFireTime < FIRE_RATE) return;
  if (missiles.length >= MAX_MISSILES) return;

  // יצירת טיל
  const missileGroup = new THREE.Group();

  const missileBodyGeo = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
  const missileBodyMat = new THREE.MeshPhongMaterial({ color: 0xff4444 });
  const body = new THREE.Mesh(missileBodyGeo, missileBodyMat);
  body.rotation.x = Math.PI / 2;
  missileGroup.add(body);

  const missileTipGeo = new THREE.ConeGeometry(0.2, 0.4, 8);
  const missileTipMat = new THREE.MeshPhongMaterial({ color: 0xffaa44 });
  const tip = new THREE.Mesh(missileTipGeo, missileTipMat);
  tip.position.z = 1.2; 
  tip.rotation.x = Math.PI / 2;
  missileGroup.add(tip);

  // מיקום וקווטרניון לפי המטוס
  missileGroup.position.copy(player.position);
  missileGroup.rotation.copy(player.rotation);
  // הנחה מעט לפני המטוס
  missileGroup.translateZ(-2.5);

  // וקטור מהירות
  const baseVelocity = new THREE.Vector3(0, 0, -PROJECTILE_SPEED);
  baseVelocity.applyQuaternion(player.quaternion);

  // הוספה למערך
  missileGroup.userData = {
    velocity: baseVelocity.clone(),
  };

  scene.add(missileGroup);
  missiles.push(missileGroup);

  lastFireTime = now;
}

// ==================== בדיקת קוליזיות של טילים ====================
function updateMissiles() {
  for (let i = missiles.length - 1; i >= 0; i--) {
    const missile = missiles[i];
    const velocity = missile.userData.velocity;
    // הזזה לפי velocity
    missile.position.x += velocity.x * deltaTime * 60;
    missile.position.y += velocity.y * deltaTime * 60;
    missile.position.z += velocity.z * deltaTime * 60;

    // עדכון כיוון הטיל
    const dir = velocity.clone().normalize();
    missile.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      dir
    );

    // טווח גדול - הסרה
    if (missile.position.distanceTo(player.position) > 2000) {
      scene.remove(missile);
      missiles.splice(i, 1);
      continue;
    }

    // בדיקת התנגשות עם בניינים
    const missileBox = new THREE.Box3().setFromObject(missile);
    for (let j = 0; j < buildings.length; j++) {
      const building = buildings[j];
      const buildingBox = new THREE.Box3().setFromObject(building);
      if (missileBox.intersectsBox(buildingBox)) {
        // פגיעה
        scene.remove(missile);
        missiles.splice(i, 1);

        // אפשר להסיר את הבניין או "להרוס" אותו
        scene.remove(building);
        buildings.splice(j, 1);

        score += 100; // ניקוד
        break;
      }
    }
  }
}

// שמיים ועננים
let skyDome;
textureLoader.load(
  'assets/images/stars.png',
  (texture) => {
    skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(18000, 64, 64),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, transparent: true })
    );
    skyDome.visible = false;
    scene.add(skyDome);
  },
  undefined,
  (error) => console.error('שגיאה בטעינת stars.png:', error)
);

const clouds = [];
textureLoader.load(
  'assets/images/clouds.png',
  (texture) => {
    for (let i = 0; i < 30; i++) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: texture, transparent: true })
      );
      sprite.scale.set(600, 200, 5);
      sprite.position.set(
        (Math.random() - 0.5) * 1000,
        20 + Math.random() * 450,
        (Math.random() - 0.95) * 1000
      );
      clouds.push(sprite);
      scene.add(sprite);
    }
  },
  undefined,
  (error) => console.error('שגיאה בטעינת clouds.png:', error)
);

// מתנות ו-Powerups
let gifts = [];
function createGifts(count = 20) {
  gifts.forEach((gift) => scene.remove(gift));
  gifts = [];
  for (let i = 0; i < count; i++) {
    const gift = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.MeshBasicMaterial({ color: randomColor() })
    );
    gift.position.set(
      (Math.random() - 0.5) * 1000,
      5 + Math.random() * 30,
      (Math.random() - 0.5) * 1000
    );
    scene.add(gift);
    gifts.push(gift);
  }
}

let activePowerup = null;
let powerupTimer = 0;
function applyPowerup() {
  const rand = Math.random();
  activePowerup = rand < 0.5 ? 'speedBoost' : 'doublePoints';
  powerupTimer = 300;
}

createGifts();

// ========== משתנים עזר למכניקה ==========
const keys = {};
window.addEventListener('keydown', (e) => (keys[e.key] = true));
window.addEventListener('keyup', (e) => (keys[e.key] = false));

document.addEventListener('click', () => {
  renderer.domElement.requestPointerLock();
});

// משתני מצלמה וכו'
let cameraYaw = 0;
let cameraPitch = 0;
const sensitivity = 0.002;

document.addEventListener('mousemove', (event) => {
  if (document.pointerLockElement === renderer.domElement) {
    cameraYaw -= event.movementX * sensitivity;
    cameraPitch -= event.movementY * sensitivity;
    cameraPitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraPitch));
  }
});

let speed = 0;
const maxSpeed = 0.9;
const minSpeed = 0;
const gravity = 0.01;
let score = 0;
let crashed = false;
let isDay = true;
let timeOfDay = 0;
const cameraModes = ['third', 'first', 'thirdFar'];
let cameraModeIndex = 0;
let lastC = false;
let lastN = false;

// לולאת אנימציה
function animate() {
  requestAnimationFrame(animate);

  if (!crashed) {
    // עדכון בניינים סביב השחקן
    updateBuildings();

    // שליטה במטוס
    if (keys['a']) player.rotation.z += 0.01;
    if (keys['d']) player.rotation.z -= 0.01;
    if (keys['w']) player.rotation.x -= 0.01;
    if (keys['s']) player.rotation.x += 0.01;
    if (keys['q']) player.rotation.y += 0.01;
    if (keys['e']) player.rotation.y -= 0.01;

    // שליטה במהירות
    if (keys['ArrowUp']) speed = Math.min(maxSpeed, speed + 0.001);
    if (keys['ArrowDown']) speed = Math.max(minSpeed, speed - 0.001);
    if (keys['Space']) {
      shootMissile();
    }
    // תנועה בפועל
    const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
    player.position.add(direction.multiplyScalar(speed));
    // גרביטציה פשוטה
    player.position.y -= gravity;
    if (player.position.y < 0.9) player.position.y = 0.9;

    // התנגשויות בסיסיות עם הקרקע/בניינים
    const playerBox = new THREE.Box3().setFromObject(player);
    const nearbyCollisions = [groundCollision, runway, ...Array.from(buildings.values()).filter(Boolean)];
    let collided = false;

    nearbyCollisions.forEach((obj) => {
      const objBox = new THREE.Box3().setFromObject(obj);
      if (playerBox.intersectsBox(objBox) && obj !== groundCollision && obj !== runway) {
        collided = true;
      }
    });

    if (collided) {
      crashed = true;
      speed = 0;
      ui.crashOverlay.style.display = 'block';
    }

    // מקשי איתחול / החלפת יום-לילה / מצב מצלמה
    if (keys['r']) resetSimulator();

    // מעגל יום-לילה
    timeOfDay += 0.001;
    const cycle = Math.sin(timeOfDay);
    if (cycle > 0 && !isDay) {
      switchToDay();
    } else if (cycle <= 0 && isDay) {
      switchToNight();
    }

    // לחיצה ידנית על N
    if (keys['n'] && !lastN) {
      isDay = !isDay;
      isDay ? switchToDay() : switchToNight();
    }
    lastN = keys['n'];

    // לחיצה על C משנה מצב מצלמה
    if (keys['c'] && !lastC) cameraModeIndex = (cameraModeIndex + 1) % cameraModes.length;
    lastC = keys['c'];

    // עדכון מצלמה
    const mode = cameraModes[cameraModeIndex];
    if (mode === 'first') {
      // מצלמה בגוף ראשון קצת מאחורי החזית
      const offset = new THREE.Vector3(0, 2, 0); 
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);
      offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), cameraPitch);
      camera.position.copy(player.position).add(offset);
      camera.lookAt(player.position);
    } else if (mode === 'third') {
      // מצלמה במבט שלישי קרוב
      const offset = new THREE.Vector3(4, 5, 10);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);
      offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), cameraPitch);
      camera.position.copy(player.position).add(offset);
      camera.lookAt(player.position);
    } else if (mode === 'thirdFar') {
      // מצלמה במבט שלישי רחוק יותר
      const offset = new THREE.Vector3(4, 5, 35);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);
      offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), cameraPitch);
      camera.position.copy(player.position).add(offset);
      camera.lookAt(player.position);
    }

    // ערפל (Fog)
    scene.fog = new THREE.Fog(0xcccccc, 40, 1300);

    // עדכון UI
    ui.altitudeDisplay.innerText = `גובה: ${player.position.y.toFixed(2)} מ'`;
    ui.scoreDisplay.innerText = `ניקוד: ${score}`;
  }

  renderer.render(scene, camera);
}

function switchToDay() {
  isDay = true;
  scene.background = new THREE.Color(0x87CEEB);
  directionalLight.intensity = 1;
  ambientLight.intensity = 0.7;
}

function switchToNight() {
  isDay = false;
  scene.background = new THREE.Color(0x000000);
  directionalLight.intensity = 0.3;
  ambientLight.intensity = 0.2;
}

function resetSimulator() {
  crashed = false;
  speed = 0;
  player.position.set(0, 0.9, 40);
  player.rotation.set(0, 0, 0);
  ui.crashOverlay.style.display = 'none';
  score = 0;

  // איפוס זוויות המצלמה
  cameraYaw = 0;
  cameraPitch = 0;
}

animate();

// התאמה לגודל חלון
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
