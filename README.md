# Catify
Utility for Spotifty, even your cat can use **Spotify** now !
- Show Catify: <kbd>Ctrl</kbd> <kbd>P</kbd> <kbd>/</kbd> ( default )
- Play track on search results: <kbd>Ctrl</kbd> <kbd>Number</kbd>
- Save to library  : <kbd>Ctrl</kbd> <kbd>P</kbd> <kbd>]</kbd> ( default )
- Remove from library  : <kbd>Ctrl</kbd> <kbd>P</kbd> <kbd>[</kbd> ( default )
- Save to Playlist : <kbd>Ctrl</kbd> <kbd>P</kbd> <kbd>=</kbd> ( default )
- Remove from Playlist : <kbd>Ctrl</kbd> <kbd>P</kbd> <kbd>-</kbd> ( default )

## Screenshot

![]()

## Install

First, clone the repo via git:

```bash
git clone https://github.com/MeoBeoI/Catify.git
```

And then install dependencies.

```bash
$ cd Catify && npm install
```


## Run

Run this two commands __simultaneously__ in different console tabs.

```bash
$ npm run hot-server
$ npm run start-hot
```

or run two servers with one command

```bash
$ npm run dev
```

*Note: requires a node version >= 4 and an npm version >= 2.*

#### Toggle Chrome DevTools

- OS X: <kbd>Cmd</kbd> <kbd>Alt</kbd> <kbd>I</kbd> or <kbd>F12</kbd>
- Windows: <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>I</kbd> or <kbd>F12</kbd>

*See [electron-debug](https://github.com/sindresorhus/electron-debug) for more information.*


## CSS Modules

This boilerplate out of the box is configured to use [css-modules](https://github.com/css-modules/css-modules).

All `.css` file extensions will use css-modules unless it has `.global.css`.

If you need global styles, stylesheets with `.global.css` will not go through the
css-modules loader. e.g. `app.global.css`


## Package

```bash
$ npm run package
```

To package apps for all platforms:

```bash
$ npm run package-all
```

#### Options

- --name, -n: Application name (default: Catify)
- --icon, -i: Application icon
- --all: pack for all platforms

Use `electron-packager` to pack your app with `--all` options for darwin (osx), linux and win32 (windows) platform. After build, you will find them in `release` folder. Otherwise, you will only find one for your os.

## Maintainers

- [MeoBeoI](https://github.com/meobeoi)

## License
MIT 

## Related resource
- [electron-react-boilerplate](https://github.com/chentsulin/electron-react-boilerplate)
- [material-ui](http://www.material-ui.com)

