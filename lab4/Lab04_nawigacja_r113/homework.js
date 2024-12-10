/** @type {import('three')} */
THREE = THREE;

var camera, scene, renderer;
var geometry, material, mesh;
var controls,
  time = Date.now();

var objects = [];

var ray;

var instructions = document.getElementById("instructions");

// http://www.html5rocks.com/en/tutorials/pointerlock/intro/

var havePointerLock =
  "pointerLockElement" in document || "mozPointerLockElement" in document || "webkitPointerLockElement" in document;

if (havePointerLock) {
  var element = document.body;

  var pointerlockchange = function (event) {
    if (
      document.pointerLockElement === element ||
      document.mozPointerLockElement === element ||
      document.webkitPointerLockElement === element
    ) {
      controls.enabled = true;
    } else {
      controls.enabled = false;

      instructions.style.display = "";
    }
  };

  var pointerlockerror = function (event) {
    instructions.style.display = "";
  };

  // Hook pointer lock state change events
  document.addEventListener("pointerlockchange", pointerlockchange, false);
  document.addEventListener("mozpointerlockchange", pointerlockchange, false);
  document.addEventListener("webkitpointerlockchange", pointerlockchange, false);

  document.addEventListener("pointerlockerror", pointerlockerror, false);
  document.addEventListener("mozpointerlockerror", pointerlockerror, false);
  document.addEventListener("webkitpointerlockerror", pointerlockerror, false);

  instructions.addEventListener(
    "click",
    function (event) {
      instructions.style.display = "none";

      // Ask the browser to lock the pointer
      element.requestPointerLock =
        element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

      if (/Firefox/i.test(navigator.userAgent)) {
        var fullscreenchange = function (event) {
          if (
            document.fullscreenElement === element ||
            document.mozFullscreenElement === element ||
            document.mozFullScreenElement === element
          ) {
            document.removeEventListener("fullscreenchange", fullscreenchange);
            document.removeEventListener("mozfullscreenchange", fullscreenchange);

            element.requestPointerLock();
          }
        };

        document.addEventListener("fullscreenchange", fullscreenchange, false);
        document.addEventListener("mozfullscreenchange", fullscreenchange, false);

        element.requestFullscreen =
          element.requestFullscreen ||
          element.mozRequestFullscreen ||
          element.mozRequestFullScreen ||
          element.webkitRequestFullscreen;

        element.requestFullscreen();
      } else {
        element.requestPointerLock();
      }
    },
    false
  );
} else {
  instructions.innerHTML = "Your browser doesn't seem to support Pointer Lock API";
}

init();
animate();

function init() {
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 6000);

  scene = new THREE.Scene();
  // scene.fog = new THREE.Fog(0xffffff, 0, 750);

  var light = new THREE.DirectionalLight(0xffffff, 1.5);
  light.position.set(1, 1, 1);
  scene.add(light);

  var light = new THREE.DirectionalLight(0xffffff, 0.75);
  light.position.set(-1, -0.5, -1);
  scene.add(light);

  controls = new THREE.PointerLockControls(camera);
  scene.add(controls.getObject());

  ray = new THREE.Raycaster();
  ray.ray.direction.set(0, -1, 0);

  // Load skybox textures
  const loader = new THREE.TextureLoader();
  const skyboxTextures = [
    loader.load("textures/Deslf.bmp"), // left
    loader.load("textures/Desrt.bmp"), // right
    loader.load("textures/Desup.bmp"), // top
    loader.load("textures/Desdn.bmp"), // bottom
    loader.load("textures/Desft.bmp"), // front
    loader.load("textures/Desbk.bmp"), // back
  ];

  // Create skybox material
  const skyboxMaterial = skyboxTextures.map(
    (texture) =>
      new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide, // Render on inside of cube
      })
  );

  // Create skybox mesh
  const skyboxGeometry = new THREE.BoxGeometry(4000, 4000, 4000);
  const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
  skybox.position.y = 200; // Move skybox up by 2000 units
  scene.add(skybox);

  // floor
  geometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
  geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

  for (var i = 0, l = geometry.vertices.length; i < l; i++) {
    var vertex = geometry.vertices[i];
    vertex.x += Math.random() * 20 - 10;
    vertex.y += Math.random() * 2;
    vertex.z += Math.random() * 20 - 10;
  }

  for (var i = 0, l = geometry.faces.length; i < l; i++) {
    var face = geometry.faces[i];
    face.vertexColors[0] = new THREE.Color().setHSL(
      0.08 + Math.random() * 0.04,
      0.3 + Math.random() * 0.1,
      0.5 + Math.random() * 0.2
    );
    face.vertexColors[1] = new THREE.Color().setHSL(
      0.08 + Math.random() * 0.04,
      0.3 + Math.random() * 0.1,
      0.5 + Math.random() * 0.2
    );
    face.vertexColors[2] = new THREE.Color().setHSL(
      0.08 + Math.random() * 0.04,
      0.3 + Math.random() * 0.1,
      0.5 + Math.random() * 0.2
    );
  }

  material = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors });

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // objects
  geometry = new THREE.BoxGeometry(20, 20, 20);

  // Load cube texture
  const textureLoader = new THREE.TextureLoader();
  const cubeTexture = textureLoader.load("textures/crate.png");

  for (var i = 0; i < 500; i++) {
    material = new THREE.MeshLambertMaterial({
      map: cubeTexture,
      flatShading: true,
    });

    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = Math.floor(Math.random() * 20 - 10) * 20;
    mesh.position.y = Math.floor(Math.random() * 20) * 20 + 10;
    mesh.position.z = Math.floor(Math.random() * 20 - 10) * 20;
    scene.add(mesh);

    objects.push(mesh);
  }

  // Calculate visible dimensions at a given distance from camera
  const distanceFromCamera = -1;
  const vFOV = (camera.fov * Math.PI) / 180;
  const height = 2 * Math.tan(vFOV / 2) * Math.abs(distanceFromCamera);
  const width = height * camera.aspect;

  // Create plane with calculated dimensions
  var maskGeometry = new THREE.PlaneGeometry(width, height / 1.5);
  var maskTexture = new THREE.TextureLoader().load("textures/viewmodel_upscaled.png");
  var maskMaterial = new THREE.MeshBasicMaterial({
    map: maskTexture,
    transparent: true,
  });
  var mask = new THREE.Mesh(maskGeometry, maskMaterial);

  // Position at bottom of screen
  // Move down by half the visible height minus half the mask height
  const yOffset = -(height / 2 - height / 3); // Adjust divisor to fine-tune position
  mask.position.set(0, yOffset, distanceFromCamera);
  camera.add(mask);

  // Update mask position on window resize
  window.addEventListener("resize", () => {
    const newHeight = 2 * Math.tan(vFOV / 2) * Math.abs(distanceFromCamera);
    const newWidth = newHeight * camera.aspect;

    maskGeometry.dispose();
    mask.geometry = new THREE.PlaneGeometry(newWidth, newHeight / 1.5);

    const newYOffset = -(newHeight / 2 - newHeight / 3);
    mask.position.y = newYOffset;
  });

  //

  renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(0xffffff);
  renderer.setSize(window.innerWidth, window.innerHeight);

  document.body.appendChild(renderer.domElement);

  //

  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  //

  controls.isOnObject(false);

  ray.ray.origin.copy(controls.getObject().position);
  ray.ray.origin.y -= 10;

  var intersections = ray.intersectObjects(objects);

  if (intersections.length > 0) {
    var distance = intersections[0].distance;

    if (distance > 0 && distance < 10) {
      controls.isOnObject(true);
    }
  }

  controls.update(Date.now() - time);

  renderer.render(scene, camera);

  time = Date.now();
}
