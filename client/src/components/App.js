import React from 'react';
import Wallet from "./Wallet";
import Container from "reactstrap/es/Container";
import Row from "reactstrap/es/Row";
import {Link} from "react-router-dom";

const container = {
    maxWidth: '80%'
};

function App() {
  return (
    <div className="App">
        <Container style={container}>
            <Link to='/blocks'>Blocks</Link>
            <Link to='/transaction'>Transaction</Link>
            <Link to='/transaction-pool'>Transaction Pool</Link>
            <Row>
                <Wallet/>
            </Row>
        </Container>
    </div>
  );
}

export default App;
