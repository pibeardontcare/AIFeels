import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';


const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xEAECC9); // Beige

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.z = 200;

const light = new THREE.AmbientLight(0xffffff, 2.2); // soft white light
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // soft white
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);


const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

window.addEventListener('click', onClick, false);
window.addEventListener('touchstart', (e) => {
  if (e.touches.length > 0) {
    onClick(e.touches[0]);
  }
}, false);


scene.background = new THREE.Color(0x284E71);


const subreddits = [
  "chatgpt",
  "artificialinteligence",
  "futurology",
  "jobs",
  "digitalmarketing",
  "sports"
];

const activeSubs = new Set(subreddits);
const allData = {};

Promise.all(
  subreddits.map(sub =>
    fetch(`./data/${sub}.json`)
      .then(res => res.json())
      .then(json => {
        allData[sub] = json;
      })
  )
).then(() => {
  setupToggleUI();
  renderScene();
  animate(); // 👈 start animation once data is ready
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
  // Remove all previously added spheres (but keep lights/camera/etc.)
  scene.children = scene.children.filter(obj => !obj.userData.text);

  const combined = [...activeSubs]
    .flatMap(sub => allData[sub] || [])
    .sort((a, b) => b.num_comments - a.num_comments)
    .slice(0, 300);

  combined.forEach((post, i) => {
    const color = post.sentiment > 0.2 ? 0xA5D48F :
                  post.sentiment < -0.2 ? 0xCA5770 : 0xEAECC9;

    const geometry = new THREE.SphereGeometry(1.5, 8, 8);
   const material = new THREE.MeshStandardMaterial({
        color,
        emissive: 0x000000, // no glow by default
        emissiveIntensity: 1,
        roughness: 0.6,
        metalness: 0.2
    });

    const sphere = new THREE.Mesh(geometry, material);

    sphere.position.x = Math.sin(i) * 50;
    sphere.position.y = post.sentiment * 50;
    sphere.position.z = (i - combined.length / 2) * 2;

    sphere.userData = {
      text: post.text,
      date: post.created_utc
        ? new Date(post.created_utc * 1000).toISOString().split('T')[0]
        : 'Date not available',
      sentiment: post.sentiment
    };

    scene.add(sphere);
  });

  renderer.render(scene, camera);
}


function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
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
   const intersects = raycaster.intersectObjects(scene.children);
console.log('Clicked', intersects);  // ✅ now inside the function

if (intersects.length > 0) {
  const obj = intersects[0].object;
  if (obj.userData.text) {
    showTooltip(event.clientX, event.clientY, obj.userData);
  }
} else {
  // Hide tooltip if clicking empty space
  document.getElementById('tooltip').style.display = 'none';
}

 }



function showTooltip(x, y, data) {
  const tooltip = document.getElementById('tooltip');
  const localDate = new Date(data.date).toLocaleString();

  let sentimentLabel = 'Neutral';
  let sentimentColor = '#EAECC9';
  if (data.sentiment > 0.2) {
    sentimentLabel = 'Positive';
    sentimentColor = '#A5D48F';
  } else if (data.sentiment < -0.2) {
    sentimentLabel = 'Negative';
    sentimentColor = '#CA5770';
  }

  tooltip.innerHTML = `
    <div style="font-weight: bold; color: ${sentimentColor}; margin-bottom: 4px;">${sentimentLabel}</div>
    <div style="font-size: 12px; color: #ccc; margin-bottom: 8px;"><em>${localDate}</em></div>
    <div>${data.text}</div>
  `;

  // Apply display & dynamic position
  tooltip.style.display = 'block';
  tooltip.style.left = '0px';
  tooltip.style.top = '0px';

  const tooltipRect = tooltip.getBoundingClientRect();
  const padding = 20;

  let left = x + 15;
  let top = y + 15;

  if (left + tooltipRect.width > window.innerWidth - padding) {
    left = window.innerWidth - tooltipRect.width - padding;
  }

  if (top + tooltipRect.height > window.innerHeight - padding) {
    top = window.innerHeight - tooltipRect.height - padding;
  }

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}


let lastHovered = null;

// window.addEventListener('mousemove', (event) => {
//   mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//   mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

//   raycaster.setFromCamera(mouse, camera);
//   const intersects = raycaster.intersectObjects(scene.children);

//   // Reset previous
//   if (lastHovered && lastHovered.scale) {
//     lastHovered.scale.set(1, 1, 1);
//   }

//   if (intersects.length > 0) {
//     const hovered = intersects[0].object;
//     hovered.scale.set(1.5, 1.5, 1.5); // Grow slightly
//     lastHovered = hovered;
//   } else {
//     lastHovered = null;
//   }

//   if (lastHovered) {
//   lastHovered.scale.set(1, 1, 1);
//   lastHovered.material.emissive.setHex(0x000000); // reset glow
// }

// if (intersects.length > 0) {
//   const hovered = intersects[0].object;
//   hovered.scale.set(1.5, 1.5, 1.5);
//   hovered.material.emissive.setHex(0xffffff); // white glow
//   lastHovered = hovered;
// } else {
//   lastHovered = null;
// }

// });
window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children);

  // Reset previous hovered object
  if (lastHovered) {
    lastHovered.scale.set(1, 1, 1);
    if (lastHovered.material?.emissive) {
      lastHovered.material.emissive.setHex(0x000000);
    }
  }

  // Apply hover effect to the new object
  if (intersects.length > 0) {
    const hovered = intersects[0].object;
    hovered.scale.set(1.5, 1.5, 1.5);
    if (hovered.material?.emissive) {
      hovered.material.emissive.setHex(0xffffff); // glow white
    }
    lastHovered = hovered;
  } else {
    lastHovered = null;
  }
});
