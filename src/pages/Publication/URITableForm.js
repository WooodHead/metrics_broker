import React, { PureComponent, Fragment } from 'react';
import {
  Table,
  Button,
  Input,
  message,
  Popconfirm,
  Divider,
  Checkbox
} from 'antd';
import styles from './style.less';

export default class URITableForm extends PureComponent {
  index = 0;

  cacheOriginData = {};

  constructor(props) {
    super(props);

    this.state = {
      data: props.value,
      loading: false
    };
  }

  componentWillReceiveProps(nextProps) {
    if ('value' in nextProps) {
      this.index = nextProps.value ? nextProps.value.length : 0;
      this.setState({
        data: nextProps.value
      });
    }
  }

  getRowByKey(key, newData) {
    const { data } = this.state;
    return (newData || data).filter(item => item.key === key)[0];
  }

  getIndexByKey(key, newData) {
    const { data } = this.state;
    return (newData || data).indexOf(this.getRowByKey(key, newData));
  }

  toggleEditable = (e, key) => {
    e.preventDefault();
    const { data } = this.state;
    const newData = data.map(item => ({ ...item }));
    const target = this.getRowByKey(key, newData);
    const index = this.getIndexByKey(key, newData);
    if (target) {
      if (!target.editable) {
        this.cacheOriginData[key] = { ...target };
      }
      newData[index].editable = !target.editable;
      this.setState({ data: newData });
    }
  };

  newURI = () => {
    const { data } = this.state;
    const newData = data.map(item => ({ ...item }));
    newData.push({
      key: `URI_ID_${this.index}`,
      uri: '',
      canonical: false,
      editable: true,
      isNew: true
    });
    this.index += 1;
    this.setState({ data: newData });
  };

  remove(key) {
    const { data } = this.state;
    const { onChange } = this.props;
    const newData = data.filter(item => item.key !== key);
    this.setState({ data: newData });
    onChange(newData);
  }

  handleKeyPress(e, key) {
    if (e.key === 'Enter') {
      this.saveRow(e, key);
    }
  }

  handleFieldChange(e, fieldName, key) {
    const { data } = this.state;
    const newData = data.map(item => ({ ...item }));
    const target = this.getRowByKey(key, newData);
    if (target) {
      target[fieldName] =
        fieldName === 'canonical' ? e.target.checked : e.target.value;
      this.setState({ data: newData });
    }
  }

  saveRow(e, key) {
    e.persist();
    this.setState({
      loading: true
    });
    setTimeout(() => {
      if (this.clickedCancel) {
        this.clickedCancel = false;
        return;
      }
      const target = this.getRowByKey(key) || {};
      if (!target.uri) {
        message.error('Please complete the URIs section');
        e.target.focus();
        this.setState({
          loading: false
        });
        return;
      }
      this.toggleEditable(e, key);
      const { data } = this.state;
      const { onChange } = this.props;
      delete target.isNew;
      onChange(data);
      this.setState({
        loading: false
      });
    }, 500);
  }

  cancel(e, key) {
    this.clickedCancel = true;
    e.preventDefault();
    const { data } = this.state;
    const newData = data.map(item => ({ ...item }));
    const target = this.getRowByKey(key, newData);
    if (this.cacheOriginData[key]) {
      Object.assign(target, this.cacheOriginData[key]);
      target.editable = false;
      delete this.cacheOriginData[key];
    }
    this.setState({ data: newData });
    this.clickedCancel = false;
  }

  render() {
    const columns = [
      {
        title: 'URI',
        dataIndex: 'uri',
        key: 'uri',
        width: '80%',
        render: (text, record) => {
          if (record.editable) {
            return (
              <Input
                id={`uri-${record.key}`}
                value={text}
                autoFocus
                onChange={e => this.handleFieldChange(e, 'uri', record.key)}
                onKeyPress={e => this.handleKeyPress(e, record.key)}
                placeholder="URI"
              />
            );
          }
          return record.uri;
        }
      },
      {
        title: 'Canonical',
        dataIndex: 'canonical',
        key: 'canonical',
        render: (value, record) => {
          if (record.editable) {
            return (
              <Checkbox
                id={`uri-canonical-${record.key}`}
                checked={record.canonical}
                value={value}
                onChange={e =>
                  this.handleFieldChange(e, 'canonical', record.key)
                }
              />
            );
          }
          return record.canonical ? 'Yes' : 'No';
        }
      },
      {
        title: 'Actions',
        key: 'action',
        render: (text, record) => {
          const { loading } = this.state;
          if (!!record.editable && loading) {
            return null;
          }
          if (record.editable) {
            if (record.isNew) {
              return (
                <span>
                  <a
                    onClick={e => this.saveRow(e, record.key)}
                    id={`save-uri-btn-${record.key}`}
                  >
                    Save
                  </a>
                  <Divider type="vertical" />
                  <Popconfirm
                    title="Are you sure you want to delete this URI?"
                    onConfirm={() => this.remove(record.key)}
                  >
                    <a id={`delete-uri-btn-${record.key}`}>Delete</a>
                  </Popconfirm>
                </span>
              );
            }
            return (
              <span>
                <a
                  onClick={e => this.saveRow(e, record.key)}
                  id={`save-uri-btn-${record.key}`}
                >
                  Save
                </a>
                <Divider type="vertical" />
                <a onClick={e => this.cancel(e, record.key)}>Cancel</a>
              </span>
            );
          }
          return (
            <span>
              <a
                onClick={e => this.toggleEditable(e, record.key)}
                id={`edit-uri-btn-${record.key}`}
              >
                Edit
              </a>
              <Divider type="vertical" />
              <Popconfirm
                title="Are you sure you want to delete this URI?"
                onConfirm={() => this.remove(record.key)}
              >
                <a id={`delete-uri-btn-${record.key}`}>Delete</a>
              </Popconfirm>
            </span>
          );
        }
      }
    ];

    const { loading, data } = this.state;

    return (
      <Fragment>
        <Table
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={false}
          rowClassName={record => {
            return record.editable ? styles.editable : '';
          }}
        />
        <Button
          id="new-uri-btn"
          style={{ width: '100%', marginTop: 16, marginBottom: 8 }}
          type="dashed"
          onClick={this.newURI}
          icon="plus"
        >
          Add URI
        </Button>
      </Fragment>
    );
  }
}
