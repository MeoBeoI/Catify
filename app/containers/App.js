import React, { Component, PropTypes } from 'react';
import PlaylistSelector     from '../components/PlaylistSelector';
import SearchArea           from '../components/SearchArea';
import SettingButton        from '../components/SettingButton';
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

export default class App extends Component {
  render() {
    return (
      <div className="app">
        <PlaylistSelector />
        <SearchArea />
        <SettingButton />
      </div>
    );
  }
}
