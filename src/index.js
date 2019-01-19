const thumbnailTemplate = require('./templates/thumbnail.ejs');
const slideshowTemplate = require('./templates/slideshow.ejs');
const sidebarTemplate = require('./templates/sidebar.ejs');
const videoThumbnailTemplate = require('./templates/videoThumbnail.ejs');
const videoTemplate = require('./templates/video.ejs');
const searchDropdown = require('./templates/searchDropdown.ejs');

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
    const sidebarHtml = sidebarTemplate({
        categories: json.categories
    });
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
        img.onload = function() {
            // we now load the thumbs one by one instead of all at once
            presentations.push(src);
            const thumbsHtml = thumbnailTemplate({
                entry: json.content[i]
            });
            $('.content').append(thumbsHtml);
            // populate categories as we load slides
            $('label#category, li#category').each(function() {
                // compare loaded slide against the json data
                const decks = $(this).data('content');
                if (decks.includes(json.content[i].vaultId)) {
                    $(this).show();
                    if ($(this).prop('tagName') === 'LI') {
                        $(this).parents('.category-content').siblings('label').show();
                    }
                }
            });
        }
        img.onerror = function() {
            delete cache[json.content[i].vaultId];
        }
        img.src = src;
    }

    let $selected;

    // filter items
    $('label#category, li#category').each(function() {
        $(this).click(function() {
            if ($selected) $selected.removeClass('selected');
            $selected = $(this).addClass('selected');
            const decks = $(this).data('content');
            $('.large-thumb').each(function() {
                if (!decks.includes($(this).data('deck'))) {
                    $(this).hide();
                } else {
                    $(this).show();
                }
            });
        });
    });

    // undo filter
    $('.logo').click(function() {
        $('.large-thumb').show();
    });

    // delegate slide show function
    $(document).on('click', '.large-thumb:not(#video)', function() {
        const id = $(this).data('deck');
        playSlideshow(id);
        $('.slider-container').show();
    });

    // video slideshow
    $('#video').click(function() {
        $.getJSON('https://abiomedtraining.com/ACE/2.0/video/index.json').done(function(res) {
            prepareSlideshow(videoTemplate({
                videos: res.videos
            }));
            $('.slider-container').show();
        });
    });

    // slide change handler
    const slideChanged = function(last, current) {
        // just for now...
        if ($('video')) {
            $('video').trigger('pause');
        }
    };

    // rendering for slideshow
    const prepareSlideshow = function(html) {
        $('.slider-container').html(html);
        $('#cbp-fwslider').cbpFWSlider({
            slideChangedCallback: slideChanged
        });

        $('#close-btn').click(function() {
            // fixes bug where video keeps playing after slideshow is hidden and destroyed
            if ($('video')) {
                $('video').trigger('pause');
            }
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
                console.log('Loading images... for ', id, data.slides.length, 'slides.');
                for (var i = 1; i <= data.slides.length; i++) {
                    const rawSlide = data.slides[i - 1];
                    const slide = {};
                    if (rawSlide.video) {
                        slide.videoUrl = 'https://abiomedtraining.com/ACE/2.0/video/' + rawSlide.video.id;
                    } else {
                        slide.imageUrl = 'https://abiomedtraining.com/ACE/2.0/decks/' + id + '/' + i + '.PNG';
                        // create an Image so it can be loaded and cached
                        (function() {
                            const idx = i;
                            const img = new Image();
                            img.onload = function() {
                                console.log('image ', idx, 'loaded.');
                                if ($loading.is(':visible')) {
                                    $loading.hide();
                                }
                            }
                            img.src = slide.imageUrl;
                        })();
                    }

                    slides.push(slide);
                }
                console.log('now', slides);
                const html = slideshowTemplate({
                    id,
                    slides
                });
                prepareSlideshow(html);
            });
    }

    // search

    $('#search-expandable').on('input', function() {
        const found = [];
        const term = $(this).val().toLowerCase();
        $('[data-deck]').each(function() {
            const deck = $(this).data('deck');
            if (deck.toLowerCase().includes(term)) {
                found.push(deck);
                $(this).show();
            } else {
                $(this).hide();
            }
        });
        const html = searchDropdown({ decks: found });
        $('.search-results').html(html);
        $('.search-results').show();
    });

    $(document).click(function(event) {
        if (!$(event.target).closest('#search-expandable, .search-results').length) {
            if ($('.search-results').is(':visible')) {
                $('.search-results').hide();
            }
        }
    });

    $(document).on('click', '.mdl-list__item', function() {
      const deck = $(this).children('.mdl-list__item-primary-content').data('deck');
      $('#search-expandable').val(deck);
      $('div[data-deck]').each(function() {
        if ($(this).data('deck') !== deck) {
          $(this).hide();
        } else {
          $(this).show();
        }
      });
    });
});
