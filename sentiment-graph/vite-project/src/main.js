
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 200;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // Update the raycaster
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children);

  if (intersects.length > 0) {
    const intersect = intersects[0];
    const { postText, sentiment, date } = intersect.object.userData;

    tooltip.innerHTML = `
      <strong>Date:</strong> ${date}<br/>
      <strong>Sentiment:</strong> ${sentiment}<br/>
      <strong>Post:</strong> ${postText}
    `;
   tooltip.style.left = `${mousePixel.x + 10}px`;
tooltip.style.top = `${mousePixel.y + 10}px`;
    tooltip.style.display = 'block';
  } else {
    tooltip.style.display = 'none';
  }

  renderer.render(scene, camera);
}

let mousePixel = { x: 0, y: 0 };

window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  mousePixel.x = event.clientX;
  mousePixel.y = event.clientY;
});

window.addEventListener('mousemove', (event) => {
  // Convert mouse position to normalized device coordinates (-1 to +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});


fetch('./reddit_ai_sentiment.json')
  .then(res => res.json())
  .then(data => {
    let positive = 0, neutral = 0, negative = 0;
    const total = data.length;

    // Map subreddits to unique indices for color shading and z-lane
    const subredditList = [...new Set(data.map(p => p.subreddit))];
    const subredditMap = new Map();
    subredditList.forEach((sr, idx) => subredditMap.set(sr, idx));
    const numSubreddits = subredditList.length;

    data.forEach((post, i) => {
      const sentiment = post.sentiment;

      // Count sentiment types
      if (sentiment > 0.2) positive++;
      else if (sentiment < -0.2) negative++;
      else neutral++;

      const srIndex = subredditMap.get(post.subreddit);
      const shadeFactor = srIndex / numSubreddits;
      

      // Sentiment + subreddit based color
      let color;
      if (sentiment > 0.2) {
        color = new THREE.Color().setHSL(0.33, 1, 0.4 + shadeFactor * 0.2); // Green shades
      } else if (sentiment < -0.2) {
        color = new THREE.Color().setHSL(0.0, 1, 0.4 + shadeFactor * 0.2);  // Red shades
      } else {
        color = new THREE.Color().setHSL(0.15, 1, 0.4 + shadeFactor * 0.2); // Yellow shades
      }

      // Create and position sphere
      const geometry = new THREE.SphereGeometry(1.5, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color });
      const sphere = new THREE.Mesh(geometry, material);

      sphere.userData = {
  postText: post.title || post.body || '(No content)',
  sentiment: post.sentiment.toFixed(3),
  date: post.created_utc
  ? new Date(post.created_utc * 1000).toISOString().split('T')[0]
  : 'Date not available'

};


const spreadX = window.innerWidth / 15; // adjust divisor to control density
sphere.position.x = (i - data.length / 2) * (spreadX / data.length);
             // time-based x
const sentimentScale = window.innerHeight / 4; // scale for visual space
sphere.position.y = sentiment * sentimentScale;

const zSpread = 200; // control how much 3D depth is used
sphere.position.z = (srIndex / numSubreddits) * zSpread - (zSpread / 2);

camera.position.z = 300; // You can dynamically calculate this if needed
// was *10, now *20
     // subreddit lane in z

      scene.add(sphere);
    });

    // Add sentiment breakdown overlay
    const overlay = document.getElementById('sentiment-overlay');
    if (overlay) {
      overlay.innerHTML = `
        <strong>Sentiment Breakdown</strong><br/>
        😊 Positive: ${(positive / total * 100).toFixed(1)}%<br/>
        😐 Neutral: ${(neutral / total * 100).toFixed(1)}%<br/>
        😠 Negative: ${(negative / total * 100).toFixed(1)}%
      `;
    }

    animate();
  });
