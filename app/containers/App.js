import React, { Component, PropTypes } from 'react';
import PlaylistSelector     from '../components/PlaylistSelector';
import MediaPlayer          from '../components/MediaPlayer';
import SearchArea           from '../components/SearchArea';
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

export default class App extends Component {
  render() {
    return (
      <div className="app">
        <PlaylistSelector />
        <SearchArea />
        <MediaPlayer />
      </div>
    );
  }
}
