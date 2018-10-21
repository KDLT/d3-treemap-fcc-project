import React, { Component } from 'react';
import { render } from 'react-dom';
import { json } from 'd3-fetch';

import Treemap from './components/Treemap';

import './styles/main.scss'

const link = {
  movies: 'https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/movie-data.json',
  games: 'https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/video-game-sales-data.json',
  kickstarters: 'https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/kickstarter-funding-data.json',
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: {
        movies: [],
        games: [],
        kickstarters: []
      },
      activeData: 'movies',
      title: '',
      subtitle: '',
      w: 1200,
      h: 500,
    };
    this.fetchData = this.fetchData.bind(this);
    this.changeData = this.changeData.bind(this);
    this.generateHeading = this.generateHeading.bind(this);
  }
  componentDidMount() {
    for (let i in link) this.fetchData(link[i]);
  }
  componentDidUpdate(prevProps, prevState) {
    if (prevState.data.kickstarters.length == 0 && this.state.data.kickstarters.name) {
      this.setState({ activeData: 'movies' }); // movies is the default display on first load
      this.generateHeading(this.state.activeData);
    };
  };
  fetchData(address) {
    console.log('fetching ' + address);
    json(address, (error, data) => { if (error) throw error })
      .then(data => {
        // console.log(data.name.match(/\w+/g)[0]);
        switch(data.name.match(/\w+/g)[0]) {
          case 'Video':
            return this.setState({ data: { ...this.state.data, games: data } });
          case 'Kickstarter':
            return this.setState({ data: { ...this.state.data, kickstarters: data} });
          case 'Movies':
            return this.setState({ data: { ...this.state.data, movies: data } });
          default: return
        }
      })
  };
  changeData(e) {
    this.setState({ activeData: e.target.value })
    this.generateHeading(e.target.value)
  };
  generateHeading(type){
    let h1 = '', h2 = '';
    switch (type) {
      case 'movies':
        h1 = 'Movie Sales', h2 = 'Top 100 Highest Grossing Movies Grouped By Genre';
        return this.setState({ title: h1, subtitle: h2 })
      case 'games':
        h1 = 'Video Game Sales', h2 = 'Top 100 Most Sold Video Games Grouped by Platform';
        return this.setState({ title: h1, subtitle: h2 })
      case 'kickstarters':
        h1 = 'Kickstarter Pledges', h2 = 'Top 100 Most Pledged Kickstarter Campaigns Grouped By Category';
        return this.setState({ title: h1, subtitle: h2 })
      default:
        return
    };
  }
  render() {
    return(
      <div id='main-container'>
        <h1 id='chart-title'>{this.state.title}</h1>
        <h3 id='chart-subtitle'>{this.state.subtitle}</h3>
        <input type="radio" name="datatype" 
          value={'movies'} id='movies'
          checked={this.state.activeData == 'movies'} 
          onChange={this.changeData} />
        <label htmlFor='movies'>Movies</label>
        <input type="radio" name="datatype" 
          value={'kickstarters'} id='kickstarters'
          checked={this.state.activeData == 'kickstarters'} 
          onChange={this.changeData} />
        <label htmlFor='kickstarters'>Kickstarters</label>
        <input type="radio" name="datatype" 
          value={'games'} id='games'
          checked={this.state.activeData == 'games'} 
          onChange={this.changeData} />
        <label htmlFor='games'>Games</label>
        <Treemap 
          height={this.state.h} 
          width={this.state.w}
          data={this.state.data[this.state.activeData]}/>
      </div>
    )
  };
};

render(
  <App />,
  document.getElementById('root')
);