import React, { Component } from 'react';
import injectTapEventPlugin from 'react-tap-event-plugin';
import PlaylistSelector     from '../components/PlaylistSelector';
import SearchArea           from '../components/SearchArea';
import SettingButton        from '../components/SettingButton';
import styles               from './App.css';
injectTapEventPlugin();

export default class App extends Component {
  render() {
    return (
      <div className="app">
        <div>
          <SettingButton />
          <PlaylistSelector />
        </div>
        <SearchArea />
      </div>
    );
  }
}
