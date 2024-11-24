/** @type {import('three')} */
var THREE = THREE;

var clock = new THREE.Clock();

// once everything is loaded, we run our Three.js stuff.

var stats = initStats();

// create a scene, that will hold all our elements such as objects, cameras and lights.
var scene = new THREE.Scene();

// create a camera, which defines where we're looking at.
var camera = new THREE.PerspectiveCamera(
  90,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// create a render and set the size
var webGLRenderer = new THREE.WebGLRenderer();
webGLRenderer.setClearColor(new THREE.Color(0xffffff));
//webGLRenderer.setClearColor(new THREE.Color(0xffffff, 1.0)); //works wrong in r87
webGLRenderer.setSize(window.innerWidth, window.innerHeight);
webGLRenderer.shadowMapEnabled = true;

var polyhedron = createMesh(
  new THREE.IcosahedronGeometry(5, 0),
  "metal-rust.jpg"
);
polyhedron.position.x = 12;
scene.add(polyhedron);

var sphere = createMesh(new THREE.SphereGeometry(5, 20, 20), "floor-wood.jpg");
scene.add(sphere);

var cube = createMesh(new THREE.CubeGeometry(5, 5, 5), "brick-wall.jpg");
cube.position.x = -12;
scene.add(cube);
console.log(cube.geometry.faceVertexUvs);

// position and point the camera to the center of the scene
camera.position.x = 0;
camera.position.y = 12;
camera.position.z = 28;
camera.lookAt(new THREE.Vector3(0, 0, 0));

var ambiLight = new THREE.AmbientLight(0x141414);
scene.add(ambiLight);

var light = new THREE.DirectionalLight();
light.position.set(0, 30, 20);
scene.add(light);

// add the output of the renderer to the html element
document.getElementById("WebGL-output").appendChild(webGLRenderer.domElement);

// call the render function
var step = 0;

// setup the control gui
var controls = new (function () {
  this.speed = 1;
})();

var gui = new dat.GUI();
gui.add(controls, "speed", 0, 10).step(0.1);

render();

function createMesh(geom, imageFile) {
  var texture = new THREE.TextureLoader().load("textures/" + imageFile);
  //var texture = THREE.ImageUtils.loadTexture("textures/" + imageFile)
  //texture.wrapS = THREE.RepeatWrapping;
  //texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  var mat = new THREE.MeshPhongMaterial();
  mat.map = texture;

  var mesh = new THREE.Mesh(geom, mat);
  return mesh;
}

var step = 0;
function render() {
  stats.update();

  var delta = clock.getDelta();
  var rotationSpeed = 1;

  step += rotationSpeed * delta * controls.speed;

  polyhedron.rotation.y = step;
  polyhedron.rotation.x = step;
  cube.rotation.y = step;
  cube.rotation.x = step;
  sphere.rotation.y = step;
  sphere.rotation.x = step;

  requestAnimationFrame(render);
  webGLRenderer.render(scene, camera);
}

function initStats() {
  var stats = new Stats();
  stats.setMode(0); // 0: fps, 1: ms

  // Align top-left
  stats.domElement.style.position = "absolute";
  stats.domElement.style.left = "0px";
  stats.domElement.style.top = "0px";

  document.getElementById("Stats-output").appendChild(stats.domElement);

  return stats;
}
