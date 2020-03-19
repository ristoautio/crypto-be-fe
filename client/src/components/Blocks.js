import * as React from "react";
import Block from "./Block";
import {Link} from "react-router-dom";


class Blocks extends React.Component {
    state = {blocks: []};

    componentDidMount() {
        fetch('/api/blocks')
            .then(res => res.json())
            .then(json => this.setState({blocks: json}))
    }

    render() {
        return (
            <React.Fragment>
                <div>
                    <Link to='/'>Home</Link>
                </div>
                {this.state.blocks.map((block, i) => (
                    <Block key={i} block={block}/>
                ))}
            </React.Fragment>
        );
    }
}

export default Blocks;
