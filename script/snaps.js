J.Snaps = function() {
  this._pictureData = [];
  this._pictureElements = [];

  this._fullWidth = 0;
  this._fullHeight = 0;
  this._focusArea = 0;

  this._photosEl = document.getElementById('sn-photos');
  if (this._photosEl === null)
    console.warn("Can't find photos element!");

  // Doesn't matter if this is null - will re-create when pictures are loaded
  this._photosHolder = document.getElementById('sn-photo-holder');

  this._overlayPic = document.getElementById('sn-overlay-photo');
  
  this._albumName = document.getElementById('sn-album-name');

  this._progressMessage = document.getElementById('sn-progress-message');

  this._tagsHolder = document.getElementById('sn-album-tags');

  this._currPhotoEl = document.getElementById('sn-curr-photo');
  this._focussedPhoto = null;
  this._focussedOffset = 0;

  this._isStrip = false;

  this._inResizeHandler = false;

  this._nameCount = {};

  this._photoInfo = document.getElementById('sn-photo-info');
  this._photoTitle = document.getElementById('sn-photo-name');
  this._photoComments = document.getElementById('sn-photo-comments');
  this._commentContainer = document.getElementById('sn-comment-container');
  

 

  this._processPictures = function() {
    if (this._pictureData === null)
      return;
    
    var l = this._pictureData.length;
    if (l === null)
      return;
    
    var pics = this._pictureData;
    var curr = null;
    var name = null;
    var nCount = this._nameCount;
    var tags = null;
    for (var ctr = 0; ctr < l; ++ctr) {
      curr = pics[ctr];
      if (curr.hasOwnProperty('from')) {
        name = curr.from.name;
        if (name !== 'undefined')
          if (nCount.hasOwnProperty(name))
            nCount[name] = nCount[name] + 1;
        else
          nCount[name] = 1;
      }
      
      if (curr.hasOwnProperty('tags')) {
        tags = curr.tags;
        tags = tags.data;
        if (tags !== undefined) {
          var tagsLen = tags.length;
          for (var tagCtr = 0; tagCtr < tagsLen; ++tagCtr) {
            name = tags[tagCtr].name;
            if (name !== undefined) {
              if (nCount.hasOwnProperty(name))
                nCount[name] = nCount[name] + 1;
              else
                nCount[name] = 1;
            }
          }
        }
      }
      
      // TODO: comments
    }
    

    if (this._tagsHolder) {
      var holder = this._tagsHolder;
      while (holder.childElementCount > 0) {
        holder.removeChild(holder.firstChild);
      }
      
      var tagSpan = null;
      // Can get away with this but it's pretty crappy - need to revisit this method
      for (var t in this._nameCount) {
        tagSpan = document.createElement('span');
        tagSpan.className = 'sn-album-tag';
        tagSpan.textContent = t;
        
        holder.appendChild(tagSpan);
      }
    }
  };


  this._pictureDataLoaded = function(fbData) {
    this._fullWidth = 0;
    this._fullHeight = 0;
    this._pictureElements = [];

    if (this._photosEl === null)
      return; // error message will have been printed above.


    if (fbData === null) {
      console.warn('No picture data received');
      return;
    }

    if (!fbData.hasOwnProperty('data')) {
      console.warn('Unexpected format for picture data - no "data" property');
      return;
    }
    
    this._pictureData = fbData['data'];
    if ((this._pictureData instanceof Array) === false) {
      console.warn('Unexpected format - image collection is not an array.');
      this._pictureData = [];
      return;
    }


    var container = document.createElement('div');
    
    var picLen = this._pictureData.length;
    var currPic = null;
    var pics = this._pictureData;
    var width = 0;
    var height = 0;
    var name = null;
    var src = null;
    var currEl = null;
    var legend = null;
    for (var ctr = 0; ctr < picLen; ++ctr) {
      currPic = pics[ctr];
      

      width = parseInt(currPic['width']);
      if (width === NaN)
        width = 0;

      height = parseInt(currPic['height']);
      if (height === NaN)
        height = 0;


      
      if (height > this._fullHeight)
        this._fullHeight = height;


      name = currPic['name'] || '';
      src = currPic['source'] || ''; // TODO: Default "missing image" icon...
      // TODO: Blindly passing this url through - security
      
      currEl = document.createElement('div');
      currEl.className = 'sn-photo sn-transition-opacity';
      currEl.style.backgroundImage = 'url(' + src + ')';
      currEl.setAttribute('data-width', width);
      currEl.setAttribute('data-height', height);
      currEl.setAttribute('data-offset', this._fullWidth);
      currEl.setAttribute('data-idx', ctr);

      legend = document.createElement('div');
      legend.className = 'sn-legend';
      legend.appendChild(document.createTextNode(name));

      currEl.appendChild(legend);

      container.appendChild(currEl);
      
      this._pictureElements.push(currEl);

      this._fullWidth += (width + 10); // '+ 10' for the padding and border
    }


    // TODO: Nicer transition...
    if (this._photosHolder !== null)
      this._photosEl.removeChild(this._photosHolder);

    container.setAttribute('id', 'sn-photo-holder');
    this._photosHolder = container;
    this._photosEl.appendChild(this._photosHolder);
 
    this._processPictures();
  };


  this._pictureDataError = function() {
    console.warn('Problem getting picture Data');
  };


  this._reflowStrip = function(snapsObj) {
    if (snapsObj._photosHolder === null)
      return;
    
    var containerHeight = snapsObj._photosEl.offsetHeight - 24;

    // Focus area is the width of the window - the width of 
    // the photo info window panel
    snapsObj._focusArea = snapsObj._photosEl.offsetWidth - 320;


    var els = snapsObj._pictureElements;
    var l = els.length;
    var curr, scale, targetWidth, targetHeight;
    var totalWidth = 0;
    
    snapsObj._fullWidth = 0;

    for (var ctr = 0; ctr < l; ++ctr) {
      curr = els[ctr];
      if (curr === snapsObj._focussedPhoto)
        snapsObj._focussedOffset = totalWidth;

      targetWidth = parseInt(curr.getAttribute('data-width'));
      targetHeight = parseInt(curr.getAttribute('data-height'));

      if (targetWidth === NaN || targetHeight === NaN)
        continue; // Life's too short...
      
      if (targetHeight > containerHeight) {
        scale = containerHeight / targetHeight;
        targetHeight = Math.ceil(targetHeight * scale);
        targetWidth = Math.ceil(targetWidth * scale);
      }

      curr.style.width = targetWidth + 'px';
      curr.style.height = targetHeight + 'px';

      totalWidth += targetWidth + 10; // '+ 10 for the padding and the border'
    }
    
    snapsObj._fullWidth = totalWidth;
  };

  this._updatePhotoInfo = (function(snapsObj) {
    var snaps = snapsObj;
    var _timerId = null;
    
    var photoInfo = snaps._photoInfo;
    var photoTitle = snaps._photoTitle;
    var photoComments = snaps._photoComments;
    var commentContainer = snaps._commentContainer;

    var _cb = function() {
      var photo = snaps._focussedPhoto;
      if (photo === undefined || photo === null)
        return;


      if (snaps._currPhotoEl !== null)
        snaps._currPhotoEl.style.backgroundImage = photo.style.backgroundImage;
      
      var idx = photo.getAttribute('data-idx');
      if (idx === null)
        return;

      idx = parseInt(idx);
      if (idx === NaN)
        reuturn;

      photoComments.removeChild(commentContainer);

      var data = snaps._pictureData[idx];


      if (data.hasOwnProperty('name')) {
        photoTitle.textContent = data['name'];
        photoTitle.classList.remove('sn-no-name');
      } else {
        photoTitle.textContent = 'no name...';
        photoTitle.classList.add('sn-no-name');
      }

      commentContainer = document.createElement('div');
      commentContainer.setAttribute('id', 'sn-comment-container');

      var comments, commentsLen, comment, from, fromId, fromName, message;
      var commentDiv, stamp, authorPic, cText, cAuthor, cMessage;
      if (data.hasOwnProperty('comments')) {
        comments = data.comments;
        comments = comments.data;
        if (comments !== undefined) {
          commentsLen = comments.length;
          for (var commentCtr = 0; commentCtr < commentsLen; ++commentCtr) {
            comment = comments[commentCtr];
            from = comment.from;
            if (from === undefined) {
              console.warn('No from field in comment');
              continue;
            }
            
            fromId = from.id;
            if (fromId === undefined) {
              console.warn('No from ID in comment');
              continue;
            }

            fromName = from.name || '';
            message = comment.message || '';

            commentDiv = document.createElement('div');
            commentDiv.className = 'sn-comment';

            stamp = document.createElement('div');
            stamp.className = 'sn-stamp';
            
            authorPic = document.createElement('img');
            authorPic.className = 'sn-author-pic'
            authorPic.src = 'http://graph.facebook.com/' + fromId + '/picture?type=square';

            stamp.appendChild(authorPic);

            cText = document.createElement('div');
            cAuthor = document.createElement('span');
            cAuthor.className = 'sn-author'
            cAuthor.textContent = fromName;

            cMessage = document.createElement('span');
            cMessage.textContent = message;

            cText.appendChild(cAuthor);
            cText.appendChild(cMessage);
            
            commentDiv.appendChild(stamp);
            commentDiv.appendChild(cText);

            commentContainer.appendChild(commentDiv);
          }
        }
      } else {
        commentContainer.textContent = 'no comments...'
        commentContainer.classList.add('sn-no-comments');
      }


      photoComments.appendChild(commentContainer)
      snaps._commentContainer = commentContainer;
    };

    return function() {
      clearTimeout(_timerId);
      setTimeout(_cb, 500);
    };
  }(this));

  // Take a stab at which photo the user is looking at and
  // focus it...
  this._focusPhoto = function(snapsObj) {
    if (snapsObj._focusArea === 0)
      return;

    var photos = snapsObj._pictureElements;
    if (!photos)
      return;

    var container = snapsObj._photosEl;
    if (!container)
      return;
    
    var scrollOffset = container.scrollLeft;
    var containerWidth = container.offsetWidth;


    var photosLen = photos.length;
    if (photosLen === 0)
      return;

    // Proportions of the current image
    var currLeft, currWidth, currRight = 0;

    // Proportion of the current image that is on screen
    var showing = 0;

    // The current image
    var currPhoto = null;

    // The currently focussed image
    var focused  = snapsObj._focussedPhoto;

    // True if we are looking fora new image to focus
    var needFocus = true;

    // Focus all the currently defocussed images
    // TODO: May want to do this separately
    var defoc = snapsObj._defocussedPhotos;
    if (defoc !== undefined) {
      var defocLen = defoc.length;
      for (var ctr = 0; ctr < defocLen; ++ctr)
        defoc[ctr].classList.remove('sn-defocus');
    }
    defoc = [];
    

    for (var ctr = 0; ctr < photosLen; ++ctr) {
      currPhoto = photos[ctr];
      currLeft = currPhoto.offsetLeft - scrollOffset;
      
      currWidth = currPhoto.offsetWidth;
      currRight = currLeft + currWidth;

      showing = currWidth;

      if (currLeft > containerWidth)
        break; // all remaining photos are offscreen

      if (currRight < 0)
        continue; // current photo is offscreen
      
      if (currRight <= 320) {
        // if current photo is under the photo info panel then
        // defocus
        currPhoto.classList.add('sn-defocus');
        defoc.push(currPhoto);
        continue;
      }
      
      if (currLeft < 320)
        showing -= (320 - currLeft);

      if (currRight > containerWidth)
        showing -= (currRight - containerWidth);

      if (showing < (currWidth / 2))
      {
        currPhoto.classList.add('sn-defocus');
        defoc.push(currPhoto);
      } else {
        // If this is the first focused photo then show its info
        if (needFocus) {
          needFocus = false;

          if (currPhoto !== focused) {
            // new focussed photo...
            snapsObj._focussedPhoto = currPhoto;
            snapsObj._updatePhotoInfo();
          }
        }
      }
    }

    snapsObj._defocussedPhotos = defoc;
    
    // reset need focus for next time
    needFocus = true;
  };

  this._pictureClick = (function(that) {
    return function(e) {
      that._focussedPhoto = this;
      that._updatePhotoInfo();
      that.ShowAsStrip();
    };
  }(this));

  $(this._photosEl).on('click', '.sn-photo', {}, this._pictureClick);


  this._phocusPhotoEventHandler = (function(snapsObj) {
    var timerId = null;
    var snaps = snapsObj;
    
    // this is ridiculous..
    var cb = function() {
      snaps._focusPhoto(snaps);
    };

    return function(e) {
      if (snaps._inResizeHandler)
        return;

      clearTimeout(timerId);
      timerId = setTimeout(cb, 200);
    };
  }(this));



  this._resizeEventHandler = (function(snapsObj) {
    var timerId = null;
    var snaps = snapsObj;
    var ph = snapsObj._photosHolder;
    var container = snapsObj._photosEl;


    
    var cb = function() {
      if (snaps._isStrip == true) {
        snaps._inResizeHandler = true;

        snaps._reflowStrip(snaps);
        
        snaps._photosHolder.style.width = snaps._fullWidth + 'px';
        ph.style.width = snaps._fullWidth;
        container.scrollLeft = snaps._focussedOffset;

        snaps._focusPhoto(snaps);
        snaps._inResizeHandler = false;
      }
    };

    return function(e) {
      clearTimeout(timerId);
      timerId = setTimeout(cb, 200);
    };
  })(this);


  $(this._photosEl).on('scroll', '', {}, this._phocusPhotoEventHandler);  
  $(window).on('resize', this._resizeEventHandler);
  


  this._fbCallback = jQuery.proxy(
    function(k, s, d) {
      if (k == 'j.facebook.statusmessage') {
        this._progressMessage.firstChild.textContent = d;
        this._progressMessage.style.display = 'block'              
      }
      else if (k === 'j.facebook.gotprofile') {
        this._albumName.textContent = d.name;
        J.Facebook.GetUserPhotos();
        this._progressMessage.style.display = 'none';
      }
      else if (k === 'j.facebook.me_photos') {
        this._pictureDataLoaded(d);
      }
    },
    this
  );
  J.Notifications.Subscribe('j.facebook.*', this._fbCallback);

};


J.Snaps.prototype = {
  LoadPictures : function(uri) {
    // Go Javascript!
    var that = this;

    $.ajax({
      url: uri,
      method: 'GET',
      dataType: 'json',
      cache: false,
      context: that,
      success : this._pictureDataLoaded,
      error: this._pictureDataError
    });
  },


  ShowAsStrip : function() {
    if (this._photosHolder === null)
      return;


    var top = this._photosEl.scrollTop + (this._focussedPhoto.offsetTop - 4);
    var left = this._focussedPhoto.offsetLeft - 4;

    var elOffset = parseInt(this._focussedPhoto.getAttribute('data-offset'));
    if (elOffset === NaN)
      elOffset = 0;

    var scrollOffset = elOffset - (left - 12);

    var containerHeight = this._photosEl.offsetHeight - 24;
    var scale = 1;
    var targetWidth = this._focussedPhoto.getAttribute('data-width');
    var targetHeight = this._focussedPhoto.getAttribute('data-height');
    if (targetHeight > containerHeight) {
      scale = containerHeight / targetHeight;
      targetHeight = Math.floor(targetHeight * scale);
      targetWidth = Math.floor(targetWidth * scale);
    }

    this._overlayPic.style.backgroundImage = this._focussedPhoto.style.backgroundImage;
    this._overlayPic.style.visibility = 'visible';

    var pe = this._photosEl;
    var jpe = jQuery(pe);

    var overlay = this._overlayPic;
    var jo = jQuery(overlay);

    var ph =  this._photosHolder;
    var els = this._pictureElements;

    var fullWidth = this._fullWidth;

    var reflow = this._reflowStrip;
    var that = this;


    overlay.style.left = left + 'px';
    overlay.style.top = (137 + parseInt(top)) + 'px';


    // Transition is:
    // Fade out image grid (apart from selection) -> expand selected
    // -> fade in image strip...
    jpe.animate({ opacity: 0 }, 
                500,
                'linear',
                function() {

                  jo.animate(
                    { top: '149px', left: '332px', width: targetWidth, height: targetHeight }, 500,
                    'linear',
                    function() {
                      pe.classList.add('sn-strip-mode');

                      reflow(that);

                      ph.style.width = that._fullWidth + 'px';

                      pe.scrollLeft = that._focussedOffset;

                      jpe.animate(
                        { opacity: 1 }, 500, 'linear',
                        function() { 
                          var s = overlay.style;
                          s.visibility = 'hidden';
                          s.width = null;
                          s.height = null;
                        }
                      )
                    })
                });

    this._isStrip = true;
    return;
  },

  
  ShowAsGrid : function() {
    if (this._photosHolder === null)
      return;
    
    this._photosHolder.classList.remove('sn-strip-mode');
    this._photosHolder.style.width = '100%';

    var els = this._pictureElements;
    var l = els.length;
    var curr = null;
    for (var ctr = 0; ctr < l; ++ctr) {
      curr = els[ctr];
      curr.style.width = null;
      curr.style.height = null;
    }

    this._isStrip = false;
  }
};