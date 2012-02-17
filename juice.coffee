
class Juice

  ###
  Ready code adapted from jQuery: https://github.com/jquery/jquery/blob/master/src/core.js
  ###

  constructor: () ->
    @ready_fired = false
    @url = @self_dirname()
    @assets = document.getElementsByTagName 'asset'
    @remote = new JuiceRemote(@)
    obj = @
    @remote.get 'http://www.lclark.edu/core/libs/juice/third-party/persist-js/persist-all-min.js', (xhr) ->
      if xhr.status is 200
        eval xhr.response
        obj.local = new JuiceLocal(obj)
        obj.load()
        ### yes this works
        if obj.local?
          jquery = obj.local.get('jquery-1.7.1.min.js')
          if jquery?
            eval jquery
            return null
        else
          obj.remote.get 'http://www.lclark.edu/core/libs/jquery/jquery-1.7.1.min.js', (xhr) ->
            if xhr.status is 200
              eval xhr.response
              console.log 'run from load'
              console.log $('asset').length
              obj.local.set('jquery-1.7.1.min.js', xhr.response) if obj.local
            else
              console.log xhr
        ###
      else
        console.log xhr
    if document.addEventListener?
      document.addEventListener "DOMContentLoaded", @run_ready_once, false
      window.addEventListener "load", @run_ready_once, false
    else if document.attachEvent?
      document.attachEvent "onreadystatechange", @run_ready_once
      window.attachEvent "onload", @run_ready_once

  self_dirname: () ->
    scripts = document.getElementsByTagName 'script'
    for script in scripts
      return script.src.replace(/\/juice\.js(\?.*)?$/, '') if script.src? and script.src.match(/\/juice\.js/)
    null

  run_ready_once: (e) ->
    return null if document.juice.ready_fired
    document.juice.ready_fired = true
    document.juice.ready()

  ready: () ->
    console.log 'init'

  load: () ->
    console.log @assets
    console.log 'load'
    

class JuiceLocal

  constructor: ( parent, domain=document.location.origin, expires=730 ) ->
    return null if !Persist?
    @Juice = parent
    Persist.remove 'cookie'
    Persist.remove 'ie'
    @store = new Persist.Store 'JuiceStore', { swf_path: "#{parent.url}/persist.swf" }
    console.log Persist.type

  get: (key) ->
    try
      @store.get key
    catch e
      console.log e

  set: (key, value='') ->
    try
      if value.length is 0
        @store.remove key
      else
        throw new Error('too much data') if Persist.size != -1 && Persist.size < value.length
        @store.set key, value
    catch e
      console.log e


class JuiceRemote

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

###
console.log(document.getElementsByTagName('asset'));
console.log(document.getElementsByName('manifest')[0].hasChildNodes());
console.log(document.getElementsByName('manifest')[0].childNodes());
###

###
require

persistJS (persist-min.js, extras/gears_init.js)
JSON (should be built in)
some form of document.ready, use jquery’s?: https://github.com/jquery/jquery/blob/master/src/core.js
console.log?
ajax


process

loads local manifest
checks against remote manifest
requests added/updated scripts ( returned in aggregated file ); simultaneously begins loading available scripts, as determined by load order
splits, stores added/updated scripts; updates manifest as store is successful

###
