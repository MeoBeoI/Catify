import React, { Component } from 'react';
import FloatingActionButton from 'material-ui/lib/floating-action-button';
import AvPlayArrow          from 'material-ui/lib/svg-icons/av/play-arrow';
import styles from './MediaPlayer.css';

const style = {
  marginRight: 40
}; 

export default class MediaPlayer extends Component {
  constructor(props) {
    super(props);
    this.state = {value: 3};
  }
  handleChange = (event, index, value) => this.setState({value});

  render() {
    return (
      <div className={styles.mediaPlayer}>
        <div className={styles.floatBtn}>
          <FloatingActionButton>
            <AvPlayArrow />
          </FloatingActionButton>
        </div>
      </div>
    );
  }
}
