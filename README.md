# watch-stream

`ls` meets `tail -f`

``` js
var watcher = require('watch-stream')

watcher(process.cwd(), opts)
  .search(/mp3$/) //returns a stream!
  .on('data', console.log)

```

wraps [mikeal](https://github.com/mikeal/watch)

## API

### watcher(root, opts)
returns a `WatchStream` on all the flies under `root`.

### .search (string | RegExp)

return a `WatchStream` of flies that match the string or regexp.

data objects look like this:

``` js
{ name: 'Charisma/Disasteradio - Charisma - 05 Gravy Rainbow.mp3',
  create: true,
  type: 'file',
  size: 5598948,
  mtime: '2012-09-14T13:51:57.000Z',
  ctime: '2012-09-14T14:37:51.000Z' }
```
`type` it taken off the stat object,
see [fs.Stats](http://nodejs.org/api/fs.html#fs_class_fs_stats)
it corresponds thusly:
``` js
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
```

### .destroy

stop listening on changes

## known issues

File watching is more or less broken in some way or another
on each platfrom. 

example: https://github.com/mikeal/watch/issues/36

and there are other tricky cases, like when a directory is moved.
(now, the dir file still exists, but the names for the it's files 
are now all different)

## License

MIT
