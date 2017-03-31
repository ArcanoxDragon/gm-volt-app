import * as React from "react";

export abstract class AsyncComponent<P, S> extends React.Component<P, S> {
    protected async setStateAsync<K extends keyof S>( state: Pick<S, K> ): Promise<void> {
        return new Promise<void>( res => this.setState( state, res ) );
    }
}