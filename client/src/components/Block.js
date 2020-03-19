import * as React from "react";
import CardHeader from "reactstrap/es/CardHeader";
import CardText from "reactstrap/es/CardText";
import {Card} from "reactstrap";
import Transaction from "./Transaction";

const blockCard = {
    minWidth: '60%'
};

class Block extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            displayBlock: false
        }
    }

    toggleTransaction = () => this.setState({displayBlock: !this.state.displayBlock});

    render() {
        const {timestamp, hash, data} = this.props.block;
        const stringData = JSON.stringify(data);


        return (
            <Card onClick={this.toggleTransaction} style={blockCard}>
                <CardHeader>{hash}</CardHeader>
                <CardText>{timestamp}</CardText>

                {data.data && data.data.map(transaction => (
                    <Transaction key={transaction} transaction={transaction}/>
                ))}
                {this.state.displayBlock && (
                    <CardText>{stringData}</CardText>
                )}
                {!this.state.displayBlock && (
                    <CardText>{stringData.substring(0, 30)}</CardText>
                )}
            </Card>
        );
    }
}

export default Block;
