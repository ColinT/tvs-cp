import * as React from 'react';
import * as ReactDOM from 'react-dom';

import 'bootstrap/dist/css/bootstrap.min.css';

class MainApp extends React.Component {
  render() {
    return (
      <div>
        <div className="jumbotron">
          <h1 className="display-4">This is just a temporary layout</h1>
          <p className="lead">Please don't make fun of me :(</p>
          <hr className="my-4" />
          <p>It uses utility classes for typography and spacing to space content out within the larger container.</p>
          <p className="lead">
            <a className="btn btn-primary btn-lg" href="#" role="button">
              Learn more
            </a>
          </p>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<MainApp />, document.getElementById('app'));
