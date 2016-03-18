import React, { Component } from 'react';
import FloatingActionButton from 'material-ui/lib/floating-action-button';
import AvPlayArrow          from 'material-ui/lib/svg-icons/av/play-arrow';
import Pause                from 'material-ui/lib/svg-icons/av/pause';
import LinearProgress       from 'material-ui/lib/linear-progress';
import { ipcRenderer }      from 'electron';
import styles               from './MediaPlayer.css';

export default class MediaPlayer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      playerState : 'PAUSE',
      current     : 0,
      count       : 0,
      track       : {},
      artist      : ''
    };

    ipcRenderer.on('main-play-track', (event, response) => {
      this.setState({ 
        playerState : 'PLAY',
        track       : response,
        artist      : response.artists[0].name,
        current     : 0,
        count       : 0,
      })

      // var checkPlayer = setInterval(() => {
      //   this.setState({ 
      //     count: this.state.count + 1,
      //     current: ( this.state.count / ( response.duration_ms / 1000 )) * 100
      //   })
      //   if (this.state.current >= 100){
      //     clearInterval(checkPlayer)
      //   }
      // }, 1000)
      
    })
  }

  handleChange = (event, index, value) => this.setState({value})

  pauseClickHandler = (event, value) => {
    ipcRenderer.send('pause', '')
    ipcRenderer.on('main-pause', (event, value) => {
      this.setState({ playerState : 'PAUSE' })
    })
  }

  playClickHandler = (event, value) => {
    ipcRenderer.send('resume', '')
    ipcRenderer.on('main-resume', (event, value) => {
      this.setState({ playerState : 'PLAY' })
    })
  }

  render() {
    return (
      <div className={styles.mediaPlayer}>
        <LinearProgress mode="determinate" value={this.state.current}/>
        <h5>{this.state.track.name} - {this.state.artist}</h5>
        <div className={styles.floatBtn}>
          {(() => 
            (this.state.playerState === 'PLAY')
            ? <FloatingActionButton onMouseDown={this.pauseClickHandler} ><Pause/></FloatingActionButton>
            : <FloatingActionButton onMouseDown={this.playClickHandler} ><AvPlayArrow/></FloatingActionButton>
          )()}
        </div>
      </div>
    );
  }
}
