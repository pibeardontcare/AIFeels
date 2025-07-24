
let points = [];
let floorMeshes = []; 


import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0e2a); // Darker background for contrast

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(200, 100, 300);

const light = new THREE.AmbientLight(0xffffff, 2.2);
scene.add(light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

window.addEventListener('click', onClick, false);
window.addEventListener('mousemove', onMouseMove, false);

// window.addEventListener('touchstart', (e) => {
//   if (e.touches.length > 0) onClick(e.touches[0]);
// }, false);


// renderer.domElement.addEventListener('touchstart', (event) => {
//   event.preventDefault();
//   const touch = event.touches[0];
//   const rect = renderer.domElement.getBoundingClientRect();

//   mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
//   mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

//   raycaster.setFromCamera(mouse, camera);
//   const intersects = raycaster.intersectObjects(scene.children, true);

//   if (intersects.length > 0) {
//     onSphereTap(intersects[0].object);
//   }
// });

const subreddits = ["chatgpt", "artificialinteligence", "futurology", "jobs", "digitalmarketing"];
const activeSubs = new Set(subreddits);
const allData = {};

Promise.all(
  subreddits.map(sub =>
    fetch(`./data/${sub}.json`)
      .then(res => res.json())
      .then(json => { allData[sub] = json; })
  )
).then(() => {
  setupToggleUI();
  renderScene();
const isMobile = window.innerWidth < 768;

if (isMobile) {
  camera.position.set(0, 0, 300);        // Pull the camera back more
  controls.target.set(0, 0, -50);        // Focus slightly deeper
} else {
  camera.position.set(0, 0, 150);        // Your original setting
  controls.target.set(0, 0, -30);
}


//   camera.position.set(0, 0, 150); // Adjusted for better framing
// controls.target.set(0, 0, -30); // Focus deeper into the scene
  controls.update();
  animate();
});

function setupToggleUI() {
  document.querySelectorAll('.toggle').forEach(button => {
    button.addEventListener('click', () => {
      const sub = button.dataset.sub;
      if (activeSubs.has(sub)) {
        activeSubs.delete(sub);
        button.classList.remove('active');
      } else {
        activeSubs.add(sub);
        button.classList.add('active');
      }
      renderScene();
    });
  });
}



function renderScene() {

points = [];
floorMeshes = [];

const toRemove = [];

scene.children.forEach(obj => {
  const isPost = obj.name && obj.name.startsWith('post-');
  const isFloor = obj.name && obj.name.startsWith('floor-');
  const isLabel = obj.name && obj.name.startsWith('label-');
  const isTagged = obj.userData && (obj.userData.text || obj.userData.isLabel || obj.userData.isBox);

  if (isPost || isFloor || isLabel || isTagged) {
    toRemove.push(obj);
  }
});

toRemove.forEach(obj => {
  scene.remove(obj);
  if (obj.geometry) obj.geometry.dispose();
  if (obj.material) obj.material.dispose();
});


//   scene.children = scene.children.filter(obj => !obj.userData.text && !obj.userData.isLabel && !obj.userData.isBox);
  const spacing = 50;
  const subX = {};
  subreddits.forEach((sub, idx) => {
    subX[sub] = idx * spacing - (subreddits.length - 1) * spacing / 2;
  });

  [...activeSubs].forEach((sub, subIndex) => {
    const posts = allData[sub] || [];
    const sorted = posts.sort((a, b) => b.num_comments - a.num_comments);

    const bounds = new THREE.Box3();
    const group = new THREE.Group();

    sorted.forEach((post, i) => {
      const color = post.sentiment > 0.2 ? 0xA5D48F : post.sentiment < -0.2 ? 0xCA5770 : 0xEAECC9;
      const geometry = new THREE.SphereGeometry(1.5, 8, 8);
      const material = new THREE.MeshStandardMaterial({ color, emissive: 0x000000, roughness: 0.6, metalness: 0.2 });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.name = `post-${sub}`;
      console.log(`Created sphere: ${sphere.name}`);



      const xOffset = i % 10 * 4; // num_comments slice across x-axis
      const yOffset = post.sentiment * 50; // sentiment
      const zOffset = -Math.floor(i / 10) * 4; // time into depth per 10

      const pos = new THREE.Vector3(subX[sub] + xOffset - 20, yOffset, zOffset);
      sphere.position.copy(pos);
      bounds.expandByPoint(pos);
      group.add(sphere);
      points.push(sphere);


      sphere.userData = {
        text: post.text,
        date: post.created_utc ? new Date(post.created_utc * 1000).toISOString().split('T')[0] : 'Date not available',
        sentiment: post.sentiment
      };
      
    });

    // Floor plane under each subreddit cluster
    const size = new THREE.Vector3();
    bounds.getSize(size);
    const center = new THREE.Vector3();
    bounds.getCenter(center);

    const floorSize = 40; // Set this to your desired consistent size
    const floorGeo = new THREE.PlaneGeometry(floorSize, floorSize);

    const floorMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.05, transparent: true, side: THREE.DoubleSide });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.name = `floor-${sub}`;
    console.log(`Created floor: ${floor.name}`);


    floor.rotation.x = -Math.PI / 2;
    const floorY = -60; // or whatever base level you prefer
   const uniformZ = -0; // or whatever Z depth looks good
    floor.position.set(center.x, floorY, uniformZ);

    const box = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(center.x, 0, uniformZ),
    new THREE.Vector3(floorSize, 1000, floorSize) // large Y to include all points
);
floor.userData.boundingBox = box;


    floor.userData = { isBox: true };
    scene.add(floor);
   floorMeshes.push(floor); // ✅ Add this line


    group.children.forEach(obj => scene.add(obj));
    console.log(`Finished rendering ${sorted.length} posts for: ${sub}`);

  });

  addSubredditLabels(subX);
}

function addSubredditLabels(subX) {
  subreddits.forEach(sub => {
    const label = makeTextSprite(`r/${sub}`);
   label.name = `label-${sub}`;

    label.position.set(subX[sub], -45, 20); // Just above floor, in front of cluster
    label.scale.set(40, 10, 1);               // Adjust size as needed
    label.rotation.y = Math.PI / 2;         // Rotate to face sideways (perpendicular to floor plane)

    label.userData = { isLabel: true };
    scene.add(label);
  });
}

function makeTextSprite(message) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.font = 'bold 48px Arial';
  context.fillStyle = 'white';
  context.textAlign = 'left';
  context.textBaseline = 'middle';
  context.fillText(message, 20, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMaterial);
  return sprite;
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);

  for (const floor of floorMeshes) {
  if (floor === activeFloor) {
    floor.material.color.set(0xffd700);
    floor.material.opacity = 0.3;
  } else {
    floor.material.color.set(0xffffff);
    floor.material.opacity = 0.05;
  }
}

}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function onClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const hoverTargets = scene.children.filter(obj => !(obj instanceof THREE.Sprite));
  const intersects = raycaster.intersectObjects(hoverTargets);

  // Reset all points' glow and size
  points.forEach(p => {
    p.scale.set(1, 1, 1);
    p.material.emissive.setHex(0x000000);
  });

  if (intersects.length > 0) {
    const obj = intersects[0].object;

    if (obj.userData.text) {
      // Add glow + scale effect
      obj.scale.set(3, 3, 3);
      obj.material.emissive.setHex(0xffd700);

      // Show tooltip
      showTooltip(obj.userData);
    }
  } else {
    document.getElementById('tooltip').style.display = 'none';
  }
}


let activeFloor = null;

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);


  
  // Reset all points to default
  points.forEach(p => {
    p.scale.set(1, 1, 1);
    p.material.emissive.setHex(0x000000);
  });

  const intersects = raycaster.intersectObjects(points);

  if (intersects.length > 0) {
    const hovered = intersects[0].object;
    hovered.scale.set(2.5, 2.5, 2.5);
    hovered.material.emissive.setHex(0xffd700); // gold glow
  }

  // Floor glow logic
  activeFloor = null;
  for (const floor of floorMeshes) {
 const box = floor.userData?.boundingBox;
if (box) {
  const worldMouse = raycaster.ray.origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(100));
  if (box.containsPoint(worldMouse)) {
    activeFloor = floor;
  }
}

  }
}

window.addEventListener('touchstart', function (event) {
  if (event.touches.length > 0) {
    const touch = event.touches[0];
    const rect = renderer.domElement.getBoundingClientRect();

    mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const hoverTargets = scene.children.filter(obj => !(obj instanceof THREE.Sprite));
    const intersects = raycaster.intersectObjects(hoverTargets);

    points.forEach(p => {
      p.scale.set(1, 1, 1);
      p.material.emissive.setHex(0x000000);
    });

    if (intersects.length > 0) {
      const obj = intersects[0].object;
      if (obj.userData.text) {
        obj.scale.set(3, 3, 3);
        obj.material.emissive.setHex(0xffd700);
        showTooltip(obj.userData);
      }
    } else {
      document.getElementById('tooltip').style.display = 'none';
    }
  }
}, { passive: true });


function showTooltip(data) {
  const tooltip = document.getElementById('tooltip');
  const localDate = new Date(data.date).toLocaleString();
  let sentimentLabel = 'Neutral';
  let sentimentColor = '#EAECC9';
  if (data.sentiment > 0.2) sentimentLabel = 'Positive', sentimentColor = '#A5D48F';
  else if (data.sentiment < -0.2) sentimentLabel = 'Negative', sentimentColor = '#CA5770';

  document.getElementById('tooltip-content').innerHTML = `
    <div style="font-weight: bold; color: ${sentimentColor}; margin-bottom: 4px;">${sentimentLabel}</div>
    <div style="font-size: 12px; color: #ccc; margin-bottom: 8px;"><em>${localDate}</em></div>
    <div>${data.text}</div>
  `;
  tooltip.style.display = 'block';
}


const chevron = document.getElementById('chevron-toggle');
const sidebar = document.getElementById('sidebar');

chevron.addEventListener('click', () => {
  sidebar.classList.toggle('closed');
  chevron.setAttribute('data-icon', sidebar.classList.contains('closed') ? '›' : '‹');
});

