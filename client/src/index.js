import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './components/App';
import * as serviceWorker from './serviceWorker';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Route, Router, Switch} from "react-router-dom";
import history from './history';
import Blocks from "./components/Blocks";
import ConductTransaction from "./components/ConductTransaction";
import TransactionPool from "./components/TransactionPool";

ReactDOM.render(
    <Router history={history}>
        <Switch>
            <Route exact path='/' component={App}/>
            <Route exact path='/blocks' component={Blocks}/>
            <Route exact path='/transaction' component={ConductTransaction}/>
            <Route exact path='/transaction-pool' component={TransactionPool}/>
        </Switch>
    </Router>,
    document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
