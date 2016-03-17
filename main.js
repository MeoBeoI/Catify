/* eslint strict: 0 */
'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const electron       = require('electron');
const app            = electron.app;
const ipcMain        = electron.ipcMain
const BrowserWindow  = electron.BrowserWindow;
const globalShortcut = electron.globalShortcut
const crashReporter  = electron.crashReporter;
const applescript    = require('applescript');
const spotifyPlayer  = require('spotify-node-applescript');
const SpotifyWebApi  = require('spotify-web-api-node');
const _              = require('lodash')
const low            = require('lowdb')
const storage        = require('lowdb/file-sync')
const db             = low(__dirname + '/db.json', { storage })
// App variables
var user             = db('user').first()
var selectedPlaylist = db('selectedPlaylist').first()
var playlists        = {}
var accessToken      = ""

let mainWindow = null;

const CLIENT_ID             = '65be55bf84924bcd949137ed3b585d6a'
const SECRET                = '7a2f6bdf1f264dc59efce10ce35bfb80'
const REDIRECT_URL          = 'http://meobeoi.com/spotifyplus/callback'
const SCOPES                = 'user-read-private playlist-modify-private playlist-read-collaborative playlist-read-private user-library-read user-library-modify'
const STATE                 = '123'
const DEFAULT_PLAYLIST_NAME = "SpotifyPlus"
const ACCESS_URL = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URL)}&scope=${encodeURIComponent(SCOPES)}&response_type=token&state=${STATE}`
var spotifyApi = new SpotifyWebApi({
  clientId     : CLIENT_ID,
  clientSecret : SECRET,
  redirectUri  : REDIRECT_URL
});

var mbOptions = {
  dir           : __dirname + '/app',
  tooltip       : "SpotifyPlus",
  preloadWindow : true, // TODO: enable if already logged in
  width         : 320,
  height        : 210,
  resizable     : false,
  useContentSize : true,
  'use-content-size' : true
}
const menubar = require('menubar')
const mb      = menubar(mbOptions)
var debug = process.env.NODE_ENV === 'development'

function initial () {
  // if (!debug) {
  //   mb.window.setSize(320, 500)
  //   mb.window.setMaximumSize(320, 600)
  //   mb.window.setMinimumSize(320, 400)
  // } else {
  //   mb.window.setSize(620, 700)
  //   mb.window.setMaximumSize(1220, 800)
  //   mb.window.setMinimumSize(620, 600)
  // }

  // // TODO
  // mb.window.setSize(300, 210)

  mb.window.setResizable(true)
  mb.window.loadURL(`file://${__dirname}/app/app.html`)
  mb.window.on('focus', function() { _sendWindowEvent('focus') })
  if (debug) {
    // mb.window.openDevTools()
  }
}

function _sendWindowEvent(name) {
  if (!mb.window) return
  mb.window.webContents.send('WindowEvent', name)
}

crashReporter.start();

if (process.env.NODE_ENV === 'development') {
  require('electron-debug')();
}


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('ready', () => {
  getAccessToken()
    .then(getMe)
    .then(getPlaylists)
    .then(getSelectedPlaylist)
    .then(() => {
      initial()
      console.log('Finish');
      console.log('Doing some dirty stuffs');
      // Renew accessToken
      setInterval(getAccessToken, 1000 * 3500)
    })
    .catch(errorHandler)
 
  // Set shortcut
  globalShortcut.register('ctrl + p + =', addTrackToPlaylist);

  globalShortcut.register('ctrl + p + ]', addTrackToSavedTracks);

  globalShortcut.register('ctrl + p + /', mb.showWindow);

});

/**p/p/
 * IPC handler
 */
ipcMain.on('initial', (event, message) => {
  var response = {
    user             : user,
    selectedPlaylist : selectedPlaylist,
    playlists        : playlists.items,
    accessToken      : accessToken
  }
  event.sender.send('main-initial', response);
});

ipcMain.on('search', (event, track) => {
  spotifyApi.searchTracks(track, {limit: 5})
  .then( data => { 
    // Resize Window
    mb.window.setSize(400, 585)
    event.sender.send('main-search', data.body.tracks.items)
  }, 
    err => console.error(err))
});

ipcMain.on('playlistChanged', (event, message) => {
  selectedPlaylist = playlists.items.find(x => x.id === message)
});

ipcMain.on('playTrack', (event, track) => {
  spotifyPlayer.playTrack(track.uri, () => {
    _sendPlayTrackEvent(track)
  });
});

ipcMain.on('pause', (event, track) => {
  spotifyPlayer.pause(() => event.sender.send('main-pause', 'PAUSE'));
});

ipcMain.on('resume', (event, track) => {
  spotifyPlayer.play(() => event.sender.send('main-resume', 'RESUME') );
});

ipcMain.on('logout', (event, uri) => {
  // Drop all
  db.object = {}
  db.write()
});

function _sendPlayTrackEvent(track) {
  if (!mb.window) return
  mb.window.webContents.send('main-play-track', track)
}


/**
 * Functions
 */

function addTrackToPlaylist () {
  getCurrentTack()
    .then(checkDuplicateTrack)
    .then(addTrack)
    .then(notification)
    .then(() => {

    })
    .catch(errorHandler)
}

function addTrackToSavedTracks () {
  getCurrentTack()
    .then(checkDuplicateTrackInSavedTracks)
    .then(saveTrack)
    .then(notification)
    .then(() => {

    })
    .catch(errorHandler)
}

/**
 * HELPER METHODS
 */

/* ------------------------ Initial app ----------------------------- */
function getAccessToken () {
  return new Promise((resolve, reject) => {
    var authWindow = new BrowserWindow({ width: 800, height: 600, show: false, 'node-integration': false });
    authWindow.loadUrl(ACCESS_URL);
    // Display auth window for first time
    if (_.isEmpty(user)) {
      authWindow.show();
    }

    authWindow.webContents.on('did-get-redirect-request', (event, oldUrl, newUrl) => {
      handleCallback(newUrl);
    });

    function handleCallback (url) {
      // TODO : improve get hash
      var code = url.split('#')[1].substring(13, 292)
      // Set app variable accessToken
      accessToken = code
      // Set accessToken to spotifyApi
      spotifyApi.setAccessToken(accessToken)
      // TODO: close window
      authWindow.hide()
      resolve()
    }

    // Reset the authWindow on close
    authWindow.on('close', () => {
        authWindow = null;
    }, false);

  })
}

function getMe (data) {
  return new Promise((resolve, reject) => {
    if (!_.isEmpty(user)) {
      resolve()
    } else {
      spotifyApi.getMe()
        .then( data => {
          // Set app variable
          user = data.body
          // Save to DB
          db('user').push(user)
          resolve()
        }, reject );
    }
  })
}

function getPlaylists (argument) {
  return new Promise((resolve, reject) => {
    spotifyApi.getUserPlaylists(user.id)
      .then( data => {
        playlists = data.body
        resolve()
      }, reject )
  })
}


function getSelectedPlaylist () {
  return new Promise((resolve, reject) => {
    if (selectedPlaylist) {
      resolve(selectedPlaylist)
    } else {
      // Check if default playlist exists
      if ( playlists.items.find(x => x.name === DEFAULT_PLAYLIST_NAME) ) {
        selectedPlaylist = playlists.items.find(x => x.name === DEFAULT_PLAYLIST_NAME)
        db('selectedPlaylist').push(selectedPlaylist)
        console.log('Exists');
        resolve()
      } else {
        console.log('Create new');
        // Create new "SpotifyPlus" playlist 
        spotifyApi.createPlaylist(user.id, DEFAULT_PLAYLIST_NAME, { 'public' : false })
          .then( data => {
            // Add created to playlists
            playlists.push(data.body)
            // Set app variable
            selectedPlaylist = data.body
            // Save to Db
            db('selectedPlaylist').push(selectedPlaylist)
            console.log('Created playlist!');
            resolve()
          }, reject );
      }
    }
  })
}

/* -------- Add Track to playlist ---------- */
function getCurrentTack () {
  return new Promise((resolve, reject) => {
    spotifyPlayer.getTrack((err, current) => {
      if (err) reject(err)
      resolve(current)
    })
  })
}

function checkDuplicateTrack (current) {
  return new Promise((resolve, reject) => {
    // Get Tracks in Playlist
    spotifyApi.getPlaylistTracks(user.id, selectedPlaylist.id)
      .then( data => {
        // Check if duplicate track in playlist
        if (data.body.items.find(x => x.track.uri === current.id)) {
          reject('Duplicate in Playlist')
        }
        resolve(current)
      }, reject )
  })
}

function checkDuplicateTrackInSavedTracks (current) {
  return new Promise((resolve, reject) => {
    // uri => id
    current.id = current.id.substring(14)
    spotifyApi.containsMySavedTracks([current.id])
      .then( data => {
        var trackIsInYourMusic = data.body[0]
        if (trackIsInYourMusic) {
          reject('Duplicate in saved tracks')
        } else {
          resolve(current)
        }
      }, reject);
  })
}

function addTrack (current) {
  return new Promise((resolve, reject) => {
    spotifyApi.addTracksToPlaylist(user.id, selectedPlaylist.id, [current.id])
      .then( 
        () => resolve({
          current : current.name,
          type    : 'add'
        }), reject )
  })
}

function saveTrack (current) {
  return new Promise((resolve, reject) => {
    spotifyApi.addToMySavedTracks([current.id])
      .then( 
        () => resolve({
          current : current.name,
          type    : 'save'
        }), reject )
  })
}

function notification (data) {
  return new Promise((resolve, reject) => {
    var script = data.type === 'add'
    ? `display notification "😙 ${data.current} => ${selectedPlaylist.name} 🎵"  with title "Catify"
    delay 1`
    : `display notification "😙 ${data.current} => Saved Tracks 🎵"  with title "Catify" 
    delay 1`
    applescript.execString(script, (err, rtn) => {
      if (err) {
        reject(err)
      }
      resolve()
    });
  })
}


function errorHandler (err) {
  console.log('Err handler : ', err);
  // TODO: Handle refresh token
  if (err.statusCode === 401) {
    getAccessToken()
      .then(() => {
        console.log('Get new AccessToken');
      })
  }
}