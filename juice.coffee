
class JuiceBase

  ###
  usage: log('inside coolFunc',this,arguments);
  http://paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
  ###
  log: ( message, caller ) ->
    return null if !message?
    @history = @history or []
    @history.push arguments
    @history.push arguments
    if console? and console.log?
      console.log message
      console.log caller.name if caller? and caller.name?
      console.log(Array.prototype.slice.call(arguments))

  error: ( message='' ) ->
    console.log message

class Juice extends JuiceBase

  ###
  Ready code adapted from jQuery: https://github.com/jquery/jquery/blob/master/src/core.js
  ###

  constructor: () ->
    @is_ready = false
    @url = @self_dirname()
    @origin = document.location.host
    @assets = {}
    @register_assets()
    @remote = new JuiceRemote(@)
    obj = @
    @remote.get 'http://www.lclark.edu/core/libs/juice/third-party/persist-js/persist-all-min.js', (xhr) ->
      if xhr.status is 200
        try
          eval xhr.response
        catch e
          obj.log e, arguments
        obj.load_when_ready()
      else
        obj.log xhr, arguments
    if document.addEventListener?
      document.addEventListener "DOMContentLoaded", @ready, false
      window.addEventListener "load", @ready, false
    else if document.attachEvent?
      document.attachEvent "onreadystatechange", @ready
      window.attachEvent "onload", @ready

  self_dirname: () ->
    scripts = document.getElementsByTagName 'script'
    for script in scripts
      return script.src.replace(/\/juice\.js(\?.*)?$/, '') if script.src? and script.src.match(/\/juice\.js/)
    null

  ready: (e) ->
    document.juice.is_ready = true

  load_when_ready: () ->
    console.log 'load'
    if @is_ready
      @local = new JuiceLocal(@)
      for checksum, asset of @assets
        asset.load() if !asset.dependencies?
    else
      obj = @
      setTimeout(`function(){ obj.load(); }`, 1)
  
  register_assets: () ->
    assets = document.getElementsByTagName 'asset'
    for asset in assets
      checksum = asset.getAttribute 'checksum'
      @assets[checksum] = new JuiceAsset(@, asset) if checksum?
    for checksum, asset of @assets
      asset.register()
    

class JuiceAsset extends JuiceBase

  constructor: ( parent, asset ) ->
    @Juice = parent
    @is_loaded = false
    for attribute in ['checksum', 'name', 'version', 'dependencies', 'src']
      value = asset.getAttribute attribute
      @[attribute] = value if value? and value isnt ''
    @dependencies = @dependencies.split(',') if @dependencies?
    @src = @src.split('||') if @src?
    @raw = ''
    @listeners = {}

  is_cross_domain: ( url ) ->
    url = url.split('//')
    return false if url.length is 1
    host = url[1].split('/').shift()
    (host isnt @Juice.origin)

  onSuccess: ( asset ) ->
    @listeners[asset.checksum] = `function(){asset.load();}`

  load: () ->
    console.log "loading #{@name}"
    return null if !@raw?
    console.log !@raw?
    console.log "loading #{@name}"
    if @Juice.local?
      code = @Juice.local.get(@checksum)
      if code?
        try
          eval code
        catch e
          @error(e)
        return @success()
      else
        @log("failed to retrieve #{@name}::#{@checksum}, attempting xhr load instead")
    @retrieve()

  retrieve: ( index=0 ) ->
    obj = @
    return @error("all sources failed") if !@src[index]?
    @Juice.remote.get @src[index], (xhr) ->
      if xhr.status is 200 or xhr.status is 304
        try
          eval xhr.response
        catch e
          obj.error(e)
        obj.Juice.local.set(obj.checksum, xhr.response) if obj.Juice.local?
        obj.success()
      else
        if obj.src.length - 1 > index
          obj.retrieve(index + 1)
        else
          obj.error("unable to retrieve code #{xhr}")

  register: () ->
    return null if !@dependencies?
    for dependency in @dependencies
      @Juice.assets[dependency].onSuccess(@) if @Juice.assets[dependency]?

  success: () ->
    @log("retrieved and stored #{@name}::#{@checksum}")
    for checksum, listener of @listeners
      listener()
    true


class JuiceLocal extends JuiceBase

  constructor: ( parent, domain=document.location.origin, expires=730 ) ->
    return null if !Persist?
    @Juice = parent
    Persist.remove 'cookie'
    Persist.remove 'ie'
    options =
      domain: domain
      expires: expires
    if parent.url?
      options['swf_path'] = "#{parent.url}/third-party/persist-js/persist.swf"
    else
      Persist.remove 'flash'
    @store = new Persist.Store 'JuiceStore', options
    console.log Persist.type

  get: (key) ->
    try
      @store.get key
    catch e
      @error(e)
    null

  set: (key, value='') ->
    try
      if value.length is 0
        @store.remove key
      else
        throw new Error('too much data') if Persist.size != -1 && Persist.size < value.length
        @store.set key, value
    catch e
      @error(e)
    null


class JuiceRemote extends JuiceBase

  ###
  AJAX Class
  https://github.com/visionmedia/superagent (extra factories)
  http://www.quirksmode.org/js/xmlhttp.html (most of this code)
  ###

  constructor: ( parent ) ->
    @Juice = parent
    @factories = [
      `function(){ return new XMLHttpRequest(); }`,
      `function(){ return new ActiveXObject("Msxml2.XMLHTTP 6.0"); }`,
      `function(){ return new ActiveXObject("Msxml2.XMLHTTP 3.0"); }`,
      `function(){ return new ActiveXObject("Msxml2.XMLHTTP"); }`,
      `function(){ return new ActiveXObject("Msxml3.XMLHTTP"); }`,
      `function(){ return new ActiveXObject("Microsoft.XMLHTTP"); }`,
    ]

  createXHR: ( url ) ->
    xhr = false
    for factory in @factories
      try
        xhr = factory()
      catch e
        continue
      break
    xhr

  post: (url, callback, postData=null) ->
    request = @createXHR()
    return null if !request?
    method = if postData? then 'POST' else 'GET'
    request.open method, url, true
    request.setRequestHeader 'Content-type', 'application/x-www-form-urlencoded' if postData?
    obj = @
    request.onreadystatechange = () ->
      return null if request.readyState isnt 4
      callback(request)
    return null if request.readyState is 4
    request.send(postData)

  get: (url, callback) ->
    @post(url, callback)


document.juice = new Juice
