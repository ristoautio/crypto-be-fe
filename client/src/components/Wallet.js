import * as React from "react";
import {Card, CardBody, CardSubtitle, CardText, CardTitle} from "reactstrap";


class Wallet extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            address: '',
            balance: ''
        };
    }

    componentDidMount() {
        fetch('/api/wallet-info')
            .then(res => res.json())
            .then((json)=> this.setState(json));
    }

    render() {
        return (
            <Card>
                <CardBody>
                    <CardTitle>Wallet info</CardTitle>
                    <CardSubtitle>Card subtitle</CardSubtitle>

                    <CardText>Some quick example text to build on the card title and make up the bulk of the card's content.</CardText>
                    <CardText>Address: {this.state.address}</CardText>
                    <CardText>Balance: {this.state.balance}</CardText>
                </CardBody>
            </Card>
        );
    }
}

export default Wallet;
