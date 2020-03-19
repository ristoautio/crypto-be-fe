import * as React from "react";
import {FormGroup, FormControl} from "react-bootstrap";
import {Link} from "react-router-dom";


class ConductTransaction extends React.Component {
    state = {
        recipient: '',
        amount: 0
    };

    updateRecipient = (event) => this.setState({recipient: event.target.value});
    updateAmount = (event) => this.setState({amount: Number(event.target.value)});

    render() {
        return (
            <div>
                <Link to='/'>Home</Link>
                <h3>Conduct transaction</h3>
                <FormGroup>
                    <FormControl input='text' placeholder='recipient' value={this.state.recipient} onChange={this.updateRecipient}/>
                </FormGroup>
                <FormGroup>
                    <FormControl input='number' placeholder='amount' value={this.state.amount} onChange={this.updateAmount}/>
                </FormGroup>
            </div>
        )
    }
}

export default ConductTransaction;
