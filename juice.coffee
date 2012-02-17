
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


class Juice extends JuiceBase

  ###
  Ready code adapted from jQuery: https://github.com/jquery/jquery/blob/master/src/core.js
  ###

  constructor: () ->
    @is_ready = false
    @url = @self_dirname()
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
    else
      obj = @
      setTimeout(`function(){ obj.load(); }`, 1)
  
  register_assets: () ->
    assets = document.getElementsByTagName 'asset'
    @assets = []
    for asset in assets
      checksum = asset.getAttribute('checksum')
      @assets[checksum] = new JuiceAsset(@, asset) if checksum?
    @log @assets, arguments
    

class JuiceAsset extends JuiceBase

  constructor: ( parent, asset ) ->
    @Juice = parent
    @is_loaded = false
    @checksum = asset.checksum
    @name = asset.name if asset.name?
    @version = asset.version if asset.version?
    @dependencies = asset.dependencies.split(',') if asset.dependencies?
    @sources = asset.src.split('||') if asset.src?
    @raw = ''
    @listeners = {}
    console.log @

  onSuccess: ( asset ) ->
    @listeners[asset.checksum] = `function(){asset.load();}`

  load: () ->
    if @Juice.local?
      code = @Juice.local.get(@checksum)
      if code?
        try
          eval code
        catch e
          @error(e)
        return @success()
      else
        @error("failed to retreive #{@name}::#{@checksum}, attempting xhr load instead")
    @retrieve()

  retrieve: ( index=0 ) ->
    obj = @
    return @error("all sources failed") if !sources[index]?
    @Juice.remote.get @sources[index], (xhr) ->
      if xhr.status is 200
        try
          eval xhr.response
        catch e
          obj.error(e)
        obj.Juice.local.set(obj.checksum, xhr.response) if obj.Juice.local?
        obj.success()
      else
        obj.error(xhr)
      
  success: () ->
    console.log 'success'
    true

  error: ( message=null ) ->
    console.log if message? then message else "#{@name}::#{@checksum} load failed"


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
      console.log e
    null

  set: (key, value='') ->
    try
      if value.length is 0
        @store.remove key
      else
        throw new Error('too much data') if Persist.size != -1 && Persist.size < value.length
        @store.set key, value
    catch e
      console.log e
    null


class JuiceRemote extends JuiceBase

  ###
  AJAX Class
  https://github.com/visionmedia/superagent (extra factories)
  http://www.quirksmode.org/js/xmlhttp.html (most of this code)
  ###

  constructor: ( parent, domain=document.location.origin, base_path='' ) ->
    @Juice = parent
    @factories = [
      `function(){ return new XMLHttpRequest(); }`,
      `function(){ return new ActiveXObject("Msxml2.XMLHTTP 6.0"); }`,
      `function(){ return new ActiveXObject("Msxml2.XMLHTTP 3.0"); }`,
      `function(){ return new ActiveXObject("Msxml2.XMLHTTP"); }`,
      `function(){ return new ActiveXObject("Msxml3.XMLHTTP"); }`,
      `function(){ return new ActiveXObject("Microsoft.XMLHTTP"); }`,
    ]

  createXHR: () ->
    xmlhttp = false
    for factory in @factories
      try
        xmlhttp = factory()
      catch e
        continue
      break
    xmlhttp

  post: (url, callback, postData=null) ->
    request = @createXHR()
    return null if !request?
    method = if postData? then 'POST' else 'GET'
    request.open method, url, true
    request.setRequestHeader 'Content-type', 'application/x-www-form-urlencoded' if postData?
    request.onreadystatechange = () ->
      return null if request.readyState isnt 4
      throw new Error('HTTP error: ' + request.status) if request.status isnt 200 and request.status isnt 304
      callback(request)
    return null if request.readyState is 4
    request.send(postData)

  get: (url, callback) ->
    @post(url, callback)


document.juice = new Juice
