<script type='text/html' id='photos-template'>
{{each photos}}
<div class="sn-photo sn-transition-opacity" style='background-image: url(${ source })' data-width='${ width }' data-height='${ height }' data-fb-id='${ id }'>
  <div class="sn-legend">
    <div class='sn-comment-close'>x</div>
    {{if comments}}
    <div class='sn-comment-count'>
      ${ comments.data.length } <div class='sn-comment-icon'></div>
    </div>
    {{/if}}
    {{if name }}
    <div class="sn-photo-name">${ name }</div>
    {{/if}}

    {{if comments}}
    <div class="sn-photo-comments">
      {{each comments.data }}
        <div class="sn-comment">
          <div class="sn-stamp">
            <img class="sn-author-pic" src='http://graph.facebook.com/${ from.id }/picture?type=square' />
          </div>
          <div>
            <a class="sn-author sn-show-usr-photos" href='javascript:void(0)' data-fb-id='${ from.id }' data-fb-name='${ from.name }'>${ from.name }</a>
            <span>${ message }</span>
          </div>
        </div>
      {{/each}}
    </div>
    {{/if}}    
  </div>
</div>
{{/each}}
</script>