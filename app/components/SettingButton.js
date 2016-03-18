import React, { Component } from 'react';
import { ipcRenderer }      from 'electron';
import styles               from './SettingButton.css';
import Setting              from 'material-ui/lib/svg-icons/action/settings';

export default class SettingButton extends Component {
  constructor(props) {
    super(props);
    this.state = {

    }
  }

  settingButtonClickHandler = (event, value) => {
    ipcRenderer.send('setting', '')
    ipcRenderer.on('main-pause', (event, value) => {

    })
  }

  render() {
    return (
      <Setting onClick={this.settingButtonClickHandler} className={styles.settingBtn}/>
    );
  }
}
