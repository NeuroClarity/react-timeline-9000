'use strict';

import React, {Component} from 'react';
import moment from 'moment';
import _ from 'lodash';

import Timeline from './timeline';
import {customItemRenderer, customGroupRenderer} from 'demo/customRenderers';

import {Layout, Form, InputNumber, Button, DatePicker, Checkbox, Switch} from 'antd';
import 'antd/dist/antd.css';
import './style.css';

const {TIMELINE_MODES} = Timeline;

const ITEM_DURATIONS = [moment.duration(6, 'hours'), moment.duration(12, 'hours'), moment.duration(18, 'hours')];

const COLORS = ['#0099cc', '#f03a36', '#06ad96', '#fce05b', '#dd5900', '#cc6699'];

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
      selectedItems: [],
      rows: 3,
      items_per_row: 30,
      snap: 60,
      startTime,
      endTime,
      message: '',
      timelineMode: TIMELINE_MODES.SELECT | TIMELINE_MODES.DRAG | TIMELINE_MODES.RESIZE
    };
    this.reRender = this.reRender.bind(this);
    this.zoomIn = this.zoomIn.bind(this);
    this.zoomOut = this.zoomOut.bind(this);
    this.toggleSelectable = this.toggleSelectable.bind(this);
    this.toggleDraggable = this.toggleDraggable.bind(this);
    this.toggleResizable = this.toggleResizable.bind(this);
  }

  componentWillMount() {
    this.reRender();
  }

  reRender() {
    const list = [];
    const groups = [];
    const {snap} = this.state;

    this.key = 0;
    for (let i = 0; i < this.state.rows; i++) {
      groups.push({id: i, title: `Row ${i}`});
    }

    this.forceUpdate();
    this.setState({items: list, groups});
  }

  handleRowClick = (e, rowNumber, clickedTime, snappedClickedTime) => {
    const message = `Row Click row=${rowNumber} @ time/snapped=${clickedTime.toString()}/${snappedClickedTime.toString()}`;
    this.setState({selectedItems: [], message});
  };

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

  toggleSelectable() {
    const {timelineMode} = this.state;
    let newMode = timelineMode ^ TIMELINE_MODES.SELECT;
    this.setState({timelineMode: newMode, message: 'Timeline mode change: ' + timelineMode + ' -> ' + newMode});
  }

  toggleDraggable() {
    const {timelineMode} = this.state;
    let newMode = timelineMode ^ TIMELINE_MODES.DRAG;
    this.setState({timelineMode: newMode, message: 'Timeline mode change: ' + timelineMode + ' -> ' + newMode});
  }

  toggleResizable() {
    const {timelineMode} = this.state;
    let newMode = timelineMode ^ TIMELINE_MODES.RESIZE;
    this.setState({timelineMode: newMode, message: 'Timeline mode change: ' + timelineMode + ' -> ' + newMode});
  }

  handleItemClick = (e, key) => {
    const message = `Item Click ${key}`;
    const {selectedItems} = this.state;

    let newSelection = selectedItems.slice();

    // If the item is already selected, then unselected
    const idx = selectedItems.indexOf(key);
    if (idx > -1) {
      // Splice modifies in place and returns removed elements
      newSelection.splice(idx, 1);
    } else {
      newSelection.push(Number(key));
    }

    this.setState({selectedItems: newSelection, message});
  };

  handleItemDoubleClick = (e, key) => {
    const message = `Item Double Click ${key}`;
    this.setState({message});
  };

  handleItemContextClick = (e, key) => {
    const message = `Item Context ${key}`;
    this.setState({message});
  };

  handleRowDoubleClick = (e, rowNumber, clickedTime, snappedClickedTime) => {
    const message = `Row Double Click ${rowNumber}`;
    this.setState({message});
  };

  handleRowContextClick = (e, rowNumber, clickedTime, snappedClickedTime) => {
    const message = `Row Click row=${rowNumber} @ time/snapped=${clickedTime.toString()}/${snappedClickedTime.toString()}`;
    this.setState({message});
  };

  handleInteraction = (type, changes, items) => {
    /**
     * this is to appease the codefactor gods,
     * whose wrath condemns those who dare
     * repeat code beyond the sacred 5 lines...
     */
    function absorbChange(itemList, selectedItems) {
      itemList.forEach(item => {
        let i = selectedItems.find(i => {
          return i.key == item.key;
        });
        if (i) {
          item = i;
          item.title = moment.duration(item.end.diff(item.start)).humanize();
        }
      });
    }

    switch (type) {
      case Timeline.changeTypes.dragStart: {
        return this.state.selectedItems;
      }
      case Timeline.changeTypes.dragEnd: {
        const newItems = _.clone(this.state.items);

        absorbChange(newItems, items);
        this.setState({items: newItems});
        break;
      }
      case Timeline.changeTypes.resizeStart: {
        return this.state.selectedItems;
      }
      case Timeline.changeTypes.resizeEnd: {
        const newItems = _.clone(this.state.items);

        // Fold the changes into the item list
        absorbChange(newItems, items);

        this.setState({items: newItems});
        break;
      }
      case Timeline.changeTypes.itemsSelected: {
        this.setState({selectedItems: _.map(changes, 'key')});
        break;
      }
      default:
        return changes;
    }
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
      timelineMode
    } = this.state;
    const rangeValue = [startTime, endTime];

    const selectable = (TIMELINE_MODES.SELECT & timelineMode) === TIMELINE_MODES.SELECT;
    const draggable = (TIMELINE_MODES.DRAG & timelineMode) === TIMELINE_MODES.DRAG;
    const resizeable = (TIMELINE_MODES.RESIZE & timelineMode) === TIMELINE_MODES.RESIZE;

    const rowLayers = [];
    for (let i = 0; i < rows; i += 1) {
      if (i % 5 === 0 && i !== 0) {
        continue;
      }
      let curDate = startTime.clone();
      while (curDate.isSameOrBefore(endTime)) {
        const dayOfWeek = Number(curDate.format('d')); // 0 -> 6: Sun -> Sat
        let bandDuration = 0; // days
        let color = '';
        if (dayOfWeek % 6 === 0) {
          color = 'blue';
          bandDuration = dayOfWeek === 6 ? 2 : 1; // 2 if sat, 1 if sun
        } else {
          color = 'green';
          bandDuration = 6 - dayOfWeek;
        }

        rowLayers.push({
          start: curDate.clone(),
          end: curDate.clone().add(bandDuration, 'days'),
          style: {backgroundColor: color, opacity: '0.3'},
          rowNumber: i
        });
        curDate.add(bandDuration, 'days');
      }
    }

    return (
      <Layout className="layout">
        <Layout.Content>
          <div style={{margin: 24}}>
            <Form layout="inline">
              <Form.Item label="No rows">
                <InputNumber value={rows} onChange={e => this.setState({rows: e})} />
              </Form.Item>
              <Form.Item label="No items per row">
                <InputNumber value={items_per_row} onChange={e => this.setState({items_per_row: e})} />
              </Form.Item>
              <Form.Item label="Snap (mins)">
                <InputNumber value={snap} onChange={e => this.setState({snap: e})} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" onClick={() => this.reRender()}>
                  Regenerate
                </Button>
              </Form.Item>
              <Form.Item>
                <Button onClick={this.zoomIn}>Zoom in</Button>
              </Form.Item>
              <Form.Item>
                <Button onClick={this.zoomOut}>Zoom out</Button>
              </Form.Item>
              <Form.Item>
                <Checkbox onChange={this.toggleSelectable} checked={selectable}>
                  Enable selecting
                </Checkbox>
              </Form.Item>
              <Form.Item>
                <Checkbox onChange={this.toggleDraggable} checked={draggable}>
                  Enable dragging
                </Checkbox>
              </Form.Item>
              <Form.Item>
                <Checkbox onChange={this.toggleResizable} checked={resizeable}>
                  Enable resizing
                </Checkbox>
              </Form.Item>
            </Form>
            <div>
              <span>Debug: </span>
              {message}
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
            rowLayers={rowLayers}
            selectedItems={selectedItems}
            timelineMode={timelineMode}
            snapMinutes={snap}
            onItemClick={this.handleItemClick}
            onItemDoubleClick={this.handleItemDoubleClick}
            onItemContextClick={this.handleItemContextClick}
            onInteraction={this.handleInteraction}
            onRowClick={this.handleRowClick}
            onRowContextClick={this.handleRowContextClick}
            onRowDoubleClick={this.handleRowDoubleClick}
            itemRenderer={useCustomRenderers ? customItemRenderer : undefined}
            groupRenderer={useCustomRenderers ? customGroupRenderer : undefined}
            groupTitleRenderer={useCustomRenderers ? () => <div>Group title</div> : undefined}
          />
        </Layout.Content>
      </Layout>
    );
  }
}
