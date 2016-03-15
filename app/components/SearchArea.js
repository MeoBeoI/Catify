import React, { Component } from 'react';
import TextField            from 'material-ui/lib/text-field';
import List                 from 'material-ui/lib/lists/list';
import ListItem             from 'material-ui/lib/lists/list-item';
import $                    from 'jquery';
import _                    from 'lodash'
import {debounce}           from 'throttle-debounce';
import {ipcRenderer}        from 'electron';
import AvPlayArrow          from 'material-ui/lib/svg-icons/av/play-arrow';
import Avatar               from 'material-ui/lib/avatar';

export default class SearchArea extends Component {
  constructor() {
    super();
    this.state = {
      results : []
    };
    this.doSearch = debounce(500, this.doSearch)
  }

  onChange(e) { 
    if(e.key === 'Enter'){
      this.playTrack(this.state.results[0])
    } else {
      this.doSearch(e.target.value)  
    }
  }

  doSearch(value) {
    if (!value) {
      this.setState({ results : [] })
    } else {
      ipcRenderer.send('search', value)
      ipcRenderer.on('main-search', (event, response) => {  
        this.setState({ results : response })
      })
    }
  }

  playTrack(track) {
    ipcRenderer.send('playTrack', track.uri)
  }

  render() {
    return (
      <div className="search-area">
        <TextField floatingLabelText="Search" onKeyUp={this.onChange.bind(this)} />
        {(() => 
        (!_.isEmpty(this.state.results)) ?
        <List>
          {this.state.results.map( result => 
            <ListItem 
              primaryText={result.name} 
              secondaryText={result.artists[0].name}
              leftAvatar={<Avatar src={result.album.images[0].url} />}
              rightIcon={<AvPlayArrow />}
              onClick={this.playTrack.bind(null, result)} /> 
          )}
        </List>
        : " "
        )()}
      </div>
    );
  }
}
