import Ember from 'ember';
import d3 from 'npm:d3';
import slug from '../utils/slug';
import fuelTypes from '../utils/fuel-types';

export default Ember.Component.extend({

  /**
   * Services
   */

  colorManager: Ember.inject.service(),


  /**
   * Members
   */

  tagName: '',
  normalizedTitle: null,
  metric: null,

  chartOptions: {
    width: 400,
    height: 400,
    numTicks: 3,
    transitionDuration: 200,
  },


  /**
   * Methods
   */

  init() {
    this._super(...arguments) ;

    this.set('normalizedTitle', slug(this.get('title')).normalize());
  },

  didInsertElement() {
    this._super(...arguments);

    const { width, height } = this.get('chartOptions');

    d3.select(`#${this.get('normalizedTitle')}`)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width/2},${height/2})`);
  },

  didRender() {
    this._super(...arguments);

    const { width, height, transitionDuration } = this.get('chartOptions');
    const colors = this.get('colorManager').colors;
    const metric = this.get('metric');
    const minDim = Math.min(width, height);

    const color = d3.scaleOrdinal([colors.lightGreen, colors.lightPurple, colors.orange]);

    const arc = d3.arc()
                  .innerRadius(minDim/3.5)
                  .outerRadius(minDim/2);

    const pie = d3.pie()
                  .sort(null)
                  .value(d => d.percent);

    const svg = d3.select(`#${this.get('normalizedTitle')}`).select('svg').select('g');

    const data = Ember.copy(this.get('data'), true);

    fuelTypes.forEach(type => data[0][`${type}_tot`] = 0);

    // Aggregate totals for each fuel type
    let totals = {};
    if (data.length > 1) {
      totals = data.reduce((aggregate, current) => {
        fuelTypes.forEach(type => aggregate[`${type}_tot`] += parseFloat(current[`${type}_${metric}`]));
        return aggregate;
      });
    }
    else {
      fuelTypes.forEach(type => totals[`${type}_tot`] = parseFloat(data[0][`${type}_${metric}`]));
    }

    // Get total for all fuel consumption
    data.cent = fuelTypes.map(type => totals[`${type}_tot`]).reduce((x, y) => x + y);

    const results = fuelTypes.map(type => {
      return {
        fuel_type: type,
        percent: totals[`${type}_tot`] / data.cent,
        mmbtu: totals[`${type}_tot`],
      };
    });

    // Start composing chart
    let path = svg.selectAll('path').data(pie(results));

    path.enter()
        .append('path')
        .attr('d', arc)
        .style('fill', d => color(d.data.fuel_type))
        .each(function(d) {this._current = d});

    path.transition()
        .duration(transitionDuration)
        .attrTween('d', function(a) {
          const i = d3.interpolate(this._current, a);
          this._current = i(0);
          return function(t) { return arc(i(t)) };
        });

    /*
    g.append('text')
      .attr('transform', d => {
        console.log(d);
        console.log(arc.centroid(d));
        return `translate(${arc.centroid(d)})`
      })
      .attr('dy', '.35em')
      .style('text-anchor', 'middle')
      .text(d => d.data.fuel_type);
    */

    /*
    const sdat = [];
    [...Array(chartOptions.numTicks).keys()].forEach(i => sdat[i] = 20 + ((radius/chartOptions.numTicks) * i));

    const circleAxes = svg.selectAll('.circle-ticks')
                          .data(sdat)
                          .enter()
                          .append('svg:g')
                          .attr('class', 'circle-ticks');

    circleAxes.append('svg:circle')
              .attr('r', String)
              .attr('class', 'circle')
              .style('stroke', '#CCC')
              .style('opacity', 0.5)
              .style('fill', 'none');

    circleAxes.append('svg:text')
              .attr('text-anchor', 'center')
              .attr('dy', d => d - 5)
              .style('fill', '#FFF')
              .text((d, i) => i * (100/chartOptions.numTicks));
    */
  }

});
