// requires base.js

J.Snaps = function() {
  // The picture data array from Facebook
  this._pictureData = [];
  
  // The DOM element displaying the photos
  this._pictureElements = [];

  // Full width of the panel containing the photos - used
  // to calculate scroll offsets
  this._fullWidth = 0;
  
  // Full height of the panel containing the photos - used to
  // layout photos s.t. they fit inside this panel
  this._fullHeight = 0;


  // The top level element, the root of the snaps UI
  this._snapsEl = document.getElementById('snaps');
  if (this._snapsEl === null) {
    console.warn('No snaps element found');
    return;
  }


  // The element displaying the photos
  this._photosEl = document.getElementById('sn-photos');
  if (this._photosEl === null)
    console.warn("Can't find photos element!");


  // The element used to contain the photos - this will have it's size changed
  // according to whether we are in strip or grid mode
  // Doesn't matter if this is null - will re-create when pictures are loaded
  this._photosHolder = document.getElementById('sn-photo-holder');


  // Used to provide a 'zooming' effect when a photo is clicked.  
  this._overlayPic = document.getElementById('sn-overlay-photo');
  
  // The element displaying the name of the current album
  this._albumName = document.getElementById('sn-album-name');


  // The element displaying progress messages
  this._progressMessage = document.getElementById('sn-progress-message');

  // The tags for the current album
  this._tags = [];

  // The element displaying the tags of the current album
  this._tagsHolder = document.getElementById('sn-album-tags');
  


  // The currently focussed photo
  this._focussedPhoto = null;
  
  // The x offset of the currently focussed photo - used to set
  // the scroll point of the photo container
  this._focussedOffset = 0;

  // A thumbnail of the currently focussed photo
  this._currPhotoEl = document.getElementById('sn-curr-photo');
  
  // True if we are currently in strip mode
  this._isStrip = false;

  // True if we are handling a window resize event (used to disable
  // scroll events while this is happening)
  this._inResizeHandler = false;

  // A map, names -> count, that records the people tagged in this album
  // and how many times they have been tagged: e.g. { "Katy" : 10 }
  this._nameCount = {};

  // The root element of the info display for the currently focussed photo
  this._photoInfo = document.getElementById('sn-photo-info');
  
  // The element displaying the name of the currently focused photo
  this._photoTitle = document.getElementById('sn-photo-name');
  
  // The element containing all the comments on the currently focussed photo
  this._photoComments = document.getElementById('sn-photo-comments');
  
  // Convenience element that contains sub elements representing photo comments.
  // Minimises the amount of DOM fiddling we have to do
  this._commentContainer = document.getElementById('sn-comment-container');
  
  // Button that puts us into grid mode
  this._backToAlbumButton = document.getElementById('sn-back');
 

  // Reset the UI - get rid of the photos & photo elements, reset the album name,
  // etc. Called when the user log out of Facebook.
  this._reset = function() {
    if (this._isStrip) {
      this.ShowAsGrid();
    }

    this._progressMessage.style.display = 'none';
    this._pictureDataLoaded({ data:[] });
    this._photosEl.removeChild(this._photosHolder);
    this._photosHolder = null;
    
    this._photoTitle.textContent = "";
    
    if (this._commentContainer !== null) {
      this._photoComments.removeChild(this._commentContainer);
    }
    
    this._albumName.textContent = 'Snaps 2012';
    var holder = this._tagsHolder;
    while (holder.childElementCount > 0) {
      holder.removeChild(holder.firstChild);
    }
  };
  
  this._addTagToCollection = function(tag, tagCollection) {
    if (tagCollection.hasOwnProperty(tag))
      tagCollection[tag] = tagCollection[tag] + 1;
    else
      tagCollection[tag] = 1;
  };


  this._collectTagsFromText = (function() {
    var _lexer = new Lexer();
    var _tagger = new POSTagger();

    return function(text, tagCollection) {
      if (!text)
        return;

      var words = _lexer.lex(text);
      if (words.length === 0)
        return;

      var tags = _tagger.tag(words);

      var idx = 0;
      var curr = [];
      var currTag = null;
      var currNoun = null;
      var tagCount = tags.length;

      while (idx < tagCount) {
        if (tags[idx][1] === 'NNP') {
          curr.push(tags[idx][0]);
        } else {
          if (curr.length > 0) {
            this._addTagToCollection(curr.join(' '), tagCollection);
//            this.tags.push(curr.join(' '));
            curr = [];
          }
        }

        idx += 1;
      }
    };
  }());


  this._clearTagElements = function() {
    if (!this._tagsHolder)
      return;
    
    var holder = this._tagsHolder;
    while (holder.childElementCount > 0)
      holder.removeChild(holder.firstChild);
  };
 
  this._generateTagElements = function(tagCollection) {
  	// TODO: REMOVE
  	console.log(tagCollection);
  	
    if (!this._tagsHolder)
      return;

    var holder = this._tagsHolder;
    
    
    var list = J.SortObject(tagCollection);
    
    var tagSpan = null;
    var tagCount = list.length;
    var idx = tagCount - 1;
    var containerSpan = document.createElement('span');
    
    // Uncomment this and the 'idx -= 1' below to have *most*
    // common tags first..
//    while (idx >= 0) {
    for (var idx = 0; idx < tagCount; ++idx) {
      tagSpan = document.createElement('span');
      tagSpan.className = 'sn-album-tag';
      tagSpan.textContent = list[idx];

      holder.appendChild(tagSpan);
      
//      idx -= 1;
    }

    holder.appendChild(containerSpan);
  };


  
  // Scan through the data for all the pictures in the album, picking out interesting 
  // tags to show under the album name. Right now we just pick out names of people 
  // tagged in the album
  this._processPictures = function() {
    this._clearTagElements();

    if (this._pictureData === null)
      return;
    
    var l = this._pictureData.length;
    if (l === 0)
      return;

    var pics = this._pictureData;
    var curr = null;
    var name = null;

    var fbData = null;
    var fbCurr = null;
    var fbDataLen = 0;

    var collectedTags = {};

    for (var ctr = 0; ctr < l; ++ctr) {
      curr = pics[ctr];
      if (curr.hasOwnProperty('from')) {
        name = curr.from.name;
        if (name !== 'undefined')
          this._addTagToCollection(name, collectedTags);
      }

      if (curr.hasOwnProperty('tags')) {
        fbData = curr.tags;
        fbData = fbData.data;
        if (fbData !== undefined) {
          fbDataLen = fbData.length;
          for (var fbCtr = 0; fbCtr < fbDataLen; ++fbCtr) {
            name = fbData[fbCtr].name;
            if (name !== undefined)
              this._addTagToCollection(name, collectedTags);
          }
        }
      }

      if (curr.hasOwnProperty('comments')) {
        fbData = curr.comments;
        fbData = curr.comments.data;
        if (fbData !== undefined) {
          fbDataLen = fbData.length;
          for (var fbCtr = 0; fbCtr < fbDataLen; ++fbCtr) {
            fbCurr = fbData[fbCtr];
            if (fbCurr.hasOwnProperty('from')) {
              name = fbCurr.from.name;
              if (name !== undefined)
                this._addTagToCollection(name, collectedTags);
            }
            
            if (fbCurr.hasOwnProperty('message'))
              this._collectTagsFromText(fbCurr.message, collectedTags);
          }
        }
      }
	}
	
	this._generateTagElements(collectedTags);
  };

  
/*  this._processPictures = function() {
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
      
      // TODO: scan comments
      // TODO: NLP magic on comments/tags to pick out more interesting 
      // tag words
    }
    

    // Populate the tags holder with the tags we've identified
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
  }; */


  // A new album is being displayed containing the given picture data (in 
  // Facebook format) - run through the data creating an element for each photo,
  // then show those elements.
  //
  // This will set _fullWidth and _fullHeight to be the width and height of the
  // photo holder element assuming we did not have to shrink the photos to fit the
  // y-height of the container. Which we probably will have to.
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

      // TODO: Blindly passing this url through - security
      src = currPic['source'] || ''; // TODO: Default "missing image" icon...

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


    // TODO: Nicer transitiion, fade the new photos in or something
    if (this._photosHolder !== null)
      this._photosEl.removeChild(this._photosHolder);


    container.setAttribute('id', 'sn-photo-holder');
    this._photosHolder = container;
    this._photosEl.appendChild(this._photosHolder);
 
    this._processPictures();
  };


  // Problem getting picture data
  this._pictureDataError = function() {
    console.warn('Problem getting picture Data');
  };



  // Reflow the photo holder such that no photo is taller than
  // _photoEl's height. _fullWidth is set to the cumulative width
  // of all the photos given the current aspect ratio
  this._reflowStrip = function(snapsObj) {
    if (snapsObj._photosHolder === null)
      return;
    
    // '36' to accommodate padding etc.
    var containerHeight = snapsObj._photosEl.offsetHeight - 36;


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
//    if (snapsObj._focusArea === 0)
//      return;

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
      if (snaps._isStrip === false || snaps._inResizeHandler === true)
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
  
  
  this._pictureClick = (function(that) {
    return function(e) {
      that._focussedPhoto = this;
      that._updatePhotoInfo();
      that.ShowAsStrip();
    };
  }(this));
  $(this._photosEl).on('click', '.sn-photo', {}, this._pictureClick);


  this._showAlbumClick = (function (that) {
    return function(e) {
      that.ShowAsGrid();
    }
  }(this));
  $(this._backToAlbumButton).on('click', this._showAlbumClick);
  



  this._fbCallback = jQuery.proxy(
    function(k, s, d) {
      if (k == 'j.facebook.statusmessage') {
        this._progressMessage.firstChild.textContent = d;
        this._progressMessage.style.display = 'block'              
      }
      else if (k === 'j.facebook.gotprofile') {
        this._albumName.textContent = d.name;
        this._progressMessage.firstChild.textContent = 'Loading photos...';
        J.Facebook.GetUserPhotos();
      }
      else if (k === 'j.facebook.me_photos') {
        this._pictureDataLoaded(d);
        this._progressMessage.style.display = 'none';
      }
      else if (k === 'j.facebook.notloggedin') {
        this._progressMessage.style.display = 'none'
      }
      else if (k === 'j.facebook.loggedout') {
      /*
        this._progressMessage.style.display = 'none';
        this._pictureDataLoaded({ data:[] });
        this._photosEl.removeChild(this._photosHolder);
        this._photosHolder = null;
        */
        this._reset();
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

    var containerHeight = this._photosEl.offsetHeight - 36;
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

    var sn = this._snapsEl;
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
                      sn.classList.remove('sn-grid-mode');
                      sn.classList.add('sn-strip-mode');

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
    
    this._isStrip = false;
    this._snapsEl.classList.remove('sn-strip-mode');
    this._photosHolder.style.width = '100%';

    var defoc = this._defocussedElements;
    if (defoc) {
      var defocLen = defoc.length;
      for (var ctr = 0; ctr < defocLen; ++ctr) {
        defoc[ctr].classList.remove('sn-defocus');
      }
    }
    
    this._defocussedElements = [];
    

    var els = this._pictureElements;
    var l = els.length;
    var curr = null;
    for (var ctr = 0; ctr < l; ++ctr) {
      curr = els[ctr];
      curr.style.width = null;
      curr.style.height = null;
    }

    this._snapsEl.classList.add('sn-grid-mode');

  }
};