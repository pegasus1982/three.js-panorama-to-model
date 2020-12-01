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

    this.lookAroundEnabled = true;
    this.onPointerDownMouseX = 0;
    this.onPointerDownMouseY = 0;
    this.lon = 0;
    this.onPointerDownLon = 0;
    this.lat = 0;
    this.onPointerDownLat = 0;

    this.verticeHelpers = [];

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
     * adjust panorama rotation
     * @param {Number} angle rotation angle
     */
    this.adjustPanoramaRotation = angle => {
      let rad = Math.PI / 180 * angle;
      try {
        this.panoramaSphere.rotation.y = rad;
      } catch (_) {}
    }

    /**
     * update room gizmo with edge count
     * @param {Number} edgeCount 
     */
    this.updateRoomGizmo = (edgeCount) => {
      if (edgeCount !== 4) return;
      if (this.roomGizmo instanceof THREE.Mesh) {
        this.scene.remove(this.roomGizmo);
      }
      const geometry = new THREE.CylinderGeometry(100, 100, 100, edgeCount, 1, true);
      const material = new THREE.MeshPhongMaterial({
        color: 0x88ff00,
        emissive: 0x88ff00,
        side: THREE.DoubleSide,
        opacity: 0.5,
        transparent: true,
        wireframe: true,
      });
      geometry.rotateY(Math.PI / edgeCount);
      this.roomGizmo = new THREE.Mesh(geometry, material);
      this.scene.add(this.roomGizmo);

      // generate vertices helper
      for (var i = 0; i < this.roomGizmo.geometry.vertices.length; i++) {
        let pos = this.roomGizmo.geometry.vertices[i];
        let geometry = new THREE.SphereGeometry(3, 16, 16);
        let material = new THREE.MeshBasicMaterial({
          color: 0xff0000
        });
        let mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(pos.x, pos.y, pos.z);
        this.scene.add(mesh);
        this.verticeHelpers.push(mesh);
      }

      this.control.attach(this.verticeHelpers[7]);
    }

    /**
     * initialize scene
     */
    this.init = () => {
      let width = container.clientWidth;
      let height = container.clientHeight;
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(75, width / height, 1, 1100);
      // this.camera.position.set(200, 200, 200);

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

      this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown, false);
      this.renderer.domElement.addEventListener('wheel', this.onMouseWheel, false);

      this.control = new THREE.TransformControls(this.camera, this.renderer.domElement);
      this.scene.add(this.control);
      // this.control.addEventListener('change', render);

      this.control.addEventListener('dragging-changed', (event) => {
        this.lookAroundEnabled = !event.value;
      });
    }

    /**
     * event handler for window resize event
     */
    this.onWindowResize = () => {
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(container.clientWidth, container.clientHeight);
    }

    /**
     * animate callback
     */
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
      if (!this.lookAroundEnabled) return;
      if (event.isPrimary === false) return;

      this.onPointerDownMouseX = event.clientX;
      this.onPointerDownMouseY = event.clientY;

      this.onPointerDownLon = this.lon;
      this.onPointerDownLat = this.lat;

      this.renderer.domElement.addEventListener('pointermove', this.onPointerMove, false);
      this.renderer.domElement.addEventListener('pointerup', this.onPointerUp, false);
    }

    /**
     * event handler for mouse/pointer move event
     * @param {Object} event 
     */
    this.onPointerMove = (event) => {
      if (!this.lookAroundEnabled) return;
      if (event.isPrimary === false) return;

      this.lon = (this.onPointerDownMouseX - event.clientX) * 0.1 + this.onPointerDownLon;
      this.lat = (event.clientY - this.onPointerDownMouseY) * 0.1 + this.onPointerDownLat;

    }

    /**
     * event handler for mouse/pointer up event
     * @param {Object} event 
     */
    this.onPointerUp = (event) => {
      if (!this.lookAroundEnabled) return;
      if (event.isPrimary === false) return;

      this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove, false);
      this.renderer.domElement.removeEventListener('pointerup', this.onPointerUp, false);
    }

    /**
     * event handler for mouse wheel event
     * @param {Object} event 
     */
    this.onMouseWheel = (event) => {
      if (!this.lookAroundEnabled) return;
      const fov = this.camera.fov + event.deltaY * 0.05;

      this.camera.fov = THREE.MathUtils.clamp(fov, 10, 75);
      this.camera.updateProjectionMatrix();
    }

    /**
     * update camera according to the lat/long
     */
    this.updateCamera = () => {
      if (!this.lookAroundEnabled) return;
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