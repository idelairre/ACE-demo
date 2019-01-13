const thumbnailsTemplate = require('./templates/thumbnails.ejs');
const slideshowTemplate = require('./templates/slideshow.ejs');
const sidebarTemplate = require('./templates/sidebar.ejs');

const videoTemplate = require('./templates/video.js');

require('./js/jquery.cbpFWSlider');
require('./styles/index.scss');

const json = require('./contentMetaData.json');

$(function() {
    // hacky way to see what images are on the server without doing a cross-origin request
    function imageExists(url) {
        const img = new Image();
        img.src = url;
        const res = img.height !== 0
        return res;
    }

    // fetch only the decks we've loaded
    const presentations = json.content.filter(function(entry) {
        const src = 'https://abiomedtraining.com/ACE/2.0/decks/' + entry.vaultId + '/thumbnails/1.PNG';
        if (imageExists(src)) {
            return entry;
        }
    });

    // populate slideshow cache
    const cache = {};
    for (let key in presentations) {
      const id = presentations[key].vaultId;
      cache[id] = [];
    }

    // thumbnails
    const thumbsHtml = thumbnailsTemplate({ slides: presentations });
    $('.content').append(thumbsHtml);

    // add test video thumbnail
    const videoThumbHtml = `
      <div id="video" class="large-thumb" data-slide="IMP-264" style="box-shadow:5px 5px 5px #999;">
        <video style="width: 310px; height: 198px;border: 0;padding: 5px">
          <source src="${require('file-loader!./assets/video/1. Impella Family Animation.mp4')}">
        </video>
        <p>Video Test</p>
        <p>IMP-264</p>
      </div>`
    $('.content').prepend(videoThumbHtml);

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

    // slideshow
    $('.large-thumb').not('#video').click(function() {
        const id = $(this).data('slide');
        playSlideshow(id);
        $('.slider-container').show();
        console.log('start slideshow');
    });

    $('#video').click(function () {
      prepareSlideshow(videoTemplate);
      $('.slider-container').show();
    });

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
        });
      } else {
        // otherwise pull from cache
        const html = slideshowTemplate({ id, slides: cache[id] });
        prepareSlideshow(html);
      }
    }
});
