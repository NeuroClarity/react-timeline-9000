'use strict';

import React, {Component} from 'react';
import moment from 'moment';
import _ from 'lodash';

import Timeline from './timeline';
import {customItemRenderer, customGroupRenderer} from 'demo/customRenderers';

import {Layout, Form, InputNumber, Button, DatePicker, Checkbox, Switch} from 'antd';
import 'antd/dist/antd.css';
import './style.css';

// Moment timezones can be enabled using the following
// import moment from 'moment-timezone';
// moment.locale('en-au');
// moment.tz.setDefault('Australia/Perth');

export default class DemoTimeline extends Component {
  constructor(props) {
    super(props);

    const startTime = moment();
    const endTime = startTime.clone().add(30, 'seconds');
    // const endTime = moment();
    this.state = {
      data: [
        {
          id: 'foo',
          data: [
            {x: 1, y: 1},
            {x: 2, y: 4},
            {x: 3, y: 2},
            {x: 4, y: 4},
            {x: 5, y: 2},
            {x: 6, y: 1},
            {x: 7, y: 4},
            {x: 8, y: 1},
            {x: 9, y: 4},
            {x: 10, y: 0},
            {x: 11, y: 4},
            {x: 12, y: 2},
            {x: 13, y: 2},
            {x: 14, y: 4}
          ]
        }
      ],
      rows: 3,
      startTime,
      endTime,
      selectedStart: startTime,
      selectedEnd: endTime,
      message: ''
    };
    this.zoomIn = this.zoomIn.bind(this);
    this.zoomOut = this.zoomOut.bind(this);
  }

  zoomIn() {
    let currentSecs = this.state.endTime.diff(this.state.startTime, 'seconds');
    let newSecs = currentSecs / 2;
    this.setState({endTime: this.state.startTime.clone().add(newSecs, 'seconds')});
  }

  zoomOut() {
    let currentSecs = this.state.endTime.diff(this.state.startTime, 'seconds');
    let newSecs = currentSecs * 2;
    this.setState({endTime: this.state.startTime.clone().add(newSecs, 'seconds')});
  }

  handleSelection = (startTime, endTime) => {
    this.setState({selectedStart: startTime.clone()});
    this.setState({selectedEnd: endTime.clone()});
    console.log(startTime.format('mm:ss'), endTime.format('mm:ss'));
  };

  render() {
    const {
      selectedItems,
      rows,
      items_per_row,
      snap,
      startTime,
      endTime,
      items,
      groups,
      message,
      useCustomRenderers,
      timelineMode,
      data
    } = this.state;

    return (
      <Layout className="layout">
        <Layout.Content>
          <div style={{margin: 24}}>
            <Form layout="inline">
              <Form.Item>
                <Button onClick={this.zoomIn}>Zoom in</Button>
              </Form.Item>
              <Form.Item>
                <Button onClick={this.zoomOut}>Zoom out</Button>
              </Form.Item>
            </Form>
            <div>
              <span>
                Selected: {this.state.selectedStart.format('mm:ss')}, {this.state.selectedEnd.format('mm:ss')}
              </span>
            </div>
          </div>
          <Timeline
            shallowUpdateCheck
            items={[]}
            groups={[
              {id: 0, title: 'EEG Signal'},
              {id: 1, title: 'Emotion'},
              {id: 2, title: 'Focus'}
            ]}
            startTime={startTime}
            endTime={endTime}
            data={data}
            timelineMode={timelineMode}
            handleSelection={this.handleSelection}
            groupRenderer={useCustomRenderers ? customGroupRenderer : undefined}
            groupTitleRenderer={useCustomRenderers ? () => <div>Group title</div> : undefined}
          />
        </Layout.Content>
      </Layout>
    );
  }
}
