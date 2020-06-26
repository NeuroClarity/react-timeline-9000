'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import moment from 'moment';
import {intToPix} from '../utils/commonUtils';
import {timebarFormat as defaultTimebarFormat} from '../consts/timebarConsts';

/**
 * Timebar component - displays the current time on top of the timeline
 */
export default class Timebar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.guessResolution = this.guessResolution.bind(this);
    this.renderBar = this.renderBar.bind(this);
    this.renderTopBar = this.renderTopBar.bind(this);
    this.renderBottomBar = this.renderBottomBar.bind(this);
  }

  componentWillMount() {
    this.guessResolution();
  }

  /**
   * On new props we check if a resolution is given, and if not we guess one
   * @param {Object} nextProps Props coming in
   */
  componentWillReceiveProps(nextProps) {
    if (nextProps.top_resolution && nextProps.bottom_resolution) {
      this.setState({resolution: {top: nextProps.top_resolution, bottom: nextProps.bottom_resolution}});
    } else {
      this.guessResolution(nextProps.start, nextProps.end);
    }
  }

  /**
   * Attempts to guess the resolution of the top and bottom halves of the timebar based on the viewable date range.
   * Sets resolution to state.
   * @param {moment} start Start date for the timebar
   * @param {moment} end End date for the timebar
   */
  guessResolution(start, end) {
    if (!start || !end) {
      start = this.props.start;
      end = this.props.end;
    }
    const durationSecs = end.diff(start, 'seconds');
    if (durationSecs >= 100) {
      this.setState({resolution: {top: '', bottom: 'minute'}});
    } else {
      this.setState({resolution: {top: 'minute', bottom: 'second'}});
    }
  }

  /**
   * Renderer for top bar.
   * @returns {Object} JSX for top menu bar - based of time format & resolution
   */
  renderTopBar() {
    let res = this.state.resolution.top;
    return this.renderBar({format: this.props.timeFormats.majorLabels[res], type: res});
  }
  /**
   * Renderer for bottom bar.
   * @returns {Object} JSX for bottom menu bar - based of time format & resolution
   */
  renderBottomBar() {
    let res = this.state.resolution.bottom;
    return this.renderBar({format: this.props.timeFormats.minorLabels[res], type: res});
  }

  /**
   * Gets the number of pixels per segment of the timebar section (using the resolution)
   * @param {moment} date The date being rendered. This is used to figure out how many days are in the month
   * @param {string} resolutionType Timebar section resolution [Year; Month...]
   * @returns {number} The number of pixels per segment
   */
  getPixelIncrement(date, resolutionType, offset = 0) {
    const {start, end} = this.props;
    const width = this.props.width - this.props.leftOffset;

    const start_end_sec = end.diff(start, 'seconds');
    const pixels_per_sec = width / start_end_sec;
    let inc = width;
    switch (resolutionType) {
      case 'minute':
        inc = pixels_per_sec * (60 - offset);
        break;
      case 'second':
        inc = pixels_per_sec - offset;
        break;
      default:
        inc = pixels_per_sec - offset;
        break;
    }
    return Math.min(inc, width);
  }

  /**
   * Renders an entire segment of the timebar (top or bottom)
   * @param {string} resolution The resolution to render at [Year; Month...]
   * @returns {Object[]} A list of sections (making up a segment) to be rendered
   * @property {string} label The text displayed in the section (usually the date/time)
   * @property {boolean} isSelected Whether the section is being 'touched' when dragging/resizing
   * @property {number} size The number of pixels the segment will take up
   * @property {number|string} key Key for react
   */
  renderBar(resolution) {
    const {start, end, selectedRanges} = this.props;
    const width = this.props.width - this.props.leftOffset;

    let currentDate = start.clone();
    let timeIncrements = [];
    let pixelsLeft = width;
    let labelSizeLimit = 60;

    function _addTimeIncrement(initialOffset, offsetType, stepFunc) {
      let offset = null;
      while (currentDate.isBefore(end) && pixelsLeft > 0) {
        // if this is the first 'block' it may be cut off at the start
        if (pixelsLeft === width) {
          offset = initialOffset;
        } else {
          offset = moment.duration(0);
        }
        let pixelIncrements = Math.min(
          this.getPixelIncrement(currentDate, resolution.type, offset.as(offsetType)),
          pixelsLeft
        );
        const labelSize = pixelIncrements < labelSizeLimit ? 'short' : 'long';
        let label = currentDate.format(resolution.format[labelSize]);
        let isSelected = _.some(selectedRanges, s => {
          return (
            currentDate.isSameOrAfter(s.start.clone().startOf(resolution.type)) &&
            currentDate.isSameOrBefore(s.end.clone().startOf(resolution.type))
          );
        });
        timeIncrements.push({label, isSelected, size: pixelIncrements, key: pixelsLeft});
        stepFunc(currentDate, offset);
        pixelsLeft -= pixelIncrements;
      }
    }

    const addTimeIncrement = _addTimeIncrement.bind(this);

    if (resolution.type === 'minute') {
      addTimeIncrement(moment.duration(0), 'minutes', (currentDt, offst) => currentDt.add(1, 'minutes'));
    } else if (resolution.type === 'second') {
      addTimeIncrement(moment.duration(0), 'seconds', (currentDt, offst) => currentDt.add(1, 'seconds'));
    }
    return timeIncrements;
  }

  /**
   * Renders the timebar
   * @returns {Object} Timebar component
   */
  render() {
    const {cursorTime} = this.props;
    const topBarComponent = this.renderTopBar();
    const bottomBarComponent = this.renderBottomBar();
    const GroupTitleRenderer = this.props.groupTitleRenderer;

    // Only show the cursor on 1 of the top bar segments
    // Pick the segment that has the biggest size
    let topBarCursorKey = null;
    if (topBarComponent.length > 1 && topBarComponent[1].size > topBarComponent[0].size)
      topBarCursorKey = topBarComponent[1].key;
    else if (topBarComponent.length > 0) topBarCursorKey = topBarComponent[0].key;

    return (
      <div className="rct9k-timebar">
        <div className="rct9k-timebar-group-title" style={{width: this.props.leftOffset}}>
          <GroupTitleRenderer />
        </div>
        <div className="rct9k-timebar-outer" style={{width: this.props.width, paddingLeft: this.props.leftOffset}}>
          <div className="rct9k-timebar-inner rct9k-timebar-inner-top">
            {_.map(topBarComponent, i => {
              let topLabel = i.label;
              if (cursorTime && i.key === topBarCursorKey) {
                topLabel += ` [${cursorTime}]`;
              }
              let className = 'rct9k-timebar-item';
              if (i.isSelected) className += ' rct9k-timebar-item-selected';
              return (
                <span className={className} key={i.key} style={{width: intToPix(i.size)}}>
                  {topLabel}
                </span>
              );
            })}
          </div>
          <div className="rct9k-timebar-inner rct9k-timebar-inner-bottom">
            {_.map(bottomBarComponent, i => {
              let className = 'rct9k-timebar-item';
              if (i.isSelected) className += ' rct9k-timebar-item-selected';
              return (
                <span className={className} key={i.key} style={{width: intToPix(i.size)}}>
                  {i.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}

Timebar.propTypes = {
  cursorTime: PropTypes.any,
  groupTitleRenderer: PropTypes.func,
  start: PropTypes.object.isRequired, //moment
  end: PropTypes.object.isRequired, //moment
  width: PropTypes.number.isRequired,
  leftOffset: PropTypes.number,
  top_resolution: PropTypes.string,
  bottom_resolution: PropTypes.string,
  selectedRanges: PropTypes.arrayOf(PropTypes.object), // [start: moment ,end: moment (end)]
  timeFormats: PropTypes.object
};
Timebar.defaultProps = {
  selectedRanges: [],
  groupTitleRenderer: () => <div />,
  leftOffset: 0,
  timeFormats: defaultTimebarFormat
};
