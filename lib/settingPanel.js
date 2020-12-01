(function () {
  'use strict';

  /**
   * Instance of Setting Panel
   * @param {String} containerSelector jquery selector
   * @param {Object} handlers collection of event handlers
   */
  var SettingPanel = function (containerSelector, handlers) {
    this.containerSelector = containerSelector;
    this.eventHandlers = handlers || {}

    this.init = () => {
      $(this.containerSelector).append(`
      <div id="setting-panel-container">
        <div class="content">
          <div class="hide-show-handle"></div>
        </div>
      </div>
      `);

      $('#setting-panel-container .content .hide-show-handle').click(function () {
        $('#setting-panel-container').toggleClass('closed');
      });

      this.configPanoramaAdjustPanel();
      this.configRoomGizmoPanel();
    }

    this.configPanoramaAdjustPanel = () => {
      const _self = this;
      $(`${this.containerSelector} #setting-panel-container .content`).append(`
      <div class="">
        <h4 class="title">Rotate panorama to adjust</h4>
        <div><input id="slide-panorama-rotation" type="range" min="0" max="360" style="width: 100%"/></div>
        <h4 class="title">Replace panorama</h4>
        <input id="file-panorama-replace" type="file" accept="image/*"/>
      </div>
      `)

      $('#slide-panorama-rotation').change(function () {
        let value = parseInt($(this).val());
        typeof _self.eventHandlers.onPanoramaRotationChanged === 'function' && _self.eventHandlers.onPanoramaRotationChanged(value);
      })

      $('#file-panorama-replace').change(function (event) {
        if (event.originalEvent && event.originalEvent.target && event.originalEvent.target.files && event.originalEvent.target.files.length) {
          let file = event.originalEvent.target.files[0];
          typeof _self.eventHandlers.onPanoramaImageChanged === 'function' && _self.eventHandlers.onPanoramaImageChanged(file);
        }
      })
    }

    this.configRoomGizmoPanel = () => {
      const _self = this;
      $(`${this.containerSelector} #setting-panel-container .content`).append(`
      <div class="">
        <hr>
        <h4 class="title">Vertex count of plan</h4>
        <div><input id="input-vertex-count" type="number" value="4" min="3" max="10" style="width: 100%"/></div>
      </div>
      `)

      $('#input-vertex-count').change(function () {
        let count = parseInt($(this).val());
        typeof _self.eventHandlers.onRoomGizmoVertexCountChanged === 'function' && this.eventHandlers.onRoomGizmoVertexCountChanged(count);
      })
    }

    this.addEventListener = (name, func) => this.eventHandlers[name] = func;

    this.init();
  }

  window.SettingPanel = SettingPanel;
})()