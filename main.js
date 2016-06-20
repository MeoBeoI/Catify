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
const querystring    = require('querystring')
const Url            = require('url')
const low            = require('lowdb')
const storage        = require('lowdb/file-sync')
const db             = low(__dirname + '/db.json', { storage })

// App variables
var user             = db('user').first()
var selectedPlaylist = db('selectedPlaylist').first()
var playlists        = {}
var accessToken      = ""

const CLIENT_ID             = 'b6dead381db24aee9825a6baf524e0f3'
const SECRET                = '9dc4b9daea024d1b87b231527d7b99b8'
const REDIRECT_URL          = 'http://meobeoi.com/catify/callback'
const SCOPES                = 'playlist-modify-private playlist-read-private playlist-modify-public user-library-read user-library-modify'
const STATE                 = '123'
const DEFAULT_PLAYLIST_NAME = "Catify"
const ACCESS_URL = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URL)}&scope=${encodeURIComponent(SCOPES)}&response_type=token&state=${STATE}`
const LOGOUT_URL = 'https://www.spotify.com/logout/'
const spotifyApi = new SpotifyWebApi({
  clientId     : CLIENT_ID,
  clientSecret : SECRET,
  redirectUri  : REDIRECT_URL
});

var mbOptions = {
  dir            : __dirname + '/app',
  icon           : __dirname + '/IconTemplate.png',
  tooltip        : "Catify",
  preloadWindow  : true, // TODO: enable if already logged in
  width          : 385,
  height         : 210,
  resizable      : true,
  // TODO        : Check this
  useContentSize : true
}
const menubar = require('menubar')
var mb        = menubar(mbOptions)
var debug     = process.env.NODE_ENV === 'development'

function initial () {
  mb.window.loadURL('file://' + __dirname + '/app/app.html')
  mb.window.on('focus', _sendFocusInput) 
  mb.window.on('show' , _sendFocusInput)

  // Renew accessToken
  setInterval(getAccessToken, 1000 * 3500)
}

crashReporter.start({
  productName: 'Catify',
  companyName: 'MeoBeoI',
  submitURL: 'http://codeconcat.com:3000/catify/crash',
  autoSubmit: true
});

function _sendFocusInput () {
  if (!mb.window) return
  mb.window.webContents.send('focus-input', '')
}

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
    .then(initial)
    .catch(errorHandler)

  // Set shortcut
  globalShortcut.register('ctrl + p + =', addTrackToPlaylist)
  globalShortcut.register('ctrl + p + -', removeTrackFromPlaylist);

  globalShortcut.register('ctrl + p + ]', addTrackToSavedTracks);
  globalShortcut.register('ctrl + p + [', removeTrackFromSaved);

  globalShortcut.register('ctrl + p + /', mb.showWindow);

});

/**p/p/
 * IPC handler
 */
ipcMain.on('initial', (event, message) => {
  var response = {
    user             : user,
    selectedPlaylist : selectedPlaylist,
    // TODO : Check why missing playlists[0]
    playlists        : JSON.stringify(playlists),
    accessToken      : accessToken
  }
  event.sender.send('main-initial', response);
});

ipcMain.on('search', (event, track) => {
  spotifyApi.searchTracks(track, {limit: 5})
  .then( data => {
    // Resize Window
    mb.window.setSize(385, 585)
    event.sender.send('main-search', data.body.tracks.items)
  }, errorHandler)
});

ipcMain.on('empty-search', (event, track) => {
  mb.window.setSize(385, 210)
});

ipcMain.on('playlistChanged', (event, message) => {
  selectedPlaylist = playlists.find(x => x.id === message)
});

ipcMain.on('playTrack', (event, track) => {
  spotifyPlayer.playTrack(track.uri, () => {  })
})

// TODO : Create setting page
ipcMain.on('setting', (event, track) => {
  var settingWindow = new BrowserWindow({
    width: 800, height: 600, show: false, 'node-integration': false,
    title: 'Setting'
  });
  settingWindow.loadURL('file://' + __dirname + '/setting.html')
  settingWindow.show()
  settingWindow.on('closed', () => {
    settingWindow = null;
  });
});

ipcMain.on('logout', (event, uri) => {
  // Drop all
  db.object = {}
  db.write()
  mb.window.loadURL(LOGOUT_URL)
  event.sender.send('main-logout')
});

/**
 * Functions
 */

function addTrackToPlaylist () {
  getCurrentTack()
    .then(checkDuplicateTrack)
    .then(addTrack)
    .then(notification)
    .catch(errorHandler)
}

function removeTrackFromPlaylist () {
  getCurrentTack()
    .then(removeTrackPlaylist)
    .then(notification)
    .catch(errorHandler)
}

function addTrackToSavedTracks () {
  getCurrentTack()
    .then(checkDuplicateTrackInSavedTracks)
    .then(saveTrack)
    .then(notification)
    .catch(errorHandler)
}

function removeTrackFromSaved () {
  getCurrentTack()
    .then(removeTrackSaved)
    .then(notification)
    .catch(errorHandler)
}

/**
 * HELPER METHODS
 */

/* ------------------------ Initial app ----------------------------- */
function getAccessToken() {
  return new Promise((resolve, reject) => {
    var authWindow = new BrowserWindow({ width: 800, height: 600, show: false, 'node-integration': false });
    authWindow.loadURL(ACCESS_URL);

    // Display auth window for first time
    // if (_.isEmpty(user)) {
      authWindow.show();
    // }
    // 
    // 
    authWindow.webContents.on('did-get-redirect-request', (event, oldUrl, newUrl) => {
      handleCallback(newUrl);
    });

    function handleCallback (url) {
      if (url.indexOf(REDIRECT_URL) !== -1 && Url.parse(url).hash) {
        // Get accessToken from Url && set app variable
        var hash  = Url.parse(url).hash.substr(1);
        accessToken = querystring.parse(hash).access_token;
        // Set accessToken to spotifyApi
        if (accessToken && accessToken.length > 50) {
          spotifyApi.setAccessToken(accessToken);
          // TODO: close window
          authWindow.hide();
          resolve();
        }
      }
    }

    // Reset the authWindow on close
    authWindow.on('close', () => {
        authWindow = null;
    }, false)
  })
}

function getMe (data) {
  return new Promise((resolve, reject) => {
    if (!_.isEmpty(user)) {
      resolve()
    }
    spotifyApi.getMe()
      .then( data => {
        // Set app variable
        user = data.body
        // Save to DB
        db('user').push(user)
        resolve()
      }, reject );
  })
}

function getPlaylists (argument) {
  return new Promise((resolve, reject) => {
    spotifyApi.getUserPlaylists(user.id)
      .then( data => {
        // Only get playlists of this user
        playlists = data.body.items.filter(item => item.owner.id === user.id)
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
      if ( playlists.find(x => x.name === DEFAULT_PLAYLIST_NAME) ) {
        selectedPlaylist = playlists.find(x => x.name === DEFAULT_PLAYLIST_NAME)
        db('selectedPlaylist').push(selectedPlaylist)
        resolve()
      } else {
        // Create new "Catify" playlist
        spotifyApi.createPlaylist(user.id, DEFAULT_PLAYLIST_NAME, { 'public' : false })
          .then( data => {
            // Add created playlist to playlists
            playlists.push(data.body)
            // Set app variable
            selectedPlaylist = data.body
            // Save to Db
            db('selectedPlaylist').push(selectedPlaylist)
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
      .then(() => resolve({
          current : current.name,
          type    : 'add'
        }), reject )
  })
}

function saveTrack (current) {
  return new Promise((resolve, reject) => {
    spotifyApi.addToMySavedTracks([current.id])
      .then(() => resolve({
          current : current.name,
          type    : 'save'
        }), reject )
  })
}

function removeTrackPlaylist (current) {
  return new Promise((resolve, reject) => {
    var tracks = { tracks : [{ uri : current.id }] }
    spotifyApi.removeTracksFromPlaylist(user.id, selectedPlaylist.id, tracks)
    .then(data => resolve({
        current : current.name,
        type    : 'removeTrackFromPlaylist'
      }), reject)
  })
}

function removeTrackSaved (current) {
  return new Promise((resolve, reject) => {
    spotifyApi.removeFromMySavedTracks([current.id.substring(14)])
    .then(data => resolve({
        current : current.name,
        type    : 'removeTrackFromSaved'
      }), reject)
  })
}


function notification (data) {
  return new Promise((resolve, reject) => {
    var script = '';
    switch(data.type) {
      case 'add' :
        script = `display notification "😙 ${data.current} => ${selectedPlaylist.name} 🎵"  with title "Catify"
    delay 1`
        break
      case 'save' :
        script = `display notification "😙 ${data.current} => Saved Tracks 🎵"  with title "Catify"
    delay 1`
        break
      case 'removeTrackFromPlaylist' :
      script = `display notification "😙 ${data.current} Removed 🎵"  with title "Catify"
    delay 1`
        break
      case 'removeTrackFromSaved' :
      script = `display notification "😙 ${data.current} Removed 🎵"  with title "Catify"
    delay 1`
        break
      default : break;
    }

    applescript.execString(script, (err, rtn) => {
      if (err) {
        reject(err)
      }
      resolve(data)
    });
  })
}


function errorHandler (err) {
  console.error('Err handler : ', err);
}