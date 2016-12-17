import React, { Component }    from 'react';
import { ipcRenderer }         from 'electron';
import Setting                 from 'material-ui/lib/svg-icons/action/settings';
import Popover                 from 'material-ui/lib/popover/popover';
import PopoverAnimationFromTop from 'material-ui/lib/popover/popover-animation-from-top';
import Menu                    from 'material-ui/lib/menus/menu';
import MenuItem                from 'material-ui/lib/menus/menu-item';
import styles                  from './SettingButton.css';

export default class SettingButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      anchorOrigin: {
        horizontal: 'left',
        vertical: 'bottom',
      },
      targetOrigin: {
        horizontal: 'left',
        vertical: 'top',
      }
    };
  }

  logoutHandler(event, value) {
    ipcRenderer.send('logout');
  }

  aboutHandler(event, value) {
    open("https://github.com/MeoBeoI/Catify");
  }

  handleTouchTap(event) {
    this.setState({
      open: true,
      anchorEl: event.currentTarget,
    });
  }

  handleRequestClose() {
    this.setState({
      open: false,
    });
  }

  render() {
    return (
      <div>
        <Setting onClick={this.handleTouchTap} className={styles.settingBtn}/>
        <Popover
          open={this.state.open}
          anchorEl={this.state.anchorEl}
          anchorOrigin={this.state.anchorOrigin}
          targetOrigin={this.state.targetOrigin}
          onRequestClose={this.handleRequestClose}
          animation={PopoverAnimationFromTop}
        >
          <Menu>
            <MenuItem primaryText="Setting" />
            <MenuItem primaryText="About" onClick={this.aboutHandler} />
            <MenuItem primaryText="Logout" onClick={this.logoutHandler} />
          </Menu>
        </Popover>
      </div>
    );
  }
}
