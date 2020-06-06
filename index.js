    var elements = {
      form: document.querySelector('form'),
      lang: document.querySelector('#lang'),
      output: document.querySelector('#output pre'),
      iconTable: document.querySelector('#icons tbody'),
      addIcon: document.querySelector('#add_icons'),
      screenshotsTable: document.querySelector('#screenshots tbody'),
      addScreenshot: document.querySelector('#add_screenshots'),
      relatedTable: document.querySelector('#related_applications tbody'),
      addRelated: document.querySelector('#add_related_applications'),
      copyManifest: document.querySelector('#copy_manifest'),
      outputManifest: document.querySelector('#output_manifest'),
      copyHead: document.querySelector('#copy_head'),
      outputHead: document.querySelector('#output_head'),
      footer: document.querySelector('footer small'),
      messages: document.querySelector('#messages'),
      colors: document.querySelectorAll('.form-control-color'),
      toggles: document.querySelectorAll('[data-toggle="collapse"]')
    };
    
    // when form inputs change, update the manifest output
    elements.form.addEventListener('change', updateOutput);
    
    // when colour inputs change, update their borders for a nice effect
    Array.prototype.slice.call(elements.colors).map(function(element) {
      element.addEventListener('change', setBorderColor);
    });
    
    function setBorderColor() {
      this.style['border-color'] = this.value;
    }
    
    // toggle to show more/less
    Array.prototype.slice.call(elements.toggles).map(function(element) {
      element.addEventListener('click', toggle);
    });
    
    function toggle() {
      document.querySelector(this.dataset.target).classList.toggle('in');
      var text = this.innerText === 'More...' ? 'Less...' : 'More...';
      this.innerText = text;
    }
    
    // add buttons for additional rows
    elements.addIcon.addEventListener('click', addIconRow);
    elements.addRelated.addEventListener('click', addRelatedRow);
    elements.addScreenshot.addEventListener('click', addScreenshotsRow);
    
    // copy buttons
    elements.copyManifest.addEventListener('click', copy.bind(this, elements.outputManifest));
    elements.copyHead.addEventListener('click', copy.bind(this, elements.outputHead));
    
    
    function createInput(label, id, name, placeholder) {
      return '<td>' +
                '<label class="sr-only" for="'+id+'">'+label+'</label>' +
                '<input type="text" class="form-control form-control-sm" '+
                        'id="'+id+'" name="'+name+'" placeholder="'+placeholder+'" />' +
              '</td>';
    }
    
    function appendTable(table, innerHTML) {
      var tr = document.createElement('tr');
      var index = table.children.length - 1;
      tr.innerHTML = innerHTML(index);
      table.insertBefore(tr, table.lastElementChild);
    }
    
    function addIconRow() {
      appendTable(elements.iconTable, function(index) {
        return [
          createInput('URL', 'icons_'+index+'_src', 'icons['+index+'][src]', 'homescreen.png'),
          createInput('Sizes', 'icons_'+index+'_sizes', 'icons['+index+'][sizes]', '192x192'),
          createInput('Type', 'icons_'+index+'_type', 'icons['+index+'][type]', 'image/png')
        ].join('\n');
      });
    }
    
    function addScreenshotsRow() {
      appendTable(elements.screenshotsTable, function(index) {
        return [
          createInput('URL', 'screenshots_'+index+'_src', 'screenshots['+index+'][src]', 'screenshots/in-app.png'),
          createInput('Sizes', 'screenshots_'+index+'_sizes', 'screenshots['+index+'][sizes]', '1280x920'),
          createInput('Type', 'screenshots_'+index+'_type', 'screenshots['+index+'][type]', 'image/png')
        ].join('\n');
      });
    }
    
    function addRelatedRow() {
      appendTable(elements.relatedTable, function(index) {
        return [
          createInput('Platform', 'related_'+index+'_platform', 'related_applications['+index+'][platform]', 'play'),
          createInput('ID', 'related_'+index+'_id', 'related_applications['+index+'][id]', 'com.example.app'),
          createInput('URL', 'related_'+index+'_url', 'related_applications['+index+'][url]', 'https://play.google.com/store/apps/details?id=com.example.app1')
        ].join('\n')
      });
    }
    
    function getFormData() {
      return Array.prototype.slice.call(elements.form.elements)
        .reduce(function(form, element) {
          var value = element.value;
          if (!value) { // skip empty values
            return form;
          }
    
          if (element.type === 'number') { // numbers shouldn't be strings
            value = parseFloat(value) || value;
          }
    
          if (element.type === 'radio' && !element.checked) { // skip unchecked radios
            return form;
          }
    
          if (element.type === 'checkbox') {
            value = element.checked;
            if (!value) { // skip unchecked values (default for related is false anyway)
              return form;
            }
          }
    
          var array = element.name.split('['); // icon/screenshots/related are object array: icon[0][src]
          if (array.length === 1) { // not icon/etc, simple assignment
            form[element.name] = value;
            return form;
          }
    
          // icon[0][src] -> prop[index][name]
          var prop = array[0];
          var index = array[1].slice(0, -1); // 0], side-effect of split
          var name = array[2].slice(0, -1);
    
          if (!form[prop])        form[prop] = [];
          if (!form[prop][index]) form[prop][index] = {};
    
          form[prop][index][name] = value;
          form[prop] = form[prop].filter(function(prop) { return prop !== null; });
          return form;
        }, {});
    }
    
    function getImageAttrs(image) {
      var attrs = [];
      if (image.type)    attrs.push('type="' + image.type + '"');
      if (image.sizes)   attrs.push('sizes="' + image.sizes + '"');
      if (image.src)     attrs.push('href="' + image.src + '"');
    
      return attrs.join(' ');
    }
    
    function generateHead(form) {
      var meta = [
        '<link rel="manifest" href="manifest.json">',
        '',
        '<meta name="mobile-web-app-capable" content="yes">',
        '<meta name="apple-mobile-web-app-capable" content="yes">'
      ];
    
      var name = form.short_name || form.name;
      if (name) {
        meta.push('<meta name="application-name" content="' + name + '">');
        meta.push('<meta name="apple-mobile-web-app-title" content="' + name + '">');
      }
    
      if (form.theme_color) {
        meta.push('<meta name="theme-color" content="' + form.theme_color + '">');
        meta.push('<meta name="msapplication-navbutton-color" content="' + form.theme_color + '">');
        meta.push('<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">');
      }
    
      if (form.start_url) {
        meta.push('<meta name="msapplication-starturl" content="'+form.start_url+'">');
      }
    
      meta.push('<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">');
    
      if (form.icons) {
        meta.push(''); // add spacer for aesthetics
    
        form.icons.forEach(function(icon) {
          var attrs = getImageAttrs(icon);
          meta.push('<link rel="icon" ' + attrs + '>');
          meta.push('<link rel="apple-touch-icon" ' + attrs + '>');
        });
      }
    
      return meta.join('\n');
    }
    
    function updateOutput() {
      var form = getFormData();
      var manifest = JSON.stringify(form, null, '  '); // pretty-printed, 2-spaces
      var head = generateHead(form);
    
      elements.outputManifest.innerText = manifest;
      elements.outputHead.innerText = head;
    }
    
    function copy(node) {
      var range = document.createRange();
      range.selectNodeContents(node);
      window.getSelection().removeAllRanges(); // ensure no current selection, otherwise copy may fail
      window.getSelection().addRange(range);
    
      try {
        document.execCommand('copy');
        showMessage('<i class="fa fa-clipboard"></i> Copied to clipboard');
      } catch (err) {
        showMessage('<i class="fa fa-warning"></i> Couldn\'t copy to your clipboard');
      } finally {
        window.getSelection().removeAllRanges();
      }
    }
    
    function showMessage(message) {
      var element = document.createElement('div');
      element.className = 'message active';
      element.innerHTML = message;
      elements.messages.appendChild(element);
      setTimeout(function() {
        element.classList.remove('active');
        setTimeout(function() { // wait for css animation before removing
          elements.messages.removeChild(element);
        }, 250);
      }, 2750); // 250ms for active animation + 2.5s to message display
    }
    
    function reset() {
      elements.form.reset();
    
      // personal touch
      elements.lang.value = navigator.language;
      elements.lang.placeholder = navigator.language;
    
      updateOutput();
    }
    
    var footers = [
      '',
      ' <i class="fa fa-rocket"></i>',
      ' to make the web great again',
      ' who wants more web apps on his homescreen',
      ' who is tired of seeing browser UI',
      ' because it\'s ' + new Date().getFullYear()
    ];
    var rand = Math.floor(Math.random() * footers.length);
    elements.footer.innerHTML += footers[rand];
    
    reset();
    
    var shouldRegister = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    if ('serviceWorker' in navigator && shouldRegister) {
      navigator.serviceWorker.register('sw.js').then(function(registration) {
        // only show message on worker installed event
        registration.onupdatefound = function() {
          var worker = registration.installing;
          if (!worker) return;
    
          worker.onstatechange = function() {
            if (worker.state === "installed") {
              showMessage('<i class="fa fa-download"></i> Caching completed. This app works offline!');
            }
          };
        };
      }).catch(function(err) {
        Raven.captureException(err);
        console.log('sw failure', err);
      });
    }
    
    })();