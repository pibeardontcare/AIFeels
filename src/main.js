import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';


const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xEAECC9); // Beige

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.z = 200;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

window.addEventListener('click', onClick, false);

scene.background = new THREE.Color(0x284E71);

fetch('./reddit_ai_sentiment.json')
  .then(res => res.json())
  .then(data => {
    data.forEach((post, i) => {
      const color = post.sentiment > 0.2 ? 0xA5D48F :
                    post.sentiment < -0.2 ? 0xCA5770 : 0xEAECC9;

      const geometry = new THREE.SphereGeometry(1.5, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color });
      const sphere = new THREE.Mesh(geometry, material);

      sphere.position.x = Math.sin(i) * 50;
      sphere.position.y = post.sentiment * 50;
      sphere.position.z = (i - data.length / 2) * 2;

      // Attach post metadata
      sphere.userData = {
        text: post.text,
        date: post.created_utc
          ? new Date(post.created_utc * 1000).toISOString().split('T')[0]
          : 'Date not available',
        sentiment: post.sentiment
      };

      scene.add(sphere);
    });

    animate();
  });


function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function formatDate(dateString) {
  const d = new Date(dateString);
  return isNaN(d) ? dateString : d.toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}


function getSentimentLabel(value) {
  if (value > 0.2) return '😊 Positive';
  if (value < -0.2) return '😠 Negative';
  return '😐 Neutral';
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
   if (data.sentiment > 0.2) sentimentLabel = 'Positive';
   else if (data.sentiment < -0.2) sentimentLabel = 'Negative';
   tooltip.innerHTML = `
     <strong>${sentimentLabel}</strong><br/>
     <em>${localDate}</em><br/>
     ${data.text}
   `;
   tooltip.style.left = x + 15 + 'px';
   tooltip.style.top = y + 15 + 'px';
   tooltip.style.display = 'block';
}
