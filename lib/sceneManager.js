(function () {
  'use strict';

  /**
   * Scene Manager for paronama and object viewer
   * @param {Object} containerSelector HTML element which will contain canvas
   */
  var SceneManager = function (containerSelector) {
    let container = document.getElementById(containerSelector);
    // check if container is valid dom element
    if (!(container instanceof HTMLElement)) {
      console.error("please set valid container");
      return;
    }

    this.container = container;

    this.onPointerDownMouseX = 0;
    this.onPointerDownMouseY = 0;
    this.lon = 0;
    this.onPointerDownLon = 0;
    this.lat = 0;
    this.onPointerDownLat = 0;

    /**
     * update panorama
     * @param {Object} file panorama image file
     */
    this.updatePanorama = (file) => {
      const texture = new THREE.TextureLoader().load(URL.createObjectURL(file));
      this.panoramaSphere.material = new THREE.MeshBasicMaterial({
        map: texture
      });
    }

    /**
     * initialize scene
     */
    this.init = () => {
      let width = container.clientWidth;
      let height = container.clientHeight;
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(75, width / height, 1, 1100);

      const geometry = new THREE.SphereBufferGeometry(500, 60, 40);
      geometry.scale(-1, 1, 1);

      const material = new THREE.MeshBasicMaterial({
        color: 'green'
      });

      this.panoramaSphere = new THREE.Mesh(geometry, material);

      this.scene.add(this.panoramaSphere);

      this.renderer = new THREE.WebGLRenderer();
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setSize(width, height);
      this.container.appendChild(this.renderer.domElement);

      window.addEventListener('resize', this.onWindowResize, false);

      container.addEventListener('pointerdown', this.onPointerDown, false);
      container.addEventListener('wheel', this.onMouseWheel, false);
    }

    /**
     * event handler for window resize event
     */
    this.onWindowResize = () => {
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(container.clientWidth, container.clientHeight);
    }

    this.animate = () => {
      requestAnimationFrame(this.animate);
      this.renderer.render(this.scene, this.camera);
      this.updateCamera();
    }

    /**
     * event handler for mouse/pointer down event
     * @param {Object} event 
     */
    this.onPointerDown = (event) => {
      if (event.isPrimary === false) return;

      this.onPointerDownMouseX = event.clientX;
      this.onPointerDownMouseY = event.clientY;

      this.onPointerDownLon = this.lon;
      this.onPointerDownLat = this.lat;

      container.addEventListener('pointermove', this.onPointerMove, false);
      container.addEventListener('pointerup', this.onPointerUp, false);
    }

    /**
     * event handler for mouse/pointer move event
     * @param {Object} event 
     */
    this.onPointerMove = (event) => {
      if (event.isPrimary === false) return;

      this.lon = (this.onPointerDownMouseX - event.clientX) * 0.1 + this.onPointerDownLon;
      this.lat = (event.clientY - this.onPointerDownMouseY) * 0.1 + this.onPointerDownLat;

    }

    /**
     * event handler for mouse/pointer up event
     * @param {Object} event 
     */
    this.onPointerUp = (event) => {
      if (event.isPrimary === false) return;

      container.removeEventListener('pointermove', this.onPointerMove, false);
      container.removeEventListener('pointerup', this.onPointerUp, false);
    }

    /**
     * event handler for mouse wheel event
     * @param {Object} event 
     */
    this.onMouseWheel = (event) => {
      const fov = this.camera.fov + event.deltaY * 0.05;

      this.camera.fov = THREE.MathUtils.clamp(fov, 10, 75);
      this.camera.updateProjectionMatrix();
    }

    /**
     * update camera according to the lat/long
     */
    this.updateCamera = () => {
      this.lat = Math.max(-85, Math.min(85, this.lat));
      var phi = THREE.MathUtils.degToRad(90 - this.lat);
      var theta = THREE.MathUtils.degToRad(this.lon);

      const x = 500 * Math.sin(phi) * Math.cos(theta);
      const y = 500 * Math.cos(phi);
      const z = 500 * Math.sin(phi) * Math.sin(theta);

      this.camera.lookAt(x, y, z);

      this.renderer.render(this.scene, this.camera);
    }

    this.init();
    this.animate();
  }

  window.SceneManager = SceneManager;
})();