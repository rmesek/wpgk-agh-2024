/** @type {import('three')} */
THREE = THREE;

// Global variables
let scene, camera, webGLRenderer, orbitControls;
const clock = new THREE.Clock();
const controls = { speed: 1 };
const stats = initStats();
const gui = initGUI();

// Custom global variables
let ambientLight, directionalLight;
let polyhedron, cube, sphere;
let mirrorCuboid, mirrorCuboidCamera;

// Main function
init();
animate();

// Functions
function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 20000);

  webGLRenderer = new THREE.WebGLRenderer({ antialias: true });
  webGLRenderer.setClearColor(new THREE.Color(0xffffff));
  webGLRenderer.setSize(window.innerWidth, window.innerHeight);
  webGLRenderer.shadowMap.enabled = true;
  webGLRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById("WebGL-output").appendChild(webGLRenderer.domElement);

  // Add orbit controls
  orbitControls = new THREE.OrbitControls(camera, webGLRenderer.domElement);

  // Position and point the camera to the center of the scene
  camera.position.set(0, 12, 28);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  // Add ambient light
  ambientLight = new THREE.AmbientLight(0x141414, 3);
  scene.add(ambientLight);

  // Add directional light source
  directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(50, 50, 50);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 200;
  directionalLight.shadow.camera.left = -50;
  directionalLight.shadow.camera.right = 50;
  directionalLight.shadow.camera.top = 50;
  directionalLight.shadow.camera.bottom = -50;
  scene.add(directionalLight);

  // Add skybox
  const textureLoader = new THREE.TextureLoader();
  let materialArray = [];
  materialArray.push(new THREE.MeshBasicMaterial({ map: textureLoader.load("textures/dawnmountain-xpos.png") }));
  materialArray.push(new THREE.MeshBasicMaterial({ map: textureLoader.load("textures/dawnmountain-xneg.png") }));
  materialArray.push(new THREE.MeshBasicMaterial({ map: textureLoader.load("textures/dawnmountain-ypos.png") }));
  materialArray.push(new THREE.MeshBasicMaterial({ map: textureLoader.load("textures/dawnmountain-yneg.png") }));
  materialArray.push(new THREE.MeshBasicMaterial({ map: textureLoader.load("textures/dawnmountain-zpos.png") }));
  materialArray.push(new THREE.MeshBasicMaterial({ map: textureLoader.load("textures/dawnmountain-zneg.png") }));
  for (let i = 0; i < 6; i++) materialArray[i].side = THREE.BackSide;
  let skyboxGeom = new THREE.BoxGeometry(5000, 5000, 5000, 64, 64, 64);
  let skybox = new THREE.Mesh(skyboxGeom, materialArray);
  scene.add(skybox);

  // Add floor with shadows and bump mapping
  let floorTexture = new THREE.TextureLoader().load("textures/stone.jpg");
  let floorBump = new THREE.TextureLoader().load("textures/stone-bump.jpg");

  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  floorBump.wrapS = floorBump.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(10, 10);
  floorBump.repeat.set(10, 10);

  let floorMaterial = new THREE.MeshPhongMaterial({
    map: floorTexture,
    bumpMap: floorBump,
    bumpScale: 0.1,
  });

  let floorGeometry = new THREE.PlaneGeometry(100, 100, 1, 1);
  let floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -0.5 * Math.PI;
  floor.position.y = -5;
  floor.receiveShadow = true;
  scene.add(floor);

  // Add objects

  // Polyhedron with normal texture
  const polyhedronTexture = new THREE.TextureLoader().load("textures/metal-rust.jpg");
  polyhedronTexture.wrapS = polyhedronTexture.wrapT = THREE.RepeatWrapping;
  polyhedronTexture.repeat.set(1, 1);
  const polyhedronMaterial = new THREE.MeshPhongMaterial({ map: polyhedronTexture });
  polyhedron = new THREE.Mesh(new THREE.IcosahedronGeometry(5, 0), polyhedronMaterial);
  polyhedron.position.set(9, 0, -5);
  polyhedron.castShadow = true;
  polyhedron.receiveShadow = true;
  scene.add(polyhedron);

  // Cube with normal mapping
  const cubeTexture = new THREE.TextureLoader().load("textures/metal-floor.jpg");
  const cubeNormal = new THREE.TextureLoader().load("textures/metal-floor-normal.jpg");
  cubeTexture.wrapS = cubeTexture.wrapT = THREE.RepeatWrapping;
  cubeTexture.repeat.set(1, 1);
  cubeNormal.wrapS = cubeNormal.wrapT = THREE.RepeatWrapping;
  cubeNormal.repeat.set(1, 1);
  const cubeMaterial = new THREE.MeshPhongMaterial({
    map: cubeTexture,
    normalMap: cubeNormal,
    normalScale: new THREE.Vector2(1, 1),
  });
  cube = new THREE.Mesh(new THREE.BoxGeometry(7, 7, 7), cubeMaterial);
  cube.position.set(-9, 0, 15);
  cube.castShadow = true;
  cube.receiveShadow = true;
  scene.add(cube);

  // Reflective cuboid
  mirrorCuboidCamera = new THREE.CubeCamera(0.1, 5000, 1024);
  scene.add(mirrorCuboidCamera);
  const mirrorCuboidMaterial = new THREE.MeshBasicMaterial({ envMap: mirrorCuboidCamera.renderTarget.texture });
  mirrorCuboid = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 0.1, 20, 20, 4), mirrorCuboidMaterial);
  mirrorCuboid.rotation.set(-Math.PI / 32, 0, 0);
  mirrorCuboid.position.set(-9, 2, -5);
  mirrorCuboid.castShadow = true;
  scene.add(mirrorCuboid);

  // Transparent sphere
  const sphereTexture = new THREE.TextureLoader().load("textures/plaster.jpg");
  sphereTexture.wrapS = sphereTexture.wrapT = THREE.RepeatWrapping;
  sphereTexture.repeat.set(1, 1);
  const sphereMaterial = new THREE.MeshPhongMaterial({ map: sphereTexture, transparent: true, opacity: 0.5 });
  sphere = new THREE.Mesh(new THREE.SphereGeometry(5, 32, 32), sphereMaterial);
  sphere.position.set(9, 0, 15);
  sphere.receiveShadow = true;
  scene.add(sphere);
}

function animate() {
  requestAnimationFrame(animate);
  render();
  stats.update();
  orbitControls.update();
}

function render() {
  const delta = clock.getDelta();
  const defaultRotationSpeed = 0.25;
  const step = defaultRotationSpeed * delta * controls.speed;

  // Update cubemap
  mirrorCuboidCamera.position.copy(mirrorCuboid.position);
  mirrorCuboidCamera.updateCubeMap(webGLRenderer, scene);

  // Animation of the objects
  polyhedron.rotation.set(polyhedron.rotation.x + step, polyhedron.rotation.y + step, polyhedron.rotation.z);
  cube.rotation.set(cube.rotation.x + step, cube.rotation.y, cube.rotation.z + step);
  mirrorCuboid.rotation.set(mirrorCuboid.rotation.x, mirrorCuboid.rotation.y + step, mirrorCuboid.rotation.z);
  sphere.rotation.set(sphere.rotation.x, sphere.rotation.y + step, sphere.rotation.z);

  // Render scene
  webGLRenderer.render(scene, camera);
}

function initStats() {
  const stats = new Stats();
  stats.setMode(0); // 0: fps, 1: ms

  // Align top-left
  stats.domElement.style.position = "absolute";
  stats.domElement.style.left = "0px";
  stats.domElement.style.top = "0px";

  document.getElementById("Stats-output").appendChild(stats.domElement);

  return stats;
}

function initGUI() {
  const gui = new dat.GUI();
  gui.add(controls, "speed", 0, 10).step(0.1);

  return gui;
}
