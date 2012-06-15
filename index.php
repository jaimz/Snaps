<!DOCTYPE html>
<html lang='en'>
  <head>
    <meta charset="UTF-8" />
    <title>Snaps Photo Album</title>
    
    <link rel="stylesheet" href="./style/snaps.css" />
    <link rel="stylesheet" href="./style/social_buttons.css" />
  </head>

  <body id='snaps' class='sn-grid-mode' style='background-image: url(./images/test_photos/test_photo_bw.jpg); background-size: cover'>
    <div class='sn-veil'>
      <div class='sn-veil-message'>
        Snaps
      </div>
    </div>
    <header id='sn-album-info'>
      
      <nav class='sn-usr-ctrls'>
        <span class='sn-mode-chooser'>
          <div class='sn-usr-ctrl sn-show-grid'></div>
          <div class='sn-usr-ctrl sn-show-strip'></div>
        </span>
        <div class='sn-usr-ctrl sn-go-home'></div>
<!--        <div class='sn-usr-ctrl sn-show-friends'></div> -->
        <span class='j-logout-button'>Sign out</span>
      </nav>


      <hgroup class='sn-user-info'>
        <h1 id='sn-album-name' data-bind="text: Profile().name">
          Snaps
        </h1>
      </hgroup>

        <!-- ko if: Tags().length > 0 -->

        <h2 id='sn-album-tags'>
        <!-- ko foreach: Tags() -->
          <span class='sn-album-tag' data-bind="text: text , attr: { 'data-idx' : $index }"></span>
        <!-- /ko -->
        </h2>
        
        <!-- /ko -->
      

    </header>


    <div class="sn-photo" id="sn-overlay-photo"></div>


    <section id="sn-facebook-login" class='j-unauthenticated j-checking-auth'>
      <button class="social_buttons sb_24 sb_facebook j-login-button">
        <span>Sign in to Facebook...</span>
      </button>
      
      <div class="sn-dialog-instructions">
        <p>Log into Facebook to see your photos</p>
        <p>Snaps will <strong>not</strong> be able to see your Facebook
          password. Your password remains secure and is sent directly to
          Facebook.</p>
      </div>

      
      <div class="sn-authenticating-message">
        Signing into Facebook...
      </div>
    </section>
  
    <section class="sn-info sn-loading-photos" data-bind='visible: Loading'>
      Loading photos...
    </section>
    
    <section class='sn-info sn-no-photos' data-bind='visible: Loading() === false'>
      No photos found
    </section>


    <section class="sn-photos">
     <section class="sn-photos-strip" data-bind="template: { name: 'photos-template' }"></section>
    </section>

    <div id="fb-root"></div>

    <? include_once('./templates/photo.php') ?>
    
    <script src='http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js'></script>
    <script src='../script/jquery.tmpl.js'></script>
    <script src='../script/jq_hashchange/jquery.ba-hashchange.min.js'></script>
    <script src='../script/jspos/lexicon.js'></script>
    <script src='../script/jspos/lexer.js'></script>
    <script src='../script/jspos/POSTagger.js'></script>
    <script src='../script/knockout-2.1.0.js'></script>
    <!--    <script src='./script/jquery-1.7.1.min.js'></script> -->
    <script src='../script/base.js'></script>
    <script src='../script/notification_center.js'></script>
    <script src='../script/tagging/mx_tagging.js'></script>
    <script src='../script/comm/fb.js'></script>
    <script src='../script/comm/fb.album.js'></script>
    <script src='./script/snaps2.js'></script>
    
    <script>
      var album, collection;
      
      $(function() {
        album = new J.Facebook.Album();
        collection = new J.Apps.Snaps.Collection($('#snaps'), album);
        
        J.Facebook.IsAuthenticator($('#sn-facebook-login'));
        J.Facebook.IsAuthenticator($("#sn-album-info"));
        
        J.Facebook.Instance.Init();
      });
    </script>


  </body>
</html>