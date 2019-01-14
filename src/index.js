const thumbnailTemplate = require('./templates/thumbnail.ejs');
const slideshowTemplate = require('./templates/slideshow.ejs');
const sidebarTemplate = require('./templates/sidebar.ejs');

//const videoTemplate = require('./templates/video.js');

require('./js/jquery.cbpFWSlider');
require('./styles/index.scss');

const json = require('./contentMetaData.json');

const $loading = $('#loadingCover').hide();


$(function() {

    // slides cache for presentations
    const cache = {};

    for (let key in json.content) {
      const id = json.content[key].vaultId;
      cache[id] = [];
    }

    // fetch only the decks we've loaded
    const presentations = []

    for (let i = 0; json.content.length > i; i++) {
      const src = 'https://abiomedtraining.com/ACE/2.0/decks/' + json.content[i].vaultId + '/thumbnails/1.PNG';
      const img = new Image();
      img.onload = function () {
        // we now load the thumbs one by one
        presentations.push(src);
        const thumbsHtml = thumbnailTemplate({ entry: json.content[i] });
        $('.content').append(thumbsHtml);
      }
      img.onerror = function () {}
      img.src = src;
    }

    // add test video thumbnail
    // TODO - include assets/video folder in github
    /*
    const videoThumbHtml = `
      <div id="video" class="large-thumb" data-slide="IMP-264" style="box-shadow:5px 5px 5px #000000;">
        <video style="width: 310px; height: 198px;border: 0;padding: 5px">
          <source src="${require('./assets/video/1. Impella Family Animation.mp4')}">
        </video>
        <p class="thumb-filename">Video Test</p>
        <p class="thumb-vault-id">IMP-264</p>
      </div>`
    $('.content').prepend(videoThumbHtml);
    */

    // sidebar
    const sidebarHtml = sidebarTemplate({ categories: json.categories });
    $('.main').prepend(sidebarHtml);

    // filter items
    $('label#category, li#category').each(function() {
        $(this).click(function() {
            const slides = $(this).data('content');
            $('.large-thumb').each(function() {
                if (!slides.includes($(this).data('slide'))) {
                    $(this).hide();
                } else {
                    $(this).show();
                }
            });
        });
    });

    // undo filter
    $('.header').click(function() {
      $('.large-thumb').show();
    });

    // delegate slide show function
    $(document).on('click', '.large-thumb:not(#video)', function() {
      console.log('click');
      const id = $(this).data('slide');
      playSlideshow(id);
      $('.slider-container').show();
    });

    // video slideshow
    /*
    $('#video').click(function () {
      prepareSlideshow(videoTemplate);
      $('.slider-container').show();
    });
    */

    // rendering for slideshow
    const prepareSlideshow = function (html) {
      $('.slider-container').html(html);
      $('#cbp-fwslider').cbpFWSlider();
      $('#close-btn').click(function() {
          $('.slider-container').hide();
          $('#cbp-fwslider').cbpFWSlider('destroy');
      });
    }

    const playSlideshow = function(id) {
      // show loading anim
      $loading.show();
      // retrieve # of slides for this deck
      $.getJSON('https://abiomedtraining.com/ACE/2.0/decks/' + id + '/index.json')
        .done(function(data) {
          var slides = [];
          console.log('Loading images...');
          for (var i = 1; i <= data.slides.length; i++) {
            let url = 'https://abiomedtraining.com/ACE/2.0/decks/' + id + '/' + i + '.PNG';
            slides.push(url); 
            // create an Image so it can be loaded and cached
            (function () {
              const idx = i;
              const img = new Image();
              img.onload = function () {
                console.log('image ', idx, 'loaded.');
                if (idx === 1) {
                  $loading.hide();
                }
              }
              img.src = url;
            })();

          }
          const html = slideshowTemplate({ id, slides });
          prepareSlideshow(html);
        });

/*
      const html = slideshowTemplate({ id, slides });
      // need a more robust image checker
      function checkImages(i, callback) {
        let url = 'https://abiomedtraining.com/ACE/2.0/decks/' + id + '/' + i + '.PNG';
        const img = new Image();
        img.onload = function () {
          i++;
          cache[id].push(url);
          checkImages(i, callback);
        }
        img.onerror = function () {
          return callback(cache[id]);
        }
        img.src = url;
      }
      // if the cache is empty pull images from server
      if (cache[id].length === 0) {
        let index = 1;

        // janky callback on jankier recursive function to guaruntee slides are loaded
        checkImages(index, function (slides) {
          const html = slideshowTemplate({ id, slides });
          prepareSlideshow(html);
          $loading.hide();
        });
      } else {
        // otherwise pull from cache
        const html = slideshowTemplate({ id, slides: cache[id] });
        prepareSlideshow(html);
        //$loading.hide();
      }
      */
    }
});
