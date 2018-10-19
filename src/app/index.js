import React, { Component } from 'react';
import { render } from 'react-dom';
import { json } from 'd3-fetch';

import './styles/main.scss'

const link = {
  movies: 'https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/movie-data.json',
  games: 'https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/video-game-sales-data.json',
  kickstarters: 'https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/kickstarter-funding-data.json',
}

class Treemap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: {
        movies: [],
        games: [],
        kickstarter: []
      },
      w: 1200,
      h: 500,
    };
    this.createTreemap = this.createTreemap.bind(this);
    this.fetchData = this.fetchData.bind(this);
  }
  componentDidMount() {
    for (let i in link) this.fetchData(link[i]);
  }
  componentDidUpdate(prevProps, prevState) {
    // console.log('updated state: ', this.state);
    // console.log('prev', prevState.data.kickstarter, 'current', this.state.data.kickstarter)
    if (prevState.data.kickstarter.length == 0 && this.state.data.kickstarter.name) {
      // last na malalagyan ng data ang kickstarter based sa arrangement ng link object
      this.createTreemap(this.state.data)
    }
  }
  fetchData(address) {
    console.log('fetching ' + address);
    json(address, (error, data) => {
      if (error) throw error
    })
      .then(data => {
        console.log(data.name.match(/\w+/g)[0]);
        switch(data.name.match(/\w+/g)[0]) {
          case 'Video':
            return this.setState({ data: { ...this.state.data, games: data } });
          case 'Kickstarter':
            return this.setState({ data: { ...this.state.data, kickstarter: data} });
          case 'Movies':
            return this.setState({ data: { ...this.state.data, movies: data } });
          default: return
        }
      })
  };
  createTreemap(data) {
    console.log('creating treemap...');
    const dataMovies = data.movies,
          dataKickstarter = data.kickstarter,
          dataGames = data.games;
    console.log({ dataMovies, dataKickstarter, dataGames });
  };
  render() {
    return(
      <div id='main-container'>
        <h1>not yet a treemap</h1>
      </div>
    )
  };
};

render(
  <Treemap />,
  document.getElementById('root')
);