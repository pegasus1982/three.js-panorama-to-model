var camera, controls, renderer, composer;
var updateDistortionEffect;

var onPointerDownMouseX = 0;
var onPointerDownMouseY = 0;
var lon = 0;
var onPointerDownLon = 0;
var lat = 0;
var onPointerDownLat = 0;

init();
animate();

function configSphere(radius, latSeg, longSeg, color) {
  let group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({ color });

  // latitudes
  (() => {
    const points = [];
    for (var i = 0; i <= longSeg; i++) {
      var theta = (i / longSeg) * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          Math.cos(theta) * radius,
          Math.sin(theta) * radius,
          0
        )
      );
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);

    for (var i = 0; i < longSeg; i++) {
      let tmp = line.clone();
      tmp.rotation.y = Math.PI / longSeg * i;
      group.add(tmp);
    }
  })();

  // longitudes
  (() => {
    const points = [];
    for (var i = 0; i <= latSeg; i++) {
      var theta = (i / latSeg) * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          Math.cos(theta) * radius,
          0,
          Math.sin(theta) * radius
        )
      );
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    for (var i = 0; i < latSeg; i++) {
      angle = Math.PI / latSeg * i - Math.PI / 2;
      let tmp = line.clone();
      tmp.position.y = Math.sin(angle) * radius;
      tmp.scale.set(Math.cos(angle), Math.cos(angle), Math.cos(angle));
      group.add(tmp);
    }
  })();

  return group;
}

function buildScene() {
  scene = new THREE.Scene();

  object = new THREE.Object3D();
  scene.add(object);

  // add floor tiles
  for (var x = -6; x <= 6; x += 3) {
    for (var z = -6; z <= 6; z += 3) {
      var mesh = generateCubeMesh(Math.min(1, Math.max(0, (200 - x * x - z * z) / 100 * (x * x + z * z + 15) /
        120)));
      mesh.position.set(160 * x, -400, 160 * z);
      mesh.scale.set(3, 0.08, 3);
      object.add(mesh);
    }
  }

  let sphere = configSphere(3000, 32, 32, 0x00ff00);
  scene.add(sphere);
  sphere.rotation.x = Math.PI / 3;

  // add some lights				
  light = new THREE.DirectionalLight(0xFFEEBB);
  light.position.set(0, 0.5, 1);
  scene.add(light);

  light = new THREE.DirectionalLight(0x223333);
  light.position.set(1, -.15, -0.22);
  scene.add(light);

  light = new THREE.DirectionalLight(0x223333);
  light.position.set(-1, -.15, -0.22);
  scene.add(light);

  return scene;
}

function init() {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  window.addEventListener('resize', onWindowResize, false);

  camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 1, 1000000);

  scene = buildScene();

  composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.SSAARenderPass(scene, camera));
  composer.setSize(window.innerWidth, window.innerHeight);

  var effect = new THREE.ShaderPass(getDistortionShaderDefinition());
  composer.addPass(effect);
  effect.renderToScreen = true;

  setupDistortionEffectAndGUI(effect);

  renderer.domElement.addEventListener('pointerdown', onPointerDown, false);
}

function animate() {
  requestAnimationFrame(animate);
  updateCamera();
  composer.render();
}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  updateDistortionEffect();

  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

function setupDistortionEffectAndGUI(effect) {
  var guiParameters = {
    horizontalFOV: 140,
    strength: 1,
    cylindricalRatio: 2,
  };

  updateDistortionEffect = function () {
    var height = Math.tan(THREE.Math.degToRad(guiParameters.horizontalFOV) / 2) / camera.aspect;

    camera.fov = Math.atan(height) * 2 * 180 / 3.1415926535;
    camera.updateProjectionMatrix();

    effect.uniforms["strength"].value = guiParameters.strength;
    effect.uniforms["height"].value = height;
    effect.uniforms["aspectRatio"].value = camera.aspect;
    effect.uniforms["cylindricalRatio"].value = guiParameters.cylindricalRatio;
  };

  updateDistortionEffect();

  var gui = new dat.GUI({
    width: 320
  });
  gui.add(guiParameters, "horizontalFOV", 5, 179, 1).onChange(updateDistortionEffect);
  gui.add(guiParameters, "strength", 0, 1.0, 0.025).onChange(updateDistortionEffect);
  gui.add(guiParameters, "cylindricalRatio", 0, 4.0, 0.025).onChange(updateDistortionEffect);
}

function generateCubeMesh(intensity) {
  var randomColor = Math.round(intensity * (128 + 127 * Math.random())) * 0x010000 +
    Math.round(intensity * (128 + 127 * Math.random())) * 0x000100 +
    Math.round(intensity * (128 + 127 * Math.random())) * 0x000001;

  var material = new THREE.MeshLambertMaterial({
    color: randomColor,
    shading: THREE.FlatShading,
  });

  var geometry = new THREE.BoxGeometry(140, 140, 140);

  return new THREE.Mesh(geometry, material);
}

function getDistortionShaderDefinition() {
  return {
    uniforms: {
      "tDiffuse": {
        type: "t",
        value: null
      },
      "strength": {
        type: "f",
        value: 0
      },
      "height": {
        type: "f",
        value: 1
      },
      "aspectRatio": {
        type: "f",
        value: 1
      },
      "cylindricalRatio": {
        type: "f",
        value: 1
      }
    },

    vertexShader: [
      "uniform float strength;", // s: 0 = perspective, 1 = stereographic
      "uniform float height;", // h: tan(verticalFOVInRadians / 2)
      "uniform float aspectRatio;", // a: screenWidth / screenHeight
      "uniform float cylindricalRatio;", // c: cylindrical distortion ratio. 1 = spherical

      "varying vec3 vUV;", // output to interpolate over screen
      "varying vec2 vUVDot;", // output to interpolate over screen

      "void main() {",
      "gl_Position = projectionMatrix * (modelViewMatrix * vec4(position, 1.0));",

      "float scaledHeight = strength * height;",
      "float cylAspectRatio = aspectRatio * cylindricalRatio;",
      "float aspectDiagSq = aspectRatio * aspectRatio + 1.0;",
      "float diagSq = scaledHeight * scaledHeight * aspectDiagSq;",
      "vec2 signedUV = (2.0 * uv + vec2(-1.0, -1.0));",

      "float z = 0.5 * sqrt(diagSq + 1.0) + 0.5;",
      "float ny = (z - 1.0) / (cylAspectRatio * cylAspectRatio + 1.0);",

      "vUVDot = sqrt(ny) * vec2(cylAspectRatio, 1.0) * signedUV;",
      "vUV = vec3(0.5, 0.5, 1.0) * z + vec3(-0.5, -0.5, 0.0);",
      "vUV.xy += uv;",
      "}"
    ].join("\n"),

    fragmentShader: [
      "uniform sampler2D tDiffuse;", // sampler of rendered scene�s render target
      "varying vec3 vUV;", // interpolated vertex output data
      "varying vec2 vUVDot;", // interpolated vertex output data

      "void main() {",
      "vec3 uv = dot(vUVDot, vUVDot) * vec3(-0.5, -0.5, -1.0) + vUV;",
      "gl_FragColor = texture2DProj(tDiffuse, uv);",
      "}"
    ].join("\n")

  };
}

function onPointerDown(event) {
  onPointerDownMouseX = event.clientX;
  onPointerDownMouseY = event.clientY;

  onPointerDownLon = lon;
  onPointerDownLat = lat;

  renderer.domElement.addEventListener('pointermove', onPointerMove, false);
  renderer.domElement.addEventListener('pointerup', onPointerUp, false);
}

function onPointerMove(event) {
  lon = (onPointerDownMouseX - event.clientX) * 0.1 + onPointerDownLon;
  lat = (event.clientY - onPointerDownMouseY) * 0.1 + onPointerDownLat;
}

function onPointerUp() {
  renderer.domElement.removeEventListener('pointermove', onPointerMove, false);
  renderer.domElement.removeEventListener('pointerup', onPointerUp, false);
}

function updateCamera() {
  lat = Math.max(-85, Math.min(85, lat));
  var phi = THREE.MathUtils.degToRad(90 - lat);
  var theta = THREE.MathUtils.degToRad(lon);

  const x = 500 * Math.sin(phi) * Math.cos(theta);
  const y = 500 * Math.cos(phi);
  const z = 500 * Math.sin(phi) * Math.sin(theta);

  camera.lookAt(x, y, z);
}