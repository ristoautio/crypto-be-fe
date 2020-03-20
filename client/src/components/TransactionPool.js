import * as React from "react";
import {Link} from "react-router-dom";
import Transaction from "./Transaction";
import {Button} from "react-bootstrap";
import history from '../history';

class TransactionPool extends React.Component{
    state = {transactionPoolMap: {}};

    fetchTransactionPool = () => {
        fetch('/api/transaction-pool-map')
            .then(res => res.json())
            .then(json => this.setState({transactionPoolMap: json}))
    };

    mineTransaction = () => {
        fetch('/api/mine-transactions')
            .then(res => history.push('/blocks'));
    };

    componentDidMount() {
        this.fetchTransactionPool();
        this.interval = setInterval(this.fetchTransactionPool, 5000);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    render() {
        return (
            <div>
                <Link to='/'>Home</Link>

                <h3>Transaction Pool</h3>

                {Object.values(this.state.transactionPoolMap).map(t => (
                    <div key={t.id}>
                        <Transaction transaction={t}/>
                    </div>
                ))}

                <hr/>
                <Button onClick={this.mineTransaction}>Mine transactions</Button>
            </div>
        )
    }
}

export default TransactionPool;
