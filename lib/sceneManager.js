(function () {
  'use strict';

  /**
   * Scene Manager for paronama and object viewer
   * @param {Object} container HTML element which will contain canvas
   */
  var SceneManager = function (container) {
    // check if container is valid dom element
    if (!(container instanceof HTMLElement)) {
      console.error("please set valid container");
      return;
    }

    this.container = container;

    this.init = () => {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0xd6d6d6);
      var WIDTH = this.container.clientWidth;
      var HEIGHT = this.container.clientHeight;
      this.camera = new THREE.PerspectiveCamera(70, WIDTH / HEIGHT, 0.01, 50);
      this.camera.position.set(1, 0.5, -2);
      this.camera.lookAt(this.scene.position);
      this.scene.add(this.camera);

      var ambientLight = new THREE.AmbientLight(0x555555);
      this.scene.add(ambientLight);

      var light = new THREE.PointLight(0xffffff);
      light.position.set(0, 30, 0);
      this.scene.add(light);

      light = new THREE.PointLight(0xffffff);
      light.position.set(5, -20, 10);
      this.scene.add(light);

      this.renderer = new THREE.WebGLRenderer({
        antialias: true
      });

      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00
      });
      const cube = new THREE.Mesh(geometry, material);
      this.scene.add(cube);


      this.renderer.setSize(WIDTH, HEIGHT);
      this.container.appendChild(this.renderer.domElement);

      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.minDistance = 1;
      this.controls.maxDistance = 2;
    }

    this.animate = () => {
      requestAnimationFrame(this.animate);
      this.renderer.render(this.scene, this.camera);
    }

    this.init();
    this.animate();
  }

  window.SceneManager = SceneManager;
})();