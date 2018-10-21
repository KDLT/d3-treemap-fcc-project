import React, { Component } from 'react';
import { treemap, hierarchy, treemapResquarify } from 'd3-hierarchy';
import { schemePaired } from 'd3-scale-chromatic';
import { interpolateRgb } from 'd3-interpolate';
import { scaleOrdinal } from 'd3-scale';
import { select, selectAll, event } from 'd3-selection';
import { transition } from 'd3-transition';
import { format } from 'd3-format';

export default class Treemap extends Component {
  constructor(props) {
    super(props)
    this.state = {
    };
    this.createTreemap = this.createTreemap.bind(this);
    this.createLegend = this.createLegend.bind(this);
  };
  componentDidMount() {
    console.log('data in treemap mount:', this.props.data)
  };
  componentDidUpdate(prevProps, prevState) {
    // console.log('updated props: ', this.props);
    // console.log(prevProps.data + 'vs' + this.props.data);
    if (prevProps.data != this.props.data) {
      this.createTreemap(this.props.data)
    }
  };
  createTreemap(data) {
    console.log('creating treemap with data:\n', data);
    // selectAll("svg > *").remove();
    const node = this.node,
          rootNode = hierarchy(data) // MOVIES MUNA
            .eachBefore(d => {
              d.data.id = (d.parent ? d.parent.data.id + '.' : '') + d.data.name.split(' ').join('');
            })
            .sum(d => d.value)
            .sort((a,b) => (b.height - a.height || b.value - a.value)), // SUM IS THE BASIS OF THE RECT SIZES
          mapTree = treemap()
            .tile(treemapResquarify)
            .size([this.props.width, this.props.height])
            .round(true)
            .paddingInner(1);
    mapTree(rootNode);
    console.log('rootNode.leaves() after mapTree:', rootNode.leaves());
    
    const tooltip = select('#tooltip');

    const handleMouseover = (d) => {
      let name = d.data.name.split(/(?=[A-Z][^A-Z])/g).join(' '),
          dataType = d.data.id.match(/^[A-Z][a-z]+/g)[0],
          val = format(',d')(d.data.value),
          category = d.data.category;

      tooltip.transition()
        .duration(100)
        .style('opacity', 0.9)
        .style('transform', 'scale(1) translate(-70px, 0px)')
        .style('stroke', 'lightslategray')
      tooltip.html(tooltipBuilder(category, name, val, dataType))
        .attr('data-value', d.data.value)
    };
    const handleMouseMove = () => {
      tooltip.style('top', `${event.pageY}`)
        .style('left', event.pageX-70)
    };
    const handleMouseOut = () => {
      tooltip.transition()
        .duration(100)
        .style('opacity', 0)
        .style('transform', 'scale(0)')
        .style('stroke', 'none')
    };

    selectAll('.leaf-element').remove();
    
    let leafNodes = select(node).selectAll('.leaf-element')
      .data(rootNode.leaves())

    leafNodes.enter().append('g')
        .attr('class', 'leaf-element')
        .attr('data-name', d => d.data.name)
        .attr('data-category', d => d.data.category)
        .attr('data-value', d => d.data.value)
        .attr('transform', d => `translate(${d.x0}, ${d.y0})`)
          .append('rect')
          .attr('class', 'tile')
          .attr('id', d => d.data.id.split(' ').join(''))
          .attr('width', d => d.x1 - d.x0)
          .attr('height', d => d.y1 - d.y0)
          .attr('fill', d => fill(d.data.category)) // dating d.parent.data.id
          .on('mouseover', d => handleMouseover(d))
          .on('mousemove', handleMouseMove)
          .on('mouseout', handleMouseOut)
    selectAll('.leaf-element').append('clipPath')
      .attr('id', d => `clip-${d.data.id}`)
      .append('use')
        .attr('xlink:href', d => `#${d.data.id}`)
    selectAll('.leaf-element').append('text')
      .attr('clip-path', d => `url(#clip-${d.data.id})`)
      .selectAll('tspan')
      .data(d => d.data.name.split(' '))
      .enter().append('tspan')
        .attr('x', 4)
        .attr('y', (d,i) => (13 + i * 11))
        .text(d => d);
    
    const categories = removeDupes(rootNode.leaves().map(d => d.data.category));
    console.log('categories:', categories);
    this.createLegend(categories, 7, 20);
  };

  createLegend(categories, cols=10, size=20) {
    // console.log('creating legend with categories: ', categories)
    const nodeLegend = this.nodeLegend,nTotal = categories.length,
          squareSize = size,
          legendWidth = this.props.width * 2 / 3,
          nCols = cols,
          nRows = Math.ceil(nTotal / nCols),
          minX = (this.props.width - legendWidth) / 2,
          maxX = this.props.width - minX,
          colWidth = (maxX - minX) / (nCols - 1 ),
          rowHeight = squareSize * 2,
          colCoords = Array(nCols).fill(0).map((d,i) => (
            minX + i * colWidth
          )),
          rowCoords = Array(nRows).fill(0).map((d,i) => (
            squareSize + i * rowHeight
          ));
    // selectAll('#legend-group > .legend-category').remove(); // this removes all previous legends
    select('#legend-group').remove();

    let currentLegend = select(nodeLegend).append('g').attr('id', 'legend-group')
      .selectAll('.legend-category')
      .data(categories, d => d)

    // currentLegend.exit()
    // currentLegend.remove()

    // ITO PUTANG INA GUMAGANA NA 'TO PUTA, kaso may natitirang '#legend'
    // select('#legend-group').remove();

    currentLegend = currentLegend.enter()
      .append('g')
        .attr('class', 'legend-category')
        .append('rect')
        .merge(currentLegend)
          .attr('class', 'legend-item')
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
            .text(d => d) // dating d.match(/\w+$/g), no need kasi d.data.category na
    // currentLegend.exit().remove()
  };
  
  render() {
    return (
      <div className='treemap-container'>
        <svg id={`treemap-${this.props.data.id}`}
          className='treemap'
          ref={node => this.node = node}
          viewBox={`0 0 ${this.props.width} ${this.props.height}`}
          preserveAspectRatio='xMidYMid meet'/>
        <svg id='legend' ref={nodeLegend => this.nodeLegend = nodeLegend}
          viewBox={`0 0 ${this.props.width} ${this.props.height/3}`}
          preserveAspectRatio='xMidYMid meet'/>
        <div id='tooltip' style={{'opacity': 0}}></div>
      </div>
    )
  }
}

const getAncestorsArray = (id) => {
  // console.log('getAncestorsArray id: ', id);
  // console.log('dataArray: ', id.match(/([A-za-z0-9]+)(?=\.)/g));
  return (id.match(/([A-za-z0-9]+)(?=\.)/g));
};

const tooltipBuilder = (category, name, value, dataType) => {
  let categoryType = '';
  switch(dataType) {
    case 'Movies':
      categoryType = 'Genre'; break;
    case 'Video':
      categoryType = 'Platform'; break;
    case 'Kickstarter':
      categoryType = 'Category'; break;
    default:
      categoryType = 'Category'
  }
  return `
    Name:\t${name}<br/><br/>
    ${categoryType}:\t${category}<br/>
    gross:\t${value}
  `
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



