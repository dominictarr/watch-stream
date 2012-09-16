'use strict';
var watch = require('watch')
var fs = require('fs')
var through = require('through')
var Stream = require('stream')
var join = require('path').join

var watcher = module.exports =  function (root, options) {
  options = options || {}
  var files = {}
  var emitter = new Stream()
  emitter.files = files
  emitter.readable = true

  emitter.destroy = function () {
    for(var k in files)
      fs.unwatchFile(join(root, k))
    emitter.removeAllListeners('data')
  }

  function type (curr) {
    return (
        curr.isFile()            ? 'file'
      : curr.isDirectory()       ? 'dir'
      : curr.isBlockDevice()     ? 'blocks'
      : curr.isCharacterDevice() ? 'chars'
      : curr.isSymbolicLink()    ? 'symlink'
      : curr.isFIFO()            ? 'fifo'
      : curr.isSocket()          ? 'socket' 
      :                            undefined
    )
  }

  function desc(name, stat) {
    return {
      name : name,
      type : type(stat),
      size : stat.size,
      mtime: stat.mtime,
      ctime: stat.ctime,
      atime: stat.ctime,
    }
  }

  function merge (o, n) {
    o.size  = n.size
    o.mtime = n.mtime
    o.atime = n.atime
    return o
  }

  emitter.search = function (query) {
    // query by iterating over all the filenames in memory.
    // of course, an index would be better.
    // but this is unlikely to be a bottleneck for a while...

    var test = (
        'function' === typeof query 
      ? function (file) {
          return query(file, files[file])  
        }
      : function (file) {
          return file.match(query)
        }
      )

    var stream = through()

    stream.on('close', function () {
      emitter.removeListener('change', onChange)
    })

    function onChange (data) {
      if(test(data.name)) {
        stream.queue(data)
      }
    }
    emitter.on('data', onChange)

    //send the files that already exist.
    process.nextTick(function () {
      for(var name in files) {
        onChange(files[name])
      }
    })

    return stream
  }

  watch.createMonitor (root, options, function (monitor) {
    var onCreate

    function trim(name) {
      return name.substring(root.length + 1)
    }

    monitor.on('created', onCreate = function (name, curr, prev) {
      name = trim(name)
      if(!files[name])
        files[name] = desc(name, curr)
      else
        merge(files[name], desc(name, curr))
      emitter.emit('data', files[name])
    })

    monitor.on('removed', function (name, curr, prev) {
      name = trim(name)
      var i 
      files[name].delete = true
      emitter.emit('data', files[name])
      delete files[name]
    })

    monitor.on('changed', function (name, curr, prev) {
      name = trim(name)
      merge(files[name], curr)
      emitter.emit('data', files[name])
    })

    for(var name in monitor.files)
      onCreate(name, monitor.files[name])
  })

  return emitter
}

if(!module.parent) {
  var st = 
  watcher (process.cwd(), {interval: 500})

  var query = process.argv[3]
  ;(query ? st.search(query) : st)
    .on('data', function (data) {
      console.log(JSON.stringify(data))
    })
}
