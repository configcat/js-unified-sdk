import React, { Component } from 'react';
import configCatLogo from './assets/configcat.svg';
import reactLogo from './assets/react.svg';
import './App.css';
import * as configcat from '@configcat/sdk/browser';
import { LogLevel, PollingMode } from '@configcat/sdk/browser';
import Demo from './Demo.jsx';

class App extends Component {

  constructor(props) {
    super(props)
    // You can instantiate the client with different polling modes. See the Docs: https://configcat.com/docs/sdk-reference/js/#polling-modes
    this.client = configcat.getClient("configcat-sdk-1/PKDVCLf-Hq-h-kCzMp-L7Q/tiOvFw5gkky9LFu1Duuvzw", PollingMode.AutoPoll, { 
      pollIntervalSeconds: 2,
      logger: configcat.createConsoleLogger(LogLevel.Info) // Setting log level to Info to show detailed feature flag evaluation
    });
  }

  render() {
    return (
      <div className="wrapper">
        <div className="heading"><h1>Welcome to ConfigCat Sample app for React.js!</h1></div>
        <div className="logos">
          <img className="cat" width="100" alt="ConfigCat Logo" src={configCatLogo} />
          <span role="img" aria-label="heart" className="heart">❤️</span>
          <img width="140" alt="React Logo" src={reactLogo} />
        </div>
        <Demo client={this.client}></Demo>
      </div>
    );
  }
}

export default App;
