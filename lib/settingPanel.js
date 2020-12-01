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
    }

    this.configPanoramaAdjustPanel = () => {
      const _self = this;
      $(`${this.containerSelector} #setting-panel-container .content`).append(`
      <div class="">
        <h4 class="title">Rotate panorama to adjust</h4>
        <div><input id="slide-panorama-rotation" type="range" min="0" max="360" style="width: 100%"/></div>
      </div>
      `)

      $('#slide-panorama-rotation').change(function () {
        let value = parseInt($(this).val());
        typeof _self.eventHandlers.onPanoramaRotationChanged === 'function' && _self.eventHandlers.onPanoramaRotationChanged(value);
      })
    }

    this.addEventListener = (name, func) => this.eventHandlers[name] = func;

    this.init();
  }

  window.SettingPanel = SettingPanel;
})()