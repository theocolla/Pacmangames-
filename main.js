import './style.css'
import * as THREE from 'three';
import { World } from './World.js';
import { Player } from './Player.js';
import { GameManager } from './GameManager.js';
import { CameraController } from './CameraController.js';
import { OutlineEffect } from './OutlineEffect.js';

// Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111122); // Dark blue space background

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Initial camera position (will be controlled by player later)
camera.position.set(0, 30, 30);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
document.body.appendChild(renderer.domElement);

// Game Objects
const world = new World(scene);
const player = new Player(scene, world);
const cameraController = new CameraController(camera, world);
cameraController.setTarget(player);
const gameManager = new GameManager(scene, world, player);

// Enhanced Lighting for better shadows and depth
// Use a Directional Light that follows the camera or is fixed relative to the scene?
// For a spherical world, a fixed directional light causes "night" on one side.
// Let's put it high up and maybe add another one or use ambient light to fill.
// Or, make the directional light follow the player? That's best for "sun" effect.
// For now, let's just soften it and ensure it covers the area.
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(50, 100, 50);
directionalLight.castShadow = true;

// Configure shadow quality
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
directionalLight.shadow.bias = -0.0005; // Adjusted bias to reduce artifacts
directionalLight.shadow.radius = 4; // Softer shadows (PCFSoftShadowMap uses this?)

scene.add(directionalLight);

// Outline effect for cartoon style
const outlineEffect = new OutlineEffect(renderer, scene, camera);
outlineEffect.setThickness(0.02); // Subtle outlines
outlineEffect.setColor(0x000000); // Black outlines

// Input Handling
const input = {
  up: false,
  down: false,
  left: false,
  right: false
};

window.addEventListener('keydown', (e) => {
  switch (e.code) {
    case 'ArrowUp': case 'KeyW': input.up = true; break;
    case 'ArrowDown': case 'KeyS': input.down = true; break;
    case 'ArrowLeft': case 'KeyA': input.left = true; break;
    case 'ArrowRight': case 'KeyD': input.right = true; break;
  }
});

window.addEventListener('keyup', (e) => {
  switch (e.code) {
    case 'ArrowUp': case 'KeyW': input.up = false; break;
    case 'ArrowDown': case 'KeyS': input.down = false; break;
    case 'ArrowLeft': case 'KeyA': input.left = false; break;
    case 'ArrowRight': case 'KeyD': input.right = false; break;
  }
});

// Handle Window Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Game Loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  // Only update player if game has started
  if (gameManager.gameStarted && !gameManager.gamePaused) {
    player.update(input, delta, cameraController);
  }

  gameManager.update(delta);

  // Render with outline effect
  outlineEffect.render();
}

animate();
