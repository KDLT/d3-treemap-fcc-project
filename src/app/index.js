import React, { Component } from 'react';
import { render } from 'react-dom';
import { json } from 'd3-fetch';
import { treemap, hierarchy, treemapResquarify } from 'd3-hierarchy';
import { schemePaired } from 'd3-scale-chromatic';
import { interpolateRgb } from 'd3-interpolate';
import { scaleOrdinal } from 'd3-scale';
import { select, selectAll, event }from 'd3-selection';
import { transition } from 'd3-transition';
import { format } from 'd3-format';

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
        kickstarters: []
      },
      w: 1200,
      h: 500,
    };
    this.createTreemap = this.createTreemap.bind(this);
    this.fetchData = this.fetchData.bind(this);
    this.createLegend = this.createLegend.bind(this);
    this.changeData = this.changeData.bind(this);
  }
  componentDidMount() {
    for (let i in link) this.fetchData(link[i]);
  }
  componentDidUpdate(prevProps, prevState) {
    console.log('updated state: ', this.state);
    // console.log('prev', prevState.data.kickstarter, 'current', this.state.data.kickstarter)
    if (prevState.data.kickstarters.length == 0 && this.state.data.kickstarters.name) {
      // last na malalagyan ng data ang kickstarter based sa arrangement ng link object
      this.createTreemap(this.state.data.movies  ) // movies default display
    }
  }
  fetchData(address) {
    console.log('fetching ' + address);
    json(address, (error, data) => { if (error) throw error })
      .then(data => {
        console.log(data.name.match(/\w+/g)[0]);
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
  createTreemap(data) {
    console.log('creating treemap...');
    const node = this.node,
          rootNode = hierarchy(data) // MOVIES MUNA
            .eachBefore(d => {d.data.id = (d.parent ? d.parent.data.id + '.' : '') + d.data.name})
            .sum(d => d.value)
            .sort((a,b) => (b.height - a.height || b.value - a.value)), // SUM IS THE BASIS OF THE RECT SIZES
          mapTree = treemap()
            .tile(treemapResquarify)
            .size([this.state.w, this.state.h])
            .round(true)
            .paddingInner(1);
    // console.log(rootNode);
    // console.log({ dataMovies, dataKickstarter, dataGames });
    // console.log('fill in createTreemap: ', fill);
    mapTree(rootNode);

    const tooltip = select('#tooltip');

    const handleMouseover = (d) => {
      let name = d.data.name.split(/(?=[A-Z][^A-Z])/g).join(' ');
      let id = d.data.id;
      let val = format(',d')(d.data.value);
      let ancestorsArray = getAncestorsArray(id);

      tooltip.transition()
        .duration(100)
        .style('opacity', 0.9)
        .style('transform', 'scale(1) translate(-50px, -118px)')
        .style('stroke', 'lightslategray')
      tooltip.html(tooltipBuilder(ancestorsArray, name, val))
    };
    const handleMouseMove = () => {
      tooltip.style('top', `${event.pageY}`)
        .style('left', event.pageX)
    };
    const handleMouseOut = () => {
      tooltip.transition()
        .duration(100)
        .style('opacity', 0)
        .style('transform', 'scale(0)')
        .style('stroke', 'none')
    };

    select(node).selectAll('g')
      .attr('id', 'cell')
      .data(rootNode.leaves())
      .enter().append('g')
        .attr('class', 'leaf')
        .attr('transform', d => `translate(${d.x0}, ${d.y0})`)
          .append('rect')
          .attr('id', d => d.data.id)
          .attr('width', d => d.x1 - d.x0)
          .attr('height', d => d.y1 - d.y0)
          .attr('fill', d => fill(d.parent.data.id))
          .on('mouseover', d => handleMouseover(d))
          .on('mousemove', handleMouseMove)
          .on('mouseout', handleMouseOut)
    selectAll('g').append('clipPath')
      .attr('id', d => `clip-${d.data.id}`)
      .append('use')
        .attr('xlink:href', d => `#${d.data.id}`)
    selectAll('g').append('text')
      .attr('clip-path', d => `url(#clip-${d.data.id})`)
      .selectAll('tspan')
      .data(d => d.data.name.split(' '))
      .enter().append('tspan')
        .attr('x', 4)
        .attr('y', (d,i) => (13 + i * 11))
        .text(d => d);

    const categories = removeDupes(rootNode.leaves().map(d => d.parent.data.id));
    this.createLegend(categories, 7, 20);
  };
  createLegend(categories, cols=10, size=20) {
    // console.log('creating legend with categories: ', categories)
    const nodeLegend = this.nodeLegend,nTotal = categories.length,
          squareSize = size,
          legendWidth = this.state.w * 2 / 3,
          nCols = cols,
          nRows = Math.ceil(nTotal / nCols),
          minX = (this.state.w - legendWidth) / 2,
          maxX = this.state.w - minX,
          colWidth = (maxX - minX) / (nCols - 1 ),
          rowHeight = squareSize * 1.5,
          colCoords = Array(nCols).fill(0).map((d,i) => (
            minX + i * colWidth
          )),
          rowCoords = Array(nRows).fill(0).map((d,i) => (
            squareSize + i * rowHeight
          ));
    // console.log({colCoords});
    select(nodeLegend).append('g')
      .attr('id', 'legend')
      .selectAll('g')
      .data(categories).enter()
      .append('g')
        .attr('class', 'legend-category')
        .append('rect')
          .attr('class', 'legend-color')
          .attr('height', squareSize)
          .attr('width', squareSize)
          .attr('x', (d,i) => colCoords[Math.floor(i % nCols)])
          .attr('y', (d,i) => rowCoords[Math.floor(i / nCols)])
          .attr('fill', d => fill(d)) // d is full parent address, e.g., Movies.Action
          .attr('data-category', d => d)
    selectAll('.legend-category')
      .append('text')
        .attr('class', 'legend-text')
        .attr('x', (d,i) => colCoords[Math.floor(i % nCols)])
        .attr('y', (d,i) => rowCoords[Math.floor(i / nCols)])
        .attr('transform', `translate(${squareSize/2}, -3)`)
        .text(d => d.match(/\w+$/g))
  };
  changeData() {
    this.createTreemap(this.state.data.kickstarters)
  }
  render() {
    return(
      <div id='main-container'>
        <h1>Treemap na</h1>
        <button id='changeData' onClick={this.changeData}>changeData</button>
        <svg id='treemap' ref={node => this.node = node}
          viewBox={`0 0 ${this.state.w} ${this.state.h}`}
          preserveAspectRatio='xMidYMid meet'/>
        <svg id='legend' ref={nodeLegend => this.nodeLegend = nodeLegend}
          viewBox={`0 0 ${this.state.w} ${this.state.h}`}
          preserveAspectRatio='xMidYMid meet'/>
        <div id='tooltip' style={{'opacity': 0}}></div>
      </div>
    )
  };
};

render(
  <Treemap />,
  document.getElementById('root')
);

const getAncestorsArray = (id) => {
  // console.log('getAncestorsArray id: ', id);
  // console.log('dataArray: ', id.match(/([a-z]+)(?=\.)/g));
  return (id.match(/([A-z]+)(?=\.)/g));
};

const tooltipBuilder = (ancestorsArray, name, value) => {
  let ancestring = '',
    generation = ancestorsArray.length;
  for (let i of ancestorsArray.reverse()) {
    generation--;
    if (generation == ancestorsArray.length - 1) {
      ancestring += 'Category:\t' + i + '<br/>';
    } else ancestring += 'Gen ' + generation + ':\t' + i + '<br/>';
  }
  return 'Name:\t' + name + '<br/><br/>' + ancestring + '<br/>gross:\t$' + value;
};

const removeDupes = (unfiltered) => {
  let seen = [];
  unfiltered.filter(d => {
    seen.includes(d) ? false : seen.push(d)
  })
  return seen;
}; 

let fadedSchemePaired = schemePaired.map(clr => interpolateRgb(clr, '#fff')(0.3));
const fill = scaleOrdinal(fadedSchemePaired);
// console.log('fill outside', fill);