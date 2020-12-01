(function () {
  'use strict';
  const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const b64toBlob = dataURI => {
    var byteString = atob(dataURI.split(',')[1]);
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);

    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], {
      type: 'image/png'
    });
  }

  function saveToLocal(name, value) {
    window.localStorage.setItem(name, value);
  }

  function loadFromLocal(name) {
    return window.localStorage.getItem(name);
  }

  (async () => {
    let b64Panorama = loadFromLocal('panorama-image');
    if (b64Panorama) {
      let blob = b64toBlob(b64Panorama);
      let file = new File([blob], 'panorama.jpg');
      createScene(file, false)
    }
  })()

  /**
   * entry point with panorama image
   * @param {Object} file panorama image file
   * @param {Boolean} bSave flag to determine either to save or not
   */
  function createScene(file, bSave) {
    bSave && (async () => {
      let b64Panorama = await toBase64(file);
      saveToLocal('panorama-image', b64Panorama);
    })();

    $('#upload-container').hide();
    $('#canvas-container').show();
    var scene = new SceneManager('canvas-container');
    scene.updatePanorama(file);
    scene.initializeRoomGizmo(4);

    createSettingPanel();

    window.scene = scene;
  }

  function createSettingPanel() {
    var settingPanel = new SettingPanel('#canvas-container');

    settingPanel.addEventListener('onPanoramaRotationChanged', (value) => {
      window.scene.adjustPanoramaRotation(value);
    })
    settingPanel.addEventListener('onPanoramaImageChanged', (file) => {
      (async () => {
        let b64Panorama = await toBase64(file);
        saveToLocal('panorama-image', b64Panorama);
      })();
      window.scene.updatePanorama(file);
    })
    window.settingPanel = settingPanel;
  }

  var dragDropInput = $('#drag-drop-input');

  $('#input-image-file').on('change', function (event) {
    if (event.target && event.target.files && event.target.files.length) {
      let file = event.target.files[0];
      processFile(file, true);
    }
  })

  dragDropInput.on('click', function () {
    document.getElementById('input-image-file').click();
  })

  dragDropInput.on('dragover', function (event) {
    event.preventDefault();
    event.stopPropagation();
    event.target.classList.add('dragging');
  })

  dragDropInput.on('dragleave', function (event) {
    event.preventDefault();
    event.stopPropagation();
    event.target.classList.remove('dragging');
  })

  dragDropInput.on('drop', function (event) {
    event.preventDefault();
    event.stopPropagation();
    event.originalEvent.target.classList.remove('dragging');
    if (event.originalEvent.dataTransfer) {
      if (event.originalEvent.dataTransfer.files.length) {
        let file = event.originalEvent.dataTransfer.files[0];
        processFile(file, true);
      }
    }
  })
})();