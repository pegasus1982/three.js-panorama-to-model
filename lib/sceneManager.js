(function () {
  'use strict';

  const getIndexFromName = name => parseInt(name.replace('vertice-helper-', ''));
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

    this.activeCamType = 'pano';

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
      } catch (_) { }
    }

    this.updateCameraType = type => {
      this.activeCamType = type;
      if (type === 'obj') {
        this.roomGizmo.material.wireframe = false;
        this.transformControl.detach(this.transformControl.object);
      } else {
        this.roomGizmo.material.wireframe = true;
      }
    }

    /**
     * update room gizmo with edge count
     * @param {Number} edgeCount 
     */
    this.updateRoomGizmo = (edgeCount) => {
      // if (edgeCount !== 4) return;
      if (this.roomGizmo instanceof THREE.Mesh) {
        this.scene.remove(this.roomGizmo);
      }

      this.verticeHelpers.forEach(mesh => this.scene.remove(mesh));
      this.verticeHelpers = [];
      let geometry = new THREE.CylinderGeometry(100, 100, 100, edgeCount, 1, true);
      geometry.dynamic = true;
      geometry.verticesNeedUpdate = true;

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
      console.log(this.roomGizmo)
      for (var i = 0; i < this.roomGizmo.geometry.attributes.position.count; i++) {
        let pos = {
          x: this.roomGizmo.geometry.attributes.position.array[i * 3],
          y: this.roomGizmo.geometry.attributes.position.array[i * 3 + 1],
          z: this.roomGizmo.geometry.attributes.position.array[i * 3 + 2],
        }
        let geometry = new THREE.SphereGeometry(3, 16, 16);
        let material = new THREE.MeshBasicMaterial({
          color: 0xff0000
        });
        let mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(pos.x, pos.y, pos.z);
        mesh.name = `vertice-helper-${i}`
        this.scene.add(mesh);
        this.verticeHelpers.push(mesh);
      }
    }

    this.synchronizeGizmoVertex = (index, pos) => {
      if (index < this.verticeHelpers.length / 2) {
        for (var i = 0; i < this.verticeHelpers.length / 2; i++) {
          this.verticeHelpers[i].position.y = pos.y;
        }
      } else {
        let i = index - this.verticeHelpers.length / 2;
        this.verticeHelpers[i].position.x = pos.x;
        this.verticeHelpers[i].position.z = pos.z;
      }

      for (var i = 0; i < this.verticeHelpers.length; i++) {
        let position = this.verticeHelpers[i].position;
        try {
          this.roomGizmo.geometry.vertices[i].x = position.x;
          this.roomGizmo.geometry.vertices[i].y = position.y;
          this.roomGizmo.geometry.vertices[i].z = position.z;
        } catch (_) { }
      }
      this.roomGizmo.geometry.verticesNeedUpdate = true;
    }

    /**
     * initialize scene
     */
    this.init = () => {
      let width = container.clientWidth;
      let height = container.clientHeight;
      this.scene = new THREE.Scene();

      this.panoCam = new THREE.PerspectiveCamera(75, width / height, 1, 1100);

      this.objCam = new THREE.PerspectiveCamera(75, width / height, 1, 1100);
      this.objCam.lookAt(this.scene.position);
      this.objCam.position.set(200, 200, 200);

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

      this.transformControl = new THREE.TransformControls(this.panoCam, this.renderer.domElement);
      this.scene.add(this.transformControl);
      this.transformControl.addEventListener('change', (event) => {
        if (event && event.target && event.target.object instanceof THREE.Mesh) {
          let index = getIndexFromName(event.target.object.name);
          let pos = event.target.object.position;
          this.synchronizeGizmoVertex(index, pos);
        }
      });

      this.controls = new THREE.OrbitControls(this.objCam, this.renderer.domElement);
      this.controls.minDistance = 100;
      this.controls.maxDistance = 300;

      this.transformControl.addEventListener('dragging-changed', (event) => {
        this.lookAroundEnabled = !event.value;

        if (!event.value) {
          console.log('update')

        }
      });

      window.addEventListener('resize', this.onWindowResize, false);

      this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown, false);
      this.renderer.domElement.addEventListener('wheel', this.onMouseWheel, false);

      this.rayCaster = new THREE.Raycaster();
    }

    /**
     * event handler for window resize event
     */
    this.onWindowResize = () => {
      this.panoCam.aspect = container.clientWidth / container.clientHeight;
      this.panoCam.updateProjectionMatrix();

      this.renderer.setSize(container.clientWidth, container.clientHeight);
    }

    /**
     * animate callback
     */
    this.animate = () => {
      requestAnimationFrame(this.animate);
      if (this.activeCamType === 'pano') this.renderer.render(this.scene, this.panoCam);
      else this.renderer.render(this.scene, this.objCam);
      this.updateCamera();
    }

    /**
     * event handler for mouse/pointer down event
     * @param {Object} event 
     */
    this.onPointerDown = (event) => {
      // check raycaster for vertice helpers
      var mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      this.rayCaster.setFromCamera(mouse, this.panoCam);
      var intersects = this.rayCaster.intersectObjects(this.verticeHelpers);
      if (intersects.length) {
        let object = intersects[0].object;
        this.transformControl.attach(object);

        let index = getIndexFromName(object.name);
        this.transformControl.showX = this.transformControl.showY = this.transformControl.showZ = true;
        if (index < this.verticeHelpers.length / 2) {
          this.transformControl.showX = this.transformControl.showZ = false;
        } else {
          this.transformControl.showY = false;
        }
      } else {
        if (!this.lookAroundEnabled) return;
        if (event.isPrimary === false) return;

        this.onPointerDownMouseX = event.clientX;
        this.onPointerDownMouseY = event.clientY;

        this.onPointerDownLon = this.lon;
        this.onPointerDownLat = this.lat;

        this.renderer.domElement.addEventListener('pointermove', this.onPointerMove, false);
        this.renderer.domElement.addEventListener('pointerup', this.onPointerUp, false);
      }

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
      const fov = this.panoCam.fov + event.deltaY * 0.05;

      this.panoCam.fov = THREE.MathUtils.clamp(fov, 10, 75);
      this.panoCam.updateProjectionMatrix();
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

      this.panoCam.lookAt(x, y, z);
    }

    this.init();
    this.animate();
  }

  window.SceneManager = SceneManager;
})();