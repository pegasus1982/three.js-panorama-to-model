(function () {
  'use strict';

  var SettingPanel = function (containerSelector) {
    this.containerSelector = containerSelector;

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
    }

    this.init();
  }

  window.SettingPanel = SettingPanel;
})()