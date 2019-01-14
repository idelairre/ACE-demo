const { intersection } = require('lodash');

const thumbnailTemplate = require('./templates/thumbnail.ejs');
const slideshowTemplate = require('./templates/slideshow.ejs');
const sidebarTemplate = require('./templates/sidebar.ejs');
const videoThumbnailTemplate = require('./templates/videoThumbnail.ejs');

const videoTemplate = require('./templates/video.js');

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

    // add test video thumbnail
    $('.content').prepend(videoThumbnailTemplate());

    // load sidebar
    const sidebarHtml = sidebarTemplate({ categories: json.categories });
    $('.main').prepend(sidebarHtml);

    // hide sidebar until we populate slides
    $('label#category, li#category').each(function() {
      $(this).hide();
      if ($(this).prop('tagName') === 'LI') {
        $(this).parents('.category-content').siblings('label').hide();
      }
    });

    // fetch only the decks we've loaded
    const presentations = []

    for (let i = 0; json.content.length > i; i++) {
      const src = 'https://abiomedtraining.com/ACE/2.0/decks/' + json.content[i].vaultId + '/thumbnails/1.PNG';
      const img = new Image();
      img.onload = function () {
        // we now load the thumbs one by one instead of all at once
        presentations.push(src);
        const thumbsHtml = thumbnailTemplate({ entry: json.content[i] });
        $('.content').append(thumbsHtml);
        // populate categories as we load slides
        $('label#category, li#category').each(function () {
          const slides = $(this).data('content').split(',');
          if (slides.includes(json.content[i].vaultId)) {
            $(this).show();
            if ($(this).prop('tagName') === 'LI') {
              $(this).parents('.category-content').siblings('label').show();
            }
          }
        });
      }
      img.onerror = function () {
        delete cache[json.content[i].vaultId];
      }
      img.src = src;
    }

    // filter items
    $('label#category, li#category').each(function() {
        $(this).click(function() {
            const slides = $(this).data('content');
            $('.large-thumb').each(function() {
                if (!slides.includes($(this).data('slide'))) {
                    $(this).fadeOut('250');
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
      const id = $(this).data('slide');
      playSlideshow(id);
      $('.slider-container').show();
    });

    // video slideshow
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
      $loading.show();
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
        $loading.hide();
      }
    }
});
